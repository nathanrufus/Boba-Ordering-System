import axios from "axios";

export const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/admin`,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});