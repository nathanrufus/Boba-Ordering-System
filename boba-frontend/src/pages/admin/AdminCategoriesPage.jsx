import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  createCategory,
  updateCategory,
  setCategoryActive,
} from "../../api/adminMenu";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [edit, setEdit] = useState(null); // {id, name, sortOrder}

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: listCategories,
  });

  const categories = useMemo(() => {
    // supports [] or {categories:[]}
    return Array.isArray(data) ? data : data?.categories || [];
  }, [data]);

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setName("");
      setSortOrder("1");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: () => {
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const activeMut = useMutation({
    mutationFn: ({ id, isActive }) => setCategoryActive(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6">
        <h2 className="text-xl font-extrabold">Categories</h2>
        <p className="text-slate-600 mt-1">
          Create, update, and activate/deactivate categories.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
            placeholder="Sort order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          <button
            onClick={() =>
              createMut.mutate({ name: name.trim(), sortOrder: Number(sortOrder) })
            }
            className="rounded-xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800 disabled:opacity-50"
            disabled={!name.trim() || createMut.isPending}
          >
            {createMut.isPending ? "Creating..." : "Create Category"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6">
        <h3 className="text-lg font-extrabold">All Categories</h3>

        {isLoading && <p className="mt-3 text-slate-600">Loading…</p>}
        {isError && (
          <p className="mt-3 text-red-700">
            {error?.message || "Failed to load categories"}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1">
                <p className="text-base font-extrabold">{c.name}</p>
                <p className="text-sm text-slate-600">
                  Sort: {c.sortOrder ?? c.sort_order ?? "-"} • Active:{" "}
                  {String(c.isActive ?? c.is_active)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-bold hover:bg-slate-200"
                  onClick={() =>
                    setEdit({
                      id: c.id,
                      name: c.name,
                      sortOrder: String(c.sortOrder ?? 1),
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-base font-bold hover:bg-slate-50"
                  onClick={() =>
                    activeMut.mutate({
                      id: c.id,
                      isActive: !(c.isActive ?? c.is_active),
                    })
                  }
                >
                  {(c.isActive ?? c.is_active) ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {edit ? (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setEdit(null)}
          />
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
            <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-6">
              <h3 className="text-xl font-extrabold">Edit Category</h3>

              <div className="mt-4 space-y-3">
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                  value={edit.sortOrder}
                  onChange={(e) => setEdit({ ...edit, sortOrder: e.target.value })}
                />
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  onClick={() => setEdit(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateMut.mutate({
                      id: edit.id,
                      payload: { name: edit.name.trim(), sortOrder: Number(edit.sortOrder) },
                    })
                  }
                  className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-base font-extrabold hover:bg-slate-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}