import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/adminAuthStore";

const tabClass =
  "shrink-0 whitespace-nowrap rounded-xl border font-bold transition " +
  "px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base";

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAdminAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        {/* Header row */}
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold leading-tight">
                Admin Panel
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Orders & menu management
              </p>
            </div>

            <button
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
              className="w-full sm:w-auto rounded-xl bg-slate-100 px-4 py-2.5 text-sm sm:text-base font-semibold hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs / Nav */}
        <nav className="border-t border-slate-100">
          {/* 
            -mx-4 lets the scroll area reach screen edges (feels more native on mobile)
            snap-x makes it easier to swipe between tabs
          */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-6 lg:px-10 pb-3">
            <div className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory">
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  `${tabClass} snap-start ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`
                }
              >
                Orders
              </NavLink>

              <NavLink
                to="/admin/reports/sales"
                className={({ isActive }) =>
                  `${tabClass} snap-start ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`
                }
              >
                Sales Report
              </NavLink>

              <NavLink
                to="/admin/menu/items"
                className={({ isActive }) =>
                  `${tabClass} snap-start ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`
                }
              >
                Items
              </NavLink>

              <NavLink
                to="/admin/menu/categories"
                className={({ isActive }) =>
                  `${tabClass} snap-start ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`
                }
              >
                Categories
              </NavLink>

              <NavLink
                to="/admin/menu/options"
                className={({ isActive }) =>
                  `${tabClass} snap-start ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`
                }
              >
                Option Groups & Options
              </NavLink>
            </div>
          </div>
        </nav>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}