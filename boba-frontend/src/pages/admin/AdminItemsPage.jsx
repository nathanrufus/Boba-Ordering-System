import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listItems,
  setItemActive,
  listCategories,
  listOptionGroups,
  setItemOptionGroups,
} from "../../api/adminMenu";
import ItemFormModal from "./ItemFormModal";
import ItemOptionGroupsModal from "./ItemOptionGroupsModal";

export default function AdminItemsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [mapItem, setMapItem] = useState(null);

  const itemsQ = useQuery({ queryKey: ["admin-items"], queryFn: listItems });
  const catsQ = useQuery({ queryKey: ["admin-categories"], queryFn: listCategories });
  const groupsQ = useQuery({ queryKey: ["admin-option-groups"], queryFn: listOptionGroups });

  const items = useMemo(() => {
    const d = itemsQ.data;
    return Array.isArray(d) ? d : d?.items || [];
  }, [itemsQ.data]);

  const categories = useMemo(() => {
    const d = catsQ.data;
    return Array.isArray(d) ? d : d?.categories || [];
  }, [catsQ.data]);

  const optionGroups = useMemo(() => {
    const d = groupsQ.data;
    return Array.isArray(d) ? d : d?.optionGroups || d?.groups || [];
  }, [groupsQ.data]);

  const activeMut = useMutation({
    mutationFn: ({ id, isActive }) => setItemActive(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-items"] }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((it) =>
        categoryFilter === "all"
          ? true
          : String(it.categoryId ?? it.category_id) === String(categoryFilter)
      )
      .filter((it) => {
        if (!q) return true;
        const name = (it.name || "").toLowerCase();
        const desc = (it.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
  }, [items, search, categoryFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }, [filtered.length]);

  // If user is on a page that no longer exists after filtering, clamp it
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const rangeText = useMemo(() => {
    if (filtered.length === 0) return "Showing 0 of 0";
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, filtered.length);
    return `Showing ${from}–${to} of ${filtered.length}`;
  }, [filtered.length, page]);

  // Mobile-friendly page buttons (shown on sm+)
  const pageButtons = useMemo(() => {
    // create a compact range like: 1 ... 4 5 6 ... 12
    const maxButtons = 5;
    const pages = [];

    if (totalPages <= 1) return [1];

    const push = (p) => pages.push(p);

    // Always include first
    push(1);

    const start = Math.max(2, page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages - 1, start + maxButtons - 1);

    if (start > 2) push("…");

    for (let p = start; p <= end; p++) push(p);

    if (end < totalPages - 1) push("…");

    // Always include last
    if (totalPages > 1) push(totalPages);

    // Remove duplicates (e.g. small totals)
    return pages.filter((v, i) => pages.indexOf(v) === i);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Items</h2>
            <p className="text-slate-600 mt-1">
              Create/update items and upload an image (field name: <b>image</b>).
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl bg-slate-900 text-white px-5 py-3 text-base font-extrabold hover:bg-slate-800"
          >
            + New Item
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <label className="text-sm font-semibold text-slate-700">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
              placeholder="Search items…"
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        {itemsQ.isLoading ? <p className="text-slate-600">Loading…</p> : null}
        {itemsQ.isError ? (
          <p className="text-red-700">{itemsQ.error?.message || "Failed to load items"}</p>
        ) : null}

        {!itemsQ.isLoading && !itemsQ.isError && filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-slate-700 font-bold">No items found</p>
            <p className="text-slate-600 text-sm mt-1">
              Try changing the search term or category filter.
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((it) => (
            <div key={it.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="h-40 bg-slate-100 border-b border-slate-200">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-slate-400">No image</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-extrabold line-clamp-2">{it.name}</p>
                  <p className="text-sm font-bold text-slate-700">
                    ETB {it.basePrice ?? it.base_price}
                  </p>
                </div>

                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{it.description || ""}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold hover:bg-slate-200"
                    onClick={() => setEditItem(it)}
                  >
                    Edit
                  </button>

                  <button
                    className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-60"
                    onClick={() =>
                      activeMut.mutate({ id: it.id, isActive: !(it.isActive ?? it.is_active) })
                    }
                    disabled={activeMut.isPending}
                  >
                    {(it.isActive ?? it.is_active) ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-extrabold hover:bg-slate-800 disabled:opacity-60"
                    onClick={() => setMapItem(it)}
                    disabled={!optionGroups.length}
                    title={!optionGroups.length ? "Create option groups first" : ""}
                  >
                    Map Option Groups
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!itemsQ.isLoading && !itemsQ.isError && filtered.length > 0 ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">{rangeText}</p>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>

              {/* Page numbers hidden on very small screens */}
              <div className="hidden sm:flex items-center gap-1">
                {pageButtons.map((p, idx) =>
                  p === "…" ? (
                    <span key={`dots-${idx}`} className="px-2 text-slate-500">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-10 rounded-xl px-3 py-2 text-sm font-extrabold border ${
                        p === page
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* Compact indicator on small screens */}
              <div className="sm:hidden text-sm font-bold text-slate-700 px-2">
                {page}/{totalPages}
              </div>

              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Create */}
      <ItemFormModal
        open={createOpen}
        mode="create"
        item={null}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["admin-items"] });
        }}
      />

      {/* Edit */}
      <ItemFormModal
        open={!!editItem}
        mode="edit"
        item={editItem}
        categories={categories}
        onClose={() => setEditItem(null)}
        onSaved={() => {
          setEditItem(null);
          qc.invalidateQueries({ queryKey: ["admin-items"] });
        }}
      />

      {/* Mapping */}
      <ItemOptionGroupsModal
        open={!!mapItem}
        item={mapItem}
        optionGroups={optionGroups}
        onClose={() => setMapItem(null)}
        onSaved={() => {
          setMapItem(null);
          qc.invalidateQueries({ queryKey: ["admin-items"] });
        }}
        onSubmit={async (itemId, groupIds) => setItemOptionGroups(itemId, groupIds)}
      />
    </div>
  );
}