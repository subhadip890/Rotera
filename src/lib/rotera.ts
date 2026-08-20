export type SeatStatus = "paid" | "waiting" | "late";

export type Member = {
  id: string;
  name: string;
  address: string;
  status: SeatStatus;
  onTime: number;
  lateCount: number;
};

export type PayoutRecord = {
  cycle: number;
  recipient: string;
  amount: number;
  date: string;
  note?: string;
};

export type Circle = {
  id: string;
  name: string;
  amount: number;
  asset: "XLM" | "USDC";
  cadence: "Weekly" | "Every two weeks" | "Monthly";
  members: Member[];
  currentCycle: number;
  currentSeat: number;
  cutoff: number;
  seedNote?: string;
  history: PayoutRecord[];
};

export const YOU_ID = "m-you";

export function makeDemoCircle(): Circle {
  const now = Date.now();
  return {
    id: "sunday-six",
    name: "Sunday Six",
    amount: 200,
    asset: "XLM",
    cadence: "Weekly",
    currentCycle: 4,
    currentSeat: 3,
    cutoff: now + 1000 * 60 * 60 * 39 + 1000 * 60 * 12,
    seedNote: "Order drawn 12 Feb from block 54,203,118 — everyone watched.",
    members: [
      {
        id: "m-priya",
        name: "Priya",
        address: "GDQP2K...4XZ7",
        status: "paid",
        onTime: 4,
        lateCount: 0,
      },
      {
        id: "m-tunde",
        name: "Tunde",
        address: "GBRPYH...M2QK",
        status: "paid",
        onTime: 4,
        lateCount: 0,
      },
      {
        id: "m-mariela",
        name: "Mariela",
        address: "GA7QYN...L9FD",
        status: "paid",
        onTime: 3,
        lateCount: 1,
      },
      {
        id: YOU_ID,
        name: "You",
        address: "GCKFBE...T3WA",
        status: "waiting",
        onTime: 3,
        lateCount: 0,
      },
      {
        id: "m-samir",
        name: "Samir",
        address: "GDX5NQ...P8VC",
        status: "late",
        onTime: 2,
        lateCount: 2,
      },
      {
        id: "m-nomsa",
        name: "Nomsa",
        address: "GBZTHC...R6JE",
        status: "waiting",
        onTime: 4,
        lateCount: 0,
      },
    ],
    history: [
      {
        cycle: 1,
        recipient: "Priya",
        amount: 1200,
        date: "12 Feb",
        note: "Paid out on time, all six contributed.",
      },
      {
        cycle: 2,
        recipient: "Tunde",
        amount: 1200,
        date: "19 Feb",
        note: "Paid out on time, all six contributed.",
      },
      {
        cycle: 3,
        recipient: "Mariela",
        amount: 1200,
        date: "26 Feb",
        note: "Samir paid two days after cutoff.",
      },
    ],
  };
}

export function formatAmount(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function truncate(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function countdown(target: number, from: number) {
  const ms = Math.max(0, target - from);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function potTotal(circle: Circle) {
  return circle.amount * circle.members.length;
}

export function randomizeOrder(names: string[]) {
  const seed = Math.floor(Math.random() * 1_000_000);
  let x = seed;
  const next = () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
  const order = [...names];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const a = order[i] as string;
    order[i] = order[j] as string;
    order[j] = a;
  }
  return { order, seed };
}

/**
 * Format cycle duration for display.
 * In accelerated Testnet demo mode (VITE_ENABLE_TEST_CYCLES=true),
 * timing values are interpreted as seconds (e.g. 10s, 30s, 60s, 300s = 5 minutes).
 * In standard/production mode, values are interpreted as days (e.g. 7 = Weekly, 14 = Every two weeks, 30 = Monthly).
 *
 * @param value - Stored cycle_length_days (seconds in test mode, days in prod)
 * @returns Human-readable duration string
 */
export function formatCycleDuration(value: number): string {
  const isTestMode = import.meta.env["VITE_ENABLE_TEST_CYCLES"] === "true";
  if (isTestMode) {
    if (value === 10) return "10 seconds";
    if (value === 30) return "30 seconds";
    if (value === 60) return "60 seconds";
    if (value === 300) return "5 minutes";
    if (value < 60) return `${value} seconds`;
    if (value % 60 === 0) {
      const mins = value / 60;
      return `${mins} minute${mins !== 1 ? "s" : ""}`;
    }
    return `${value} seconds`;
  }

  // Production / non-test mode
  if (value === 7) return "Weekly";
  if (value === 14) return "Every two weeks";
  if (value === 30) return "Monthly";
  return `${value} days`;
}
