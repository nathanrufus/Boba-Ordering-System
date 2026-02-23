import { publicHttp } from "./http";

// Reuse the same baseURL/proxy config that already works,
// just attach the admin token automatically.
export const adminHttp = publicHttp;

adminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});