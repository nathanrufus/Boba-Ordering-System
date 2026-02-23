import { create } from "zustand";
import { adminHttp } from "../api/http";

export const useAdminAuthStore = create((set) => ({
  token: localStorage.getItem("adminToken") || "",

  setToken: (token) => {
    localStorage.setItem("adminToken", token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem("adminToken");
    set({ token: "" });
  },

  // Optional: verify token
  me: async () => {
    const res = await adminHttp.get("/api/admin/auth/me");
    return res.data;
  },
}));