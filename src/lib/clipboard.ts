/**
 * Copies text to the system clipboard reliably.
 *
 * Strategy:
 *  1. Modern Clipboard API (navigator.clipboard.writeText) — works on HTTPS in modern browsers.
 *  2. Legacy execCommand fallback — for browsers where Clipboard API is unavailable or denied.
 *
 * SSR-safe: never accesses window/document/navigator at module evaluation time.
 *
 * @returns Promise<true> on success, Promise<false> on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Guard: must be browser environment (SSR-safe)
  if (typeof window === "undefined") return false;

  // 1. Prefer modern Clipboard API (requires HTTPS or localhost)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback
    }
  }

  // 2. Legacy fallback: temporary textarea + execCommand('copy')
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Position off-screen so it doesn't cause layout shift
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
