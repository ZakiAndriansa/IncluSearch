// Client-safe Midtrans helpers (no server-only imports — safe in "use client").
//
// The environment is derived purely from the client key's prefix: Midtrans
// sandbox keys start with "SB-", production keys do not. This keeps the
// frontend Snap.js in lock-step with whatever keys the backend is configured
// with — there is no separate sandbox flag to keep in sync or forget.

export function isSandboxKey(clientKey: string | null | undefined): boolean {
  return (clientKey ?? "").startsWith("SB-");
}

/** URL of the Midtrans Snap.js to load for the given client key. */
export function snapScriptUrl(clientKey: string | null | undefined): string {
  return isSandboxKey(clientKey)
    ? "https://app.sandbox.midtrans.com/snap/snap.js"
    : "https://app.midtrans.com/snap/snap.js";
}
