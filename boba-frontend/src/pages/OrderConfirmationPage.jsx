import { useLocation, useNavigate } from "react-router-dom";

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location?.state?.order;

  // If user refreshes this page, state is lost.
  // For MVP, redirect to menu.
  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 grid place-items-center p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-extrabold">Order not found</h1>
          <p className="mt-2 text-base text-slate-600">
            Please place an order again from the menu.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 w-full rounded-2xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber ?? order.order_number ?? "";
  const status = order.status ?? "";
  const items = order.items ?? order.orderItems ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Order Confirmed
            </h1>
            <p className="text-base text-slate-600">
              Thank you — we’ve received your order.
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

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">Order Number</p>
              <p className="text-2xl font-extrabold">{orderNumber}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">Status</p>
              <p className="inline-flex mt-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-sm font-bold">
                {status || "NEW"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold">Next steps</p>
              <p className="text-sm text-slate-600 mt-1">
                The shop will prepare your order. Keep your order number for reference.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h2 className="text-xl font-extrabold">Order Items</h2>

            {Array.isArray(items) && items.length ? (
              <div className="mt-4 space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={it.id ?? idx}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-base font-extrabold">
                      {it.name ?? it.menuItemName ?? `Item #${idx + 1}`}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Qty: {it.quantity ?? 1}
                    </p>

                    {/* Option snapshot fields vary by backend; show safely */}
                    {it.options?.length ? (
                      <p className="text-sm text-slate-600 mt-1">
                        Options:{" "}
                        {it.options.map((o) => o.label ?? o.name).filter(Boolean).join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-base text-slate-600">
                Items are not included in the response format you returned.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}