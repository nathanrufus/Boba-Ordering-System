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

// Small inline icon buttons (no external libs)
function IconButton({ href, label, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="
        inline-flex shrink-0 items-center justify-center
        h-7 w-7 sm:h-8 sm:w-8
        rounded-xl border border-slate-200 bg-white
        text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition
      "
    >
      {/* make the svg slightly smaller on mobile */}
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
        {children}
      </span>
    </a>
  );
}

function PhonePill({ phone }) {
  if (!phone) return null;
  const clean = String(phone).replace(/\s+/g, "");
  return (
    <a
      href={`tel:${clean}`}
      className="
        inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white
        px-2 py-1 text-[11px] sm:px-2.5 sm:py-1.5 sm:text-sm
        font-extrabold text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition
      "
      aria-label={`Call ${phone}`}
      title={`Call ${phone}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" aria-hidden="true">
        <path d="M6.62 10.79a15.09 15.09 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
      </svg>
      <span className="whitespace-nowrap">{phone}</span>
    </a>
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

  // WhatsApp + socials from env (Vite requires VITE_ prefix)
  const waRaw = import.meta.env.VITE_STORE_WHATSAPP_NUMBER || "";
  const waNumber = String(waRaw).replace(/[^\d]/g, "");
  const waText = encodeURIComponent("Hi! I’d like to place an order from BOBA BROS.");
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : "";

  const storePhone = import.meta.env.VITE_STORE_PHONE_NUMBER || "";
  const instagramUrl = import.meta.env.VITE_STORE_INSTAGRAM_URL || "";
  const facebookUrl = import.meta.env.VITE_STORE_FACEBOOK_URL || "";
  const tiktokUrl = import.meta.env.VITE_STORE_TIKTOK_URL || "";

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
  });
    const CATEGORY_ORDER = ["Milkshakes", "Milk teas", "Fruit teas", "Sides and treats"];
    const norm = (s) => String(s || "").trim().toLowerCase();
  const rawCategories = useMemo(() => {
      const cats = Array.isArray(data) ? data : data?.categories || [];

      const sortedCats = [...cats].sort((a, b) => {
        const ai = CATEGORY_ORDER.findIndex((x) => norm(x) === norm(a?.name));
        const bi = CATEGORY_ORDER.findIndex((x) => norm(x) === norm(b?.name));

        const aRank = ai === -1 ? 999 : ai;
        const bRank = bi === -1 ? 999 : bi;

        if (aRank !== bRank) return aRank - bRank;

        // if category not in list, sort alphabetically
        return norm(a?.name).localeCompare(norm(b?.name));
      });

      // Optional: sort items within each category alphabetically
      return sortedCats.map((c) => ({
        ...c,
        items: [...(c.items || [])].sort((i1, i2) => norm(i1?.name).localeCompare(norm(i2?.name))),
      }));
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

  const pagedCategories = useMemo(() => {
    if (pagedFlatItems.length === 0) return [];

    const map = new Map();
    for (const row of pagedFlatItems) {
      const catId = row.catId;
      if (!map.has(catId)) {
        map.set(catId, { ...row.cat, items: [] });
      }
      map.get(catId).items.push(row.item);
    }

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
            <div className="w-15 h-15 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
              <img src={logo} alt="BOBABROS logo" className="w-full h-full object-cover" />
            </div>

            {/* Title + small contact/social row */}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-tight truncate">
                {import.meta.env.VITE_STORE_NAME || "BOBA"}
              </h1>

              <div className="mt-2 -mx-1 px-1">
                {/* Mobile: single-line horizontal scroll. Desktop: wraps nicely */}
                <div className="mt-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:flex-wrap sm:overflow-visible sm:whitespace-normal">
                  <a
                    href={`tel:${String(storePhone).replace(/\s+/g, "")}`}
                    className="
                      inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white
                      px-2 py-1 text-[11px] sm:px-2.5 sm:py-1.5 sm:text-sm
                      font-extrabold text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition
                    "
                    aria-label={`Call ${storePhone}`}
                    title={`Call ${storePhone}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" aria-hidden="true">
                      <path d="M6.62 10.79a15.09 15.09 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    <span>{storePhone || "+251992311111"}</span>
                  </a>

                  {/* Facebook */}
                  <IconButton href={facebookUrl} label="Facebook" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" aria-hidden="true">
                      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.23 0-1.61.76-1.61 1.54V12h2.74l-.44 2.89h-2.3v6.99A10 10 0 0022 12z"/>
                    </svg>
                  </IconButton>

                  {/* Instagram */}
                  <IconButton href={instagramUrl} label="Instagram" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" aria-hidden="true">
                      <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3z"/>
                      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"/>
                      <path d="M17.5 6.5a1 1 0 110 2 1 1 0 010-2z"/>
                    </svg>
                  </IconButton>

                  {/* TikTok */}
                  <IconButton href={tiktokUrl} label="TikTok" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" aria-hidden="true">
                      <path d="M15 3c.6 3.2 2.7 5 6 5v3c-2.2 0-4.1-.7-6-2v7.2c0 3.3-2.7 5.8-6 5.8s-6-2.5-6-5.8c0-3.1 2.5-5.6 5.6-5.8V14c-1.3.2-2.3 1.3-2.3 2.6 0 1.5 1.2 2.7 2.7 2.7S12 18.1 12 16.6V3h3z"/>
                    </svg>
                  </IconButton>
                </div>
              </div>
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
      <main className="w-full px-4 sm:px-6 lg:px-6 pt-1 pb-32">
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

      {/* Floating WhatsApp + Cart (stacked so it doesn't block cards) */}
      <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
        {/* WhatsApp */}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
            className="rounded-2xl bg-green-600 text-white px-4 py-3 text-sm sm:text-base font-extrabold shadow-xl
                       hover:bg-green-500 active:bg-green-600 transition"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M19.11 17.53c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.41-.84-.75-1.41-1.68-1.57-1.96-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.54-.88-2.11-.23-.55-.46-.47-.64-.48h-.55c-.19 0-.49.07-.75.35-.26.28-.99.97-.99 2.37s1.02 2.75 1.16 2.94c.14.19 2.01 3.06 4.87 4.29.68.29 1.21.46 1.62.59.68.22 1.3.19 1.78.12.54-.08 1.66-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33z" />
                <path d="M16 3C9.37 3 4 8.37 4 15c0 2.12.55 4.17 1.59 5.98L4 29l8.22-1.55A11.9 11.9 0 0 0 16 27c6.63 0 12-5.37 12-12S22.63 3 16 3zm0 21.72c-1.78 0-3.52-.48-5.05-1.39l-.36-.21-4.88.92.94-4.75-.23-.39A9.7 9.7 0 0 1 6.3 15c0-5.35 4.35-9.7 9.7-9.7s9.7 4.35 9.7 9.7-4.35 9.72-9.7 9.72z" />
              </svg>
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
            </span>
          </a>
        ) : null}

        {/* Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-base font-extrabold shadow-xl
                     hover:bg-slate-800 active:bg-slate-900 transition"
        >
          Cart {cartCount ? `(${cartCount})` : ""}
        </button>
      </div>

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