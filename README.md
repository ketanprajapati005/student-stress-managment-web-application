# Student Stress Management Web Application
A smart platform helping students manage stress through mood tracking, personalized tips, and wellbeing insights, promoting healthier habits and better academic balance.

## Project layout

- `src/` – React + Vite frontend (Supabase auth and data).
- `supabase/` – database migrations and the `ai-coach` / `ai-recommendations` edge functions.
- `backend/` – Express API used by the AI Assistant, Stress Predictor, Study Planner and Uploads pages.

## Running locally

```sh
# Frontend
npm install
npm run dev            # http://localhost:5173

# Backend (in another terminal)
cd backend
cp .env.example .env   # then set GEMINI_API_KEY or OPENROUTER_API_KEY
npm install
npm run dev            # http://localhost:4000
```

In development the frontend calls the backend at `http://localhost:4000/api`. In production (Vercel) the AI Assistant, Stress Predictor and Study Planner use the serverless functions in `api/`, which run the same code as the backend. Set these in Vercel → Settings → Environment Variables:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` – used by the frontend and to check the user is signed in
- `GEMINI_API_KEY` (free tier at https://aistudio.google.com/apikey) or `OPENROUTER_API_KEY` – used by the AI functions. Gemini is used when both are set. Optional: `GEMINI_MODEL`, `OPENROUTER_MODEL`

Set `VITE_API_BASE_URL` to point the frontend at a different API.

The Supabase edge functions read `LOVABLE_API_KEY`, `OPENROUTER_API_KEY` or `GEMINI_API_KEY` from the function secrets (`supabase secrets set ...`). Never put AI keys in a `VITE_` variable: those are bundled into the public frontend.

## Checks

```sh
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
