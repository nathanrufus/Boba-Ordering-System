import { publicHttp } from "./http";

export async function createOrder(payload) {
  const res = await publicHttp.post("/api/orders", payload);
  return res.data;
}