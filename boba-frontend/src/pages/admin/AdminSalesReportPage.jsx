import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSalesReport } from "../../api/adminReports";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminSalesReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayISO());

  const params = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["adminSalesReport", params],
    queryFn: () => fetchSalesReport(params),
    enabled: true,
  });

  const errMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Failed to load report";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
          <h1 className="text-2xl font-extrabold tracking-tight">Sales Report</h1>
          <p className="text-base text-slate-600">View total orders, revenue, and top items.</p>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3 items-end">
            <div>
              <label className="text-sm font-bold text-slate-700">From (YYYY-MM-DD)</label>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="2026-01-01"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                           focus:outline-none focus:ring-4 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">To (YYYY-MM-DD)</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="2026-01-31"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                           focus:outline-none focus:ring-4 focus:ring-slate-200"
              />
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="w-full rounded-2xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800"
            >
              {isFetching ? "Refreshing…" : "Run Report"}
            </button>
          </div>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-extrabold text-red-800">Could not load report</p>
            <p className="mt-1 text-sm font-semibold text-red-700">{errMsg}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-bold text-slate-700">Loading…</p>
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-600">Total Orders</p>
                <p className="mt-2 text-3xl font-extrabold">{data.totalOrders}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-600">Revenue</p>
                <p className="mt-2 text-3xl font-extrabold">ETB {data.revenue}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-600">Range</p>
                <p className="mt-2 text-base font-extrabold">
                  {data.from || "-"} → {data.to || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-extrabold">Top Items</h2>
              </div>

              {data.topItems?.length ? (
                <div className="divide-y divide-slate-200">
                  {data.topItems.map((t, idx) => (
                    <div key={`${t.itemName}-${idx}`} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold">{t.itemName}</p>
                        <p className="text-sm text-slate-600 mt-1">Qty: {t.quantity}</p>
                      </div>
                      <div className="shrink-0 text-base font-extrabold text-slate-900">
                        ETB {t.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-slate-600 font-semibold">No items in this range.</div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}