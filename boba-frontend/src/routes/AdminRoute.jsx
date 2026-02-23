import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuthStore } from "../store/adminAuthStore";

export default function AdminRoute() {
  const adminToken = useAdminAuthStore((s) => s.adminToken);
  const admin = useAdminAuthStore((s) => s.admin);
  const hydrate = useAdminAuthStore((s) => s.hydrate);
  const isHydrating = useAdminAuthStore((s) => s.isHydrating);

  useEffect(() => {
    // validate token + load admin once
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While verifying token, show a simple loading state
  if (isHydrating) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-base font-bold">Checking session…</p>
        </div>
      </div>
    );
  }

  // No token or token invalid
  if (!adminToken || !admin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}