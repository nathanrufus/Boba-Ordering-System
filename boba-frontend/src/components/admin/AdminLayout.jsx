import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/adminAuthStore";

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAdminAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">Admin Panel</h1>
            <p className="text-slate-600">Orders & menu management</p>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-semibold hover:bg-slate-200"
          >
            Logout
          </button>
        </div>

        <nav className="w-full px-4 sm:px-6 lg:px-10 pb-3 flex gap-2 overflow-x-auto">
          {/* ✅ NEW: Orders */}
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-base font-bold border ${
                isActive ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"
              }`
            }
          >
            Orders
          </NavLink>

          {/* ✅ NEW: Reports */}
          <NavLink
            to="/admin/reports/sales"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-base font-bold border ${
                isActive ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"
              }`
            }
          >
            Sales Report
          </NavLink>

          {/* Existing */}
          <NavLink
            to="/admin/menu/items"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-base font-bold border ${
                isActive ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"
              }`
            }
          >
            Items
          </NavLink>

          <NavLink
            to="/admin/menu/categories"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-base font-bold border ${
                isActive ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"
              }`
            }
          >
            Categories
          </NavLink>

          <NavLink
            to="/admin/menu/options"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-base font-bold border ${
                isActive ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"
              }`
            }
          >
            Option Groups & Options
          </NavLink>
        </nav>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}