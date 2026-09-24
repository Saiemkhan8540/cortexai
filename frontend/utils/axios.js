import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,

  withCredentials: true,
});

// Generated files are stored as gateway paths ("/api/agent/file/...");
// point them at the API server rather than the frontend origin.
export const apiUrl = (url) =>
  typeof url === "string" && url.startsWith("/api/")
    ? `${import.meta.env.VITE_SERVER_URL}${url}`
    : url;

export default api;