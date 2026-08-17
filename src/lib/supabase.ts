/**
 * SQL MIGRATION: Paste into Supabase SQL Editor to support realtime events and user feedback:
 *
 * -- Table: feedback
 * create table if not exists feedback (
 *   id uuid default gen_random_uuid() primary key,
 *   rating text not null,
 *   comment text,
 *   wallet_address text,
 *   page_url text,
 *   created_at timestamptz default now()
 * );
 *
 * -- Table: circle_events
 * create table if not exists circle_events (
 *   id uuid default gen_random_uuid() primary key,
 *   circle_id text not null,
 *   event_type text not null,
 *   caller text,
 *   data jsonb default '{}'::jsonb,
 *   created_at timestamptz default now()
 * );
 *
 * alter publication supabase_realtime add table circle_events;
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Returns true only when both credentials look like real Supabase values.
 * Guards against placeholder/dummy keys making failed network requests.
 *
 * Real Supabase URL:      https://<project-ref>.supabase.co
 * Real Supabase anon key: a JWT (three base64url segments separated by dots),
 *                         typically ~200+ characters, does NOT end with '.dummy'
 */
function isRealSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  // URL must be a valid-looking supabase.co endpoint
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) return false;
  // Key must look like a JWT: three dot-separated segments, >= 100 chars total
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  if (key.length < 100) return false;
  // Reject obvious placeholders
  if (key.endsWith(".dummy") || key.toLowerCase().includes("placeholder")) return false;
  return true;
}

const CLIENT_READY = isRealSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabase = CLIENT_READY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export interface FeedbackData {
  wallet_address?: string | null;
  rating: number;
  comment?: string;
  page?: string;
}

/**
 * Insert a feedback row into the Supabase `feedback` table.
 *
 * Returns:
 *  - true  — row inserted successfully
 *  - false — insert failed (caller should show an error to the user)
 *  - undefined-like: if no Supabase config, logs locally and returns true
 *    (dev/demo mode — not a real insert)
 */
export async function submitFeedbackToSupabase(data: FeedbackData): Promise<boolean> {
  if (!supabase) {
    // No real credentials configured — log locally for dev/demo purposes.
    // The FeedbackWidget will show success, but nothing is persisted.
    console.log("[Rotera Feedback] Supabase not configured — logged locally:", data);
    return false; // Return false so the caller knows it was NOT persisted
  }

  try {
    const { error } = await supabase.from("feedback").insert([
      {
        wallet_address: data.wallet_address ?? null,
        rating: data.rating,
        comment: data.comment?.trim() ?? "",
        page: data.page ?? (typeof window !== "undefined" ? window.location.pathname : "/"),
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("[Rotera Feedback] Insert error:", error.message, error.code);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Rotera Feedback] Unexpected error:", err);
    return false;
  }
}

// ─── Circle Event & History Tracking ─────────────────────────────────────────

export interface CircleEventRecord {
  id?: number;
  circle_id: string;
  event_type:
    | "circle_created"
    | "circle_joined"
    | "contribution"
    | "cycle_closed"
    | "debt_repaid"
    | "deposit_withdrawn";
  wallet_address?: string | null;
  amount_xlm?: number | null;
  tx_hash?: string | null;
  details?: Record<string, any>;
  created_at?: string;
}

/**
 * Record a circle event (create, join, contribute, close cycle, repay debt) to Supabase.
 */
export async function recordCircleEventToSupabase(event: CircleEventRecord): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("circle_events").insert([
      {
        circle_id: String(event.circle_id),
        event_type: event.event_type,
        wallet_address: event.wallet_address ?? null,
        amount_xlm: event.amount_xlm ?? null,
        tx_hash: event.tx_hash ?? null,
        details: event.details ?? {},
        created_at: event.created_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn("[Rotera Supabase Event] Insert error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[Rotera Supabase Event] Unexpected error:", err);
    return false;
  }
}

/**
 * Fetch historical events for a circle (or all circles) from Supabase.
 */
export async function fetchCircleEventsFromSupabase(
  circleId?: string | number | null,
): Promise<CircleEventRecord[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from("circle_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (circleId) {
      query = query.eq("circle_id", String(circleId));
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as CircleEventRecord[];
  } catch (err) {
    console.warn("[Rotera Supabase Event Fetch] Error:", err);
    return [];
  }
}

/**
 * Subscribe to realtime circle events from Supabase.
 * Triggers onEvent callback whenever a new event is inserted for the given circle.
 */
export function subscribeCircleEvents(
  circleId: string | number | null | undefined,
  onEvent: (event: CircleEventRecord) => void,
): () => void {
  if (!supabase || !circleId) return () => {};

  try {
    const channel = supabase
      .channel(`circle_events_${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "circle_events",
          filter: `circle_id=eq.${String(circleId)}`,
        },
        (payload) => {
          if (payload.new) {
            onEvent(payload.new as CircleEventRecord);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[Rotera Supabase Event Subscribe] Error:", err);
    return () => {};
  }
}
