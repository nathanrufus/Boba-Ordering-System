import { adminHttp } from "./adminHttp";

export async function fetchSalesReport({ from, to }) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;

  const res = await adminHttp.get("/api/admin/reports/sales", { params });
  return res.data;
}