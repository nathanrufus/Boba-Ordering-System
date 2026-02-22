import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createOrder } from "../api/orders";
import { useCartStore } from "../store/cartStore";
import { formatETB } from "../lib/money";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const cartItems = useCartStore((s) => s.items);
  const toOrderPayloadItems = useCartStore((s) => s.toOrderPayloadItems);
  const subtotalCents = useCartStore((s) => s.getSubtotalCents());
  const clearCart = useCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("pickup"); // pickup | delivery
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [formError, setFormError] = useState("");

  const canSubmit = useMemo(() => {
    if (!cartItems.length) return false;
    if (!customerName.trim()) return false;
    if (!customerPhone.trim()) return false;
    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) return false;
    return true;
  }, [cartItems.length, customerName, customerPhone, fulfillmentType, deliveryAddress]);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (createdOrder) => {
      clearCart();
      navigate("/order-confirmation", { state: { order: createdOrder } });
    },
    onError: (err) => {
      // backend returns 400 for validations; message may vary
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong";
      setFormError(msg);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!cartItems.length) {
      setFormError("Your cart is empty.");
      return;
    }
    if (!customerName.trim()) {
      setFormError("Customer name is required.");
      return;
    }
    if (!customerPhone.trim()) {
      setFormError("Customer phone is required.");
      return;
    }
    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      setFormError("Delivery address is required for delivery.");
      return;
    }

    // Build payload EXACTLY as backend expects
    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      fulfillmentType,
      deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
      customerNote: customerNote.trim() ? customerNote.trim() : null,
      items: toOrderPayloadItems(), // [{menuItemId, quantity, selectedOptionIds}]
    };

    mutation.mutate(payload);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
            <p className="text-base text-slate-600">
              Confirm details and place your order
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

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 grid gap-6 lg:grid-cols-12">
        {/* Left: form */}
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Customer Details</h2>

            {formError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-800">Cannot place order</p>
                <p className="text-sm text-red-700 mt-1">{formError}</p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Customer Name <span className="text-red-600">*</span>
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Nathan"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                             focus:outline-none focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g., 2519XXXXXXX"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                             focus:outline-none focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Fulfillment Type <span className="text-red-600">*</span>
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("pickup")}
                    className={[
                      "rounded-xl border px-4 py-3 text-base font-bold transition",
                      fulfillmentType === "pickup"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    Pickup
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("delivery")}
                    className={[
                      "rounded-xl border px-4 py-3 text-base font-bold transition",
                      fulfillmentType === "delivery"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {fulfillmentType === "delivery" ? (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Delivery Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g., Bole, Addis Ababa"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                               focus:outline-none focus:ring-4 focus:ring-slate-200"
                  />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Note (optional)
                </label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g., Less sweet please"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                             focus:outline-none focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || mutation.isPending}
                className="w-full rounded-2xl bg-slate-900 text-white py-3.5 text-base font-extrabold
                           disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                {mutation.isPending ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          </div>
        </section>

        {/* Right: order summary */}
        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Order Summary</h2>

            {cartItems.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold">Cart is empty</p>
                <p className="text-sm text-slate-600 mt-1">
                  Go back and add items to continue.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {cartItems.map((line) => {
                  const opts =
                    (line.selectedOptions || []).map((o) => o.label).filter(Boolean).join(", ") ||
                    "No options";
                  return (
                    <div
                      key={line.key}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-extrabold">{line.name}</p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {opts}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          x{line.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-700">Total</span>
                  <span className="text-xl font-extrabold">
                    {formatETB(subtotalCents)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}