import { supabase } from "@/integrations/supabase/client";

// Base URL of the AI API. In production it's the Vercel functions in /api on the same
// site; in development it's the Express server in /backend. Set VITE_API_BASE_URL to override.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

// POST JSON to the AI API as the signed-in user. Throws with the server's error message.
export async function postApi<T>(path: string, body: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data as T;
}
