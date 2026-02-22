import { publicHttp } from "./http";

export async function getMenu() {
  const res = await publicHttp.get("/api/menu");
  return res.data;
}