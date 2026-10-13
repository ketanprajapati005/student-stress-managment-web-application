// Shared wrapper for the Vercel functions in /api. They run the same handlers as the
// Express server in /backend, so the AI pages work on the deployed site without it.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Only signed-in users may call the AI endpoints, so the public URL can't be used
// to spend the OpenRouter credits.
async function isSignedIn(req) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return false;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authorization },
  });
  return response.ok;
}

export function createHandler(handle) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase environment variables are not configured" });
    }

    try {
      if (!(await isSignedIn(req))) {
        return res.status(401).json({ error: "Please sign in again" });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      return res.status(502).json({ error: "Could not verify your session" });
    }

    const { status, body } = await handle(req.body ?? {});
    res.status(status).json(body);
  };
}
