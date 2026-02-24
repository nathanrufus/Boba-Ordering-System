import { publicHttp } from "./http";

export async function createOrder(payload) {
  const res = await publicHttp.post("/api/orders", payload);
  return res.data;
}

export async function getOrderByOrderNumber(orderNumber) {
  const res = await publicHttp.get(`/api/orders/${encodeURIComponent(orderNumber)}`);
  return res.data;
}