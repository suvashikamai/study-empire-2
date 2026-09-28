// Thin client-side fetch wrapper: JSON in/out, throws a plain Error with
// the server's message so callers can show it directly (spec 52: never
// show raw backend errors — the server already sanitizes these).
export async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return body as T;
}
