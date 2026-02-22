import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const publicHttp = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Admin client (you’ll use this in Phase 5+)
export const adminHttp = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

adminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});