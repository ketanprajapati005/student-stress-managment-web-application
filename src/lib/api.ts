// Base URL of the Express backend in /backend. Set VITE_API_BASE_URL for deployed builds.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
