import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrderByOrderNumber } from "../api/orders";
import { formatETB } from "../lib/money";
import { SendOrderOnWhatsAppButton } from "../components/SendOrderOnWhatsAppButton";

function toPaymentLabel(method) {
  if (method === "E_BIRR") return "E-Birr";
  if (method === "CBE") return "CBE Bank Transfer";
  if (method === "TELEBIRR") return "Telebirr";
  return "-";
}

function toStatusLabel(status) {
  // Your DB enum includes: NEW, PENDING_VERIFICATION, PREPARING, DONE, CANCELLED
  if (status === "PENDING_VERIFICATION") return "Pending Verification";
  if (status === "NEW") return "New";
  if (status === "PREPARING") return "Preparing";
  if (status === "DONE") return "Ready / Done";
  if (status === "CANCELLED") return "Cancelled";
  return status || "-";
}

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { orderNumber } = useParams();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => getOrderByOrderNumber(orderNumber),
    enabled: Boolean(orderNumber),
    retry: 1,
  });

  // Fixed ready-time rule from client brief: "Ready in 10–15 minutes"
  // This is accurate per the provided document. :contentReference[oaicite:2]{index=2}
  const estimatedReadyTimeText = "10–15 minutes";

  const subtotalDisplay = useMemo(() => {
    // Backend returns subtotal as a string like "123.45"
    const val = Number(order?.subtotal ?? 0);
    if (!Number.isFinite(val)) return order?.subtotal ?? "-";
    // formatETB expects cents in your app; convert ETB->cents
    return formatETB(Math.round(val * 100));
  }, [order?.subtotal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 grid place-items-center p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-extrabold">Loading order…</h1>
          <p className="mt-2 text-base text-slate-600">Please wait.</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
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

  const paymentLabel = toPaymentLabel(order.paymentMethod);
  const statusLabel = toStatusLabel(order.status);
  console.log("ORDER FROM API:", order);
console.log("customerName:", order?.customerName, "customerPhone:", order?.customerPhone);
console.log("summary customerName:", order?.summary?.customerName, "summary customerPhone:", order?.summary?.customerPhone);
  const customer = {
  customerName: order?.customerName ?? order?.summary?.customerName ?? "-",
  customerPhone: order?.customerPhone ?? order?.summary?.customerPhone ?? "-",
  fulfillmentType: order?.summary?.fulfillmentType ?? order?.fulfillmentType ?? "",
  deliveryAddress: order?.summary?.deliveryAddress ?? order?.deliveryAddress ?? "",
  customerNote: order?.summary?.customerNote ?? order?.customerNote ?? "",
};

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Thank you! Your order has been received.
            </h1>
            <p className="text-base text-slate-600">
              Keep your order number for reference.
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
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-600">Order Number</p>
              <p className="text-2xl font-extrabold break-all">{order.orderNumber}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-600">Total Amount</p>
                  <p className="text-lg font-extrabold">{subtotalDisplay}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-600">Payment Method</p>
                  <p className="text-lg font-extrabold">{paymentLabel}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-600">Status</p>
                  <p className="text-lg font-extrabold">{statusLabel}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-600">Estimated Ready Time</p>
                  <p className="text-lg font-extrabold">{estimatedReadyTimeText}</p>
                </div>
              </div>

              {/* Optional: show references when relevant */}
              {(order.transactionId || order.cbeReference) ? (
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold">Payment details</p>
                  {order.transactionId ? (
                    <p className="text-sm text-slate-700 mt-1">
                      <span className="font-semibold">Transaction ID:</span> {order.transactionId}
                    </p>
                  ) : null}
                  {order.cbeReference ? (
                    <p className="text-sm text-slate-700 mt-1">
                      <span className="font-semibold">CBE Reference:</span> {order.cbeReference}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="w-full lg:max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-base font-extrabold">WhatsApp Us</p>
              <p className="text-sm text-slate-600 mt-1">
                Tap to message us with your order number and payment method.
              </p>
              <div className="mt-4">
                <SendOrderOnWhatsAppButton order={order} customer={customer} />
              </div>
            </div>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-5">
            <h2 className="text-xl font-extrabold">Order Items</h2>

            {Array.isArray(order?.summary?.items) && order.summary.items.length ? (
              <div className="mt-4 space-y-3">
                {order.summary.items.map((it, idx) => (
                  <div
                    key={it.menuItemId ?? idx}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-base font-extrabold">{it.name ?? `Item #${idx + 1}`}</p>
                    <p className="text-sm text-slate-600 mt-1">Qty: {it.quantity ?? 1}</p>
                    {it.options?.length ? (
                      <p className="text-sm text-slate-600 mt-1">
                        Options:{" "}
                        {it.options.map((o) => o.label).filter(Boolean).join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-base text-slate-600">No items found.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}