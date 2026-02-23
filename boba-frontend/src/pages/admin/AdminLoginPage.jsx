import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminHttp } from "../../api/http";
import { useAdminAuthStore } from "../../store/adminAuthStore";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const setToken = useAdminAuthStore((s) => s.setToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      const res = await adminHttp.post("/api/admin/auth/login", { email, password });
      const token = res.data?.token;
      if (!token) throw new Error("Token missing from response");
      setToken(token);
      navigate("/admin/menu/items");
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/90 shadow-lg p-6">
        <h1 className="text-2xl font-extrabold">Admin Login</h1>
        <p className="text-slate-600 mt-1">Sign in to manage menu items</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
            {err}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bobabros.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="w-full rounded-2xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}