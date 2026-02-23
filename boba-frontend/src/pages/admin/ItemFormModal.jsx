import { useEffect, useState } from "react";
import {
  createItemJson,
  createItemMultipart,
  updateItemJson,
  updateItemMultipart,
} from "../../api/adminMenu";

export default function ItemFormModal({ open, mode, item, categories, onClose, onSaved }) {
  const isEdit = mode === "edit";

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("0.00");
  const [imageFile, setImageFile] = useState(null);
  const [useUpload, setUseUpload] = useState(true);

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr("");
    setImageFile(null);

    if (isEdit && item) {
      setCategoryId(String(item.categoryId ?? item.category_id ?? ""));
      setName(item.name ?? "");
      setDescription(item.description ?? "");
      setBasePrice(String(item.basePrice ?? item.base_price ?? "0.00"));
    } else {
      setCategoryId(categories?.[0]?.id ? String(categories[0].id) : "");
      setName("");
      setDescription("");
      setBasePrice("0.00");
    }
  }, [open, isEdit, item, categories]);

  if (!open) return null;

  async function handleSave() {
    setErr("");
    setSaving(true);

    try {
      if (!categoryId) throw new Error("categoryId is required");
      if (!name.trim()) throw new Error("name is required");
      if (!basePrice.trim()) throw new Error("basePrice is required");

      // If uploading file, use multipart with field "image"
      if (useUpload && imageFile) {
        const fd = new FormData();
        fd.append("categoryId", String(categoryId));
        fd.append("name", name.trim());
        fd.append("description", description.trim());
        fd.append("basePrice", basePrice.trim()); // keep string
        fd.append("image", imageFile); // ✅ EXACT field name your backend expects

        if (isEdit) await updateItemMultipart(item.id, fd);
        else await createItemMultipart(fd);
      } else {
        // JSON path
        const payload = {
          categoryId: Number(categoryId),
          name: name.trim(),
          description: description.trim() || null,
          basePrice: basePrice.trim(), // keep string
          // imageUrl is not sent here because your backend route handles upload;
          // if your controller supports imageUrl string, add it here.
        };

        if (isEdit) await updateItemJson(item.id, payload);
        else await createItemJson(payload);
      }

      onSaved?.();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-6">
          <h3 className="text-xl font-extrabold">
            {isEdit ? "Edit Item" : "Create Item"}
          </h3>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {err}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                placeholder="Classic Milk Tea"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                placeholder="Black tea + milk"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Base Price (string)</label>
              <input
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                placeholder="150.00"
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-extrabold">Image Upload</p>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={useUpload}
                    onChange={(e) => setUseUpload(e.target.checked)}
                  />
                  Use upload
                </label>
              </div>

              <p className="text-sm text-slate-600 mt-1">
                Upload uses multipart/form-data with field name <b>image</b>.
              </p>

              <input
                type="file"
                accept="image/*"
                className="mt-3 w-full"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-base font-extrabold hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}