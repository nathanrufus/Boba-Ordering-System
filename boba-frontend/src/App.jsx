import { Routes, Route, Navigate } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";

import AdminItemsPage from "./pages/admin/AdminItemsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminOptionsPage from "./pages/admin/AdminOptionsPage";

// ✅ NEW imports
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminSalesReportPage from "./pages/admin/AdminSalesReportPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<MenuPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* ✅ Order detail route must be a sibling (not inside AdminLayout),
          because AdminLayout's header/nav shouldn't break and you want /admin/orders/:id */}
      <Route
        path="/admin/orders/:id"
        element={
          <RequireAdmin>
            <AdminOrderDetailPage />
          </RequireAdmin>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        {/* ✅ NEW routes */}
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="reports/sales" element={<AdminSalesReportPage />} />

        {/* Existing menu mgmt */}
        <Route path="menu/items" element={<AdminItemsPage />} />
        <Route path="menu/categories" element={<AdminCategoriesPage />} />
        <Route path="menu/options" element={<AdminOptionsPage />} />

        {/* Default */}
        <Route index element={<Navigate to="menu/items" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}