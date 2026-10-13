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
cp .env.example .env   # then set OPENROUTER_API_KEY
npm install
npm run dev            # http://localhost:4000
```

The frontend calls the backend at `http://localhost:4000/api` by default; set `VITE_API_BASE_URL` to point it elsewhere.

The Supabase edge functions read `LOVABLE_API_KEY`, `OPENROUTER_API_KEY` or `GEMINI_API_KEY` from the function secrets (`supabase secrets set ...`). Never put AI keys in a `VITE_` variable: those are bundled into the public frontend.

## Checks

```sh
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
