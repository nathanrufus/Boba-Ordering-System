import { adminHttp } from "./http";

// -------- Categories --------
export async function listCategories() {
  const res = await adminHttp.get("/api/admin/categories");
  return res.data;
}

export async function createCategory(payload) {
  const res = await adminHttp.post("/api/admin/categories", payload);
  return res.data;
}

export async function updateCategory(id, payload) {
  const res = await adminHttp.patch(`/api/admin/categories/${id}`, payload);
  return res.data;
}

export async function setCategoryActive(id, payload) {
  // payload should match validator (commonly: { isActive: true/false })
  const res = await adminHttp.patch(`/api/admin/categories/${id}/active`, payload);
  return res.data;
}

// -------- Items --------
export async function listItems() {
  const res = await adminHttp.get("/api/admin/items");
  return res.data;
}

export async function createItemJson(payload) {
  const res = await adminHttp.post("/api/admin/items", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

export async function createItemMultipart(formData) {
  const res = await adminHttp.post("/api/admin/items", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateItemJson(id, payload) {
  const res = await adminHttp.patch(`/api/admin/items/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

export async function updateItemMultipart(id, formData) {
  const res = await adminHttp.patch(`/api/admin/items/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function setItemActive(id, payload) {
  const res = await adminHttp.patch(`/api/admin/items/${id}/active`, payload);
  return res.data;
}

// -------- Option Groups / Options --------
export async function listOptionGroups() {
  const res = await adminHttp.get("/api/admin/option-groups");
  return res.data;
}

export async function createOptionGroup(payload) {
  const res = await adminHttp.post("/api/admin/option-groups", payload);
  return res.data;
}

export async function updateOptionGroup(id, payload) {
  const res = await adminHttp.patch(`/api/admin/option-groups/${id}`, payload);
  return res.data;
}

export async function listOptions(optionGroupId) {
  // your backend must support a GET. If your route differs, change this one line.
  const res = await adminHttp.get(`/api/admin/options`, {
    params: optionGroupId ? { optionGroupId } : undefined,
  });
  return res.data;
}

export async function createOption(payload) {
  const res = await adminHttp.post("/api/admin/options", payload);
  return res.data;
}

export async function updateOption(id, payload) {
  const res = await adminHttp.patch(`/api/admin/options/${id}`, payload);
  return res.data;
}

// -------- Map option groups to item (replace) --------
export async function setItemOptionGroups(itemId, optionGroupIds) {
  const res = await adminHttp.post(`/api/admin/items/${itemId}/option-groups`, {
    optionGroupIds,
  });
  return res.data;
}