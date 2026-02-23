import { adminApi } from "./adminApi";

// GET /api/admin/orders?status=&from=&to=&page=&limit=
export async function fetchAdminOrders({ status, page = 1, limit = 20, from, to }) {
  const params = { page, limit };
  if (status) params.status = status;
  if (from) params.from = from; // YYYY-MM-DD
  if (to) params.to = to;       // YYYY-MM-DD

  const res = await adminApi.get("/orders", { params });
  return res.data; // { page, limit, total, orders: [...] }
}

// GET /api/admin/orders/:id
export async function fetchAdminOrderById(id) {
  const res = await adminApi.get(`/orders/${id}`);
  return res.data;
}

// PATCH /api/admin/orders/:id/status  body: { status }
export async function patchAdminOrderStatus({ id, status }) {
  const res = await adminApi.patch(`/orders/${id}/status`, { status });
  return res.data; // { id, status }
}