import axios from "axios";

// Empty in production: the browser calls /api/* on the frontend's own
// domain and Vercel (vercel.json) or Vite (vite.config.js) proxies it to the
// API. That keeps the session cookie first-party, which Safari and Firefox
// require. Set it only to call an API on another origin directly.
const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_URL,

  withCredentials: true,
});

// Generated files are stored as gateway paths ("/api/agent/file/...");
// point them at the API server rather than the frontend origin.
export const apiUrl = (url) =>
  typeof url === "string" && url.startsWith("/api/")
    ? `${API_URL}${url}`
    : url;

export default api;
