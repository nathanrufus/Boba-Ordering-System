import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMenu } from "../api/public";
import CategorySection from "../components/menu/CategorySection";
import ItemCustomizerModal from "../components/menu/ItemCustomizerModal";
import CartDrawer from "../components/cart/CartDrawer";
import { useCartStore } from "../store/cartStore";
import logo from "../assets/boba.jpg";

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-40 rounded-xl bg-slate-100" />
      <div className="mt-4 h-5 w-2/3 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 h-10 w-full rounded-xl bg-slate-100" />
    </div>
  );
}

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Phase 2 state
  const [selectedItem, setSelectedItem] = useState(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Cart count = sum of quantities (accurate)
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, x) => sum + (x.quantity || 0), 0)
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
  });

  const rawCategories = useMemo(() => {
    // supports both shapes: [] or { categories: [] }
    return Array.isArray(data) ? data : data?.categories || [];
  }, [data]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    let cats = rawCategories;

    // category filter
    if (activeCategoryId !== "all") {
      cats = cats.filter((c) => String(c.id) === String(activeCategoryId));
    }

    // search filter (filters items but keeps category if any match)
    if (!q) return cats;

    return cats
      .map((cat) => {
        const items = (cat.items || []).filter((i) => {
          const name = (i.name || "").toLowerCase();
          const desc = (i.description || "").toLowerCase();
          return name.includes(q) || desc.includes(q);
        });
        return { ...cat, items };
      })
      .filter((cat) => (cat.items || []).length > 0);
  }, [rawCategories, search, activeCategoryId]);

  const categoryOptions = useMemo(() => {
    return [
      { id: "all", name: "All" },
      ...rawCategories.map((c) => ({ id: String(c.id), name: c.name })),
    ];
  }, [rawCategories]);

  function handleSelectItem(item) {
    setSelectedItem(item);
    setCustomizerOpen(true);
  }

  // ---- Pagination computed across items (not categories) ----
  // Flatten items while keeping their category for reconstruction after slicing
  const flatItems = useMemo(() => {
    const out = [];
    for (const cat of filteredCategories) {
      const items = cat.items || [];
      for (const it of items) {
        out.push({ catId: cat.id, catName: cat.name, cat: cat, item: it });
      }
    }
    return out;
  }, [filteredCategories]);

  // Reset page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [search, activeCategoryId]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(flatItems.length / PAGE_SIZE));
  }, [flatItems.length]);

  // Clamp page if results shrink
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedFlatItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return flatItems.slice(start, start + PAGE_SIZE);
  }, [flatItems, page]);

  // Rebuild categories using only paged items
  const pagedCategories = useMemo(() => {
    if (pagedFlatItems.length === 0) return [];

    const map = new Map(); // catId -> { ...cat, items: [] }
    for (const row of pagedFlatItems) {
      const catId = row.catId;
      if (!map.has(catId)) {
        // Keep original category shape but only include subset of items
        map.set(catId, { ...row.cat, items: [] });
      }
      map.get(catId).items.push(row.item);
    }

    // Preserve original order of categories (based on filteredCategories)
    const ordered = [];
    for (const c of filteredCategories) {
      if (map.has(c.id)) ordered.push(map.get(c.id));
    }
    return ordered;
  }, [pagedFlatItems, filteredCategories]);

  const rangeText = useMemo(() => {
    if (flatItems.length === 0) return "Showing 0 of 0";
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, flatItems.length);
    return `Showing ${from}–${to} of ${flatItems.length}`;
  }, [flatItems.length, page]);

  const pageButtons = useMemo(() => {
    const maxButtons = 5;
    const pages = [];

    if (totalPages <= 1) return [1];

    const push = (p) => pages.push(p);

    push(1);

    const start = Math.max(2, page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages - 1, start + maxButtons - 1);

    if (start > 2) push("…");
    for (let p = start; p <= end; p++) push(p);
    if (end < totalPages - 1) push("…");

    if (totalPages > 1) push(totalPages);

    return pages.filter((v, i) => pages.indexOf(v) === i);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
              <img src={logo} alt="BOBABROS logo" className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                {import.meta.env.VITE_STORE_NAME || "BOBA"}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Bubble tea • Fast, ordering system
              </p>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-auto rounded-xl bg-slate-900 px-4 py-2.5 text-sm sm:text-base font-semibold text-white
                         hover:bg-slate-800 active:bg-slate-900 transition disabled:opacity-60"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Filters row */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-7">
              <label className="text-sm font-semibold text-slate-700">Search</label>
              <div className="mt-1 relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search drinks…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                             placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>
              </div>
            </div>

            {/* Categories dropdown */}
            <div className="md:col-span-5">
              <label className="text-sm font-semibold text-slate-700">Categories</label>
              <div className="mt-1 relative">
                <select
                  value={activeCategoryId}
                  onChange={(e) => setActiveCategoryId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                             focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle loading bar when fetching (nice on mobile) */}
        {isFetching && !isLoading ? (
          <div className="h-1 w-full bg-slate-100">
            <div className="h-1 w-1/3 bg-slate-900 animate-pulse" />
          </div>
        ) : null}
      </header>

      {/* Content */}
      <main className="w-full px-4 sm:px-6 lg:px-6 pt-1 pb-28">       
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-lg font-bold text-red-800">Failed to load menu</p>
            <p className="mt-1 text-base text-red-700">
              {error?.message || "Check API URL and backend logs."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-base font-semibold text-white hover:bg-red-600"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && flatItems.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold">No items found</p>
            <p className="mt-1 text-base text-slate-600">
              {search ? "Try another search term." : "Seed some categories and items in the backend."}
            </p>
          </div>
        )}

        {/* Menu sections (paged) */}
        {!isLoading &&
          !isError &&
          pagedCategories.map((cat) => (
            <CategorySection key={cat.id} category={cat} onSelectItem={handleSelectItem} />
          ))}

        {/* Pagination */}
        {!isLoading && !isError && flatItems.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          </div>
        ) : null}
      </main>

      {/* Floating cart button */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 right-5 z-30 rounded-2xl bg-slate-900 text-white px-5 py-3
                   text-base font-extrabold shadow-xl hover:bg-slate-800 active:bg-slate-900 transition"
      >
        Cart {cartCount ? `(${cartCount})` : ""}
      </button>

      {/* Item customizer modal */}
      <ItemCustomizerModal
        open={customizerOpen}
        item={selectedItem}
        onClose={() => setCustomizerOpen(false)}
        onAdded={() => setCartOpen(true)}
      />

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}