import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminOrders } from "../../api/adminOrders";

const STATUSES = ["ALL", "NEW", "PREPARING", "DONE", "CANCELLED"];

export default function AdminOrdersPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("NEW"); // default show NEW
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const queryKey = useMemo(() => ["adminOrders", { status, page, limit }], [status, page, limit]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminOrders({
        status: status === "ALL" ? undefined : status,
        page,
        limit,
      }),
    keepPreviousData: true,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const orders = data?.orders ?? [];

  const errMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Failed to load orders";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Orders</h1>
            <p className="text-base text-slate-600">
              Manage orders and update statuses.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-semibold hover:bg-slate-200"
          >
            Back to Menu
          </button>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">Filter by status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatus(s);
                      setPage(1);
                    }}
                    className={[
                      "rounded-xl border px-4 py-2 text-sm font-extrabold transition",
                      status === s
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600 font-semibold">
                {isFetching ? "Refreshing…" : null}
              </div>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Errors */}
        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-extrabold text-red-800">Could not load orders</p>
            <p className="mt-1 text-sm font-semibold text-red-700">{errMsg}</p>
          </div>
        ) : null}

        {/* List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <p className="text-base font-extrabold">
              Orders ({total})
            </p>
            <p className="text-sm font-semibold text-slate-600">
              Page {page} of {totalPages}
            </p>
          </div>

          {isLoading ? (
            <div className="p-6 text-slate-600 font-semibold">Loading…</div>
          ) : orders.length ? (
            <div className="divide-y divide-slate-200">
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/admin/orders/${o.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-extrabold text-slate-900">
                        {o.orderNumber}
                      </p>
                      <p className="text-sm text-slate-600 font-semibold mt-1">
                        {o.customerName} • {o.customerPhone}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {o.fulfillmentType}
                        <span className="mx-2">•</span>
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <span className="text-sm font-extrabold text-slate-900">
                        ETB {o.subtotal}
                      </span>
                      <span
                        className={[
                          "text-xs font-extrabold px-3 py-1 rounded-full border",
                          o.status === "NEW"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : o.status === "PREPARING"
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : o.status === "DONE"
                            ? "bg-slate-100 border-slate-200 text-slate-800"
                            : "bg-rose-50 border-rose-200 text-rose-800",
                        ].join(" ")}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-slate-600 font-semibold">
              No orders found for this filter.
            </div>
          )}

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-extrabold hover:bg-slate-200 disabled:opacity-50"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-extrabold hover:bg-slate-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}