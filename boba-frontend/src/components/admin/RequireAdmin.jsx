import { Navigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/adminAuthStore";

export default function RequireAdmin({ children }) {
  const token = useAdminAuthStore((s) => s.token);
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}