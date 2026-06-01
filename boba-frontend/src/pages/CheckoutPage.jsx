// src/pages/CheckoutPage.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createOrder } from "../api/orders";
import { useCartStore } from "../store/cartStore";
import { formatETB } from "../lib/money";

const normalizePhone = (raw) => {
  let p = String(raw || "").trim();
  if (p.startsWith("00")) p = "+" + p.slice(2);
  p = p.replace(/[^\d+]/g, "");
  if (p.includes("+")) {
    p = "+" + p.replace(/\+/g, "").replace(/^\+/, "");
  }
  return p;
};

const isValidPhoneHybrid = (raw) => {
  const p = normalizePhone(raw);
  if (/^\+\d{8,15}$/.test(p)) return true;
  if (/^0?9\d{8}$/.test(p)) return true;
  if (/^2519\d{8}$/.test(p)) return true;
  return false;
};

function isWithinOrderingHoursEthiopiaClient() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  const nowMinutes = hh * 60 + mm;
  const openMinutes = 10 * 60;
  const closeMinutes = 21 * 60;
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const cartItems = useCartStore((s) => s.items);
  const toOrderPayloadItems = useCartStore((s) => s.toOrderPayloadItems);
  const subtotalCents = useCartStore((s) => s.getSubtotalCents());
  const clearCart = useCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [formError, setFormError] = useState("");

  const DELIVERY_FEE_BIRR = 150;
  const deliveryFeeCents =
    fulfillmentType === "delivery" ? DELIVERY_FEE_BIRR * 100 : 0;

  // ✅ TAKEAWAY BOX: ETB 60 for any order containing a Dessert
  const cartHasDesserts = cartItems.some(
    (line) => line.categoryName === "Desserts"
  );
  const takeawayBoxFeeCents = cartHasDesserts ? 60 * 100 : 0;

  const totalCents = subtotalCents + deliveryFeeCents + takeawayBoxFeeCents; // ✅ TAKEAWAY BOX

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTimeTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const orderingOpen = useMemo(() => {
    return isWithinOrderingHoursEthiopiaClient();
  }, [timeTick]);

  const orderingClosed = !orderingOpen;

  const cartHasSoftServe = useMemo(() => {
    return cartItems.some((line) => {
      const n = String(line?.name ?? "").toLowerCase();
      return (
        n.includes("ice cream") ||
        n.includes("soft serve") ||
        n.includes("soft-serve")
      );
    });
  }, [cartItems]);

  useEffect(() => {
    if (cartHasSoftServe && fulfillmentType === "delivery") {
      setFulfillmentType("pickup");
    }
  }, [cartHasSoftServe, fulfillmentType]);

  const canSubmit = useMemo(() => {
    if (!cartItems.length) return false;
    if (!customerName.trim()) return false;
    if (!customerPhone.trim()) return false;
    if (!isValidPhoneHybrid(customerPhone)) return false;
    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) return false;
    if (!paymentMethod) return false;
    return true;
  }, [
    cartItems.length,
    customerName,
    customerPhone,
    fulfillmentType,
    deliveryAddress,
    paymentMethod,
  ]);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (createdOrder) => {
      clearCart();
      navigate(
        `/order-confirmation/${encodeURIComponent(createdOrder.orderNumber)}`
      );
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong";
      setFormError(msg);
    },
  });

  function copyText(text) {
    try {
      navigator.clipboard.writeText(String(text));
    } catch {
      // ignore
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (orderingClosed) return;
    setFormError("");

    if (!cartItems.length) return setFormError("Your cart is empty.");
    if (!customerName.trim()) return setFormError("Customer name is required.");

    const phoneRaw = customerPhone.trim();
    if (!phoneRaw) return setFormError("Phone number is required.");
    if (!isValidPhoneHybrid(phoneRaw)) {
      return setFormError(
        "Enter a valid phone number (e.g. 09XXXXXXXX, +2519XXXXXXXX, or international +########)."
      );
    }
    const normalizedPhone = normalizePhone(phoneRaw);

    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      return setFormError("Delivery address is required for delivery.");
    }

    if (!paymentMethod) return setFormError("Please select a payment method.");

    const payload = {
      customerName: customerName.trim(),
      customerPhone: normalizedPhone,
      fulfillmentType,
      deliveryAddress:
        fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
      deliveryFee: fulfillmentType === "delivery" ? 150 : 0,
      takeawayBoxFee: cartHasDesserts ? 60 : 0, // ✅ TAKEAWAY BOX
      customerNote: customerNote.trim() ? customerNote.trim() : null,
      items: toOrderPayloadItems(),
      paymentMethod,
      transactionId: transactionId.trim() ? transactionId.trim() : null,
    };

    mutation.mutate(payload);
  }

  return (
    <div className="min-h-screen text-slate-900">
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
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Customer Details</h2>

            {orderingClosed ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-bold text-amber-800">Ordering is closed</p>
                <p className="text-sm text-amber-700 mt-1">
                  Delivery is available from{" "}
                  <span className="font-semibold">5:00 PM</span> to{" "}
                  <span className="font-semibold">11:00 PM</span> (Ethiopia time)
                  during Ramadan.
                </p>
              </div>
            ) : null}

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
                  placeholder="e.g., Mohamed"
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
                  onChange={(e) => {
                    const cleaned = String(e.target.value).replace(/[^\d+]/g, "");
                    setCustomerPhone(cleaned);
                  }}
                  onBlur={() => {
                    setCustomerPhone((p) => normalizePhone(p));
                  }}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g., 09XXXXXXXX or +2519XXXXXXXX or +2547XXXXXXX"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                             focus:outline-none focus:ring-4 focus:ring-slate-200"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Enter correct numder to proceed
                </p>
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
                    disabled={cartHasSoftServe}
                    onClick={() => {
                      if (!cartHasSoftServe) setFulfillmentType("delivery");
                    }}
                    className={[
                      "rounded-xl border px-4 py-3 text-base font-bold transition",
                      cartHasSoftServe
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : fulfillmentType === "delivery"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    Delivery
                  </button>
                </div>

                {cartHasSoftServe ? (
                  <p className="mt-2 text-sm text-amber-700">
                    Soft-serve melts quickly, so ice cream orders are pickup only.
                  </p>
                ) : null}
              </div>

              {fulfillmentType === "delivery" ? (
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Delivery Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g., Marmarsa ,Diredawa"
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

              <div className="pt-4 border-t border-slate-200">
                <h2 className="text-xl font-extrabold">Payment</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Select a payment method and follow the instructions below.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("E_BIRR")}
                    className={[
                      "rounded-xl border px-4 py-3 text-base font-bold transition",
                      paymentMethod === "E_BIRR"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    E-Birr
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CBE")}
                    className={[
                      "rounded-xl border px-4 py-3 text-base font-bold transition",
                      paymentMethod === "CBE"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    CBE
                  </button>
                </div>

                {paymentMethod === "E_BIRR" ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-base font-extrabold">
                      E-Birr (Merchant Payment)
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      <p>
                        <span className="font-bold">Merchant Number:</span>{" "}
                        406108{" "}
                        <button
                          type="button"
                          onClick={() => copyText("406108")}
                          className="ml-2 rounded-lg bg-white px-3 py-1 text-xs font-bold border border-slate-200 hover:bg-slate-100"
                        >
                          Copy Merchant Number
                        </button>
                      </p>
                      <p>
                        <span className="font-bold">Merchant Name:</span> Boba Bros
                      </p>
                      <p>
                        <span className="font-bold">Amount:</span>{" "}
                        {formatETB(totalCents)}
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-bold">Steps</p>
                      <ol className="mt-2 list-decimal pl-5 text-sm text-slate-700 space-y-1">
                        <li>Open E-Birr app</li>
                        <li>
                          Choose <span className="font-bold">Merchant Payment</span>
                        </li>
                        <li>
                          Enter merchant number{" "}
                          <span className="font-bold">406108</span>
                        </li>
                        <li>
                          Confirm name shows{" "}
                          <span className="font-bold">Boba Bros</span>
                        </li>
                        <li>Enter the exact amount</li>
                        <li>Complete payment and return</li>
                      </ol>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-slate-700">
                        Transaction ID (optional but useful)
                      </label>
                      <input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Optional"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                                   focus:outline-none focus:ring-4 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                ) : null}

                {paymentMethod === "CBE" ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-base font-extrabold">CBE Bank Transfer</p>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      <p>
                        <span className="font-bold">Account Number:</span>{" "}
                        1000741111927{" "}
                        <button
                          type="button"
                          onClick={() => copyText("1000741111927")}
                          className="ml-2 rounded-lg bg-white px-3 py-1 text-xs font-bold border border-slate-200 hover:bg-slate-100"
                        >
                          Copy Account Number
                        </button>
                      </p>
                      <p>
                        <span className="font-bold">Account Name:</span> Boba Bros
                      </p>
                      <p>
                        <span className="font-bold">Amount:</span>{" "}
                        {formatETB(totalCents)}
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-bold">Steps</p>
                      <ol className="mt-2 list-decimal pl-5 text-sm text-slate-700 space-y-1">
                        <li>Open CBE mobile banking (or visit branch)</li>
                        <li>Choose transfer</li>
                        <li>
                          Enter account{" "}
                          <span className="font-bold">1000741111927</span>
                        </li>
                        <li>
                          Confirm name shows{" "}
                          <span className="font-bold">Boba Bros</span>
                        </li>
                        <li>Enter exact amount</li>
                        <li>Complete transfer and return</li>
                      </ol>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-slate-700">
                        Transaction ID (optional but useful)
                      </label>
                      <input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Optional"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base
                                   focus:outline-none focus:ring-4 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={orderingClosed || !canSubmit || mutation.isPending}
                className="w-full rounded-2xl bg-slate-900 text-white py-3.5 text-base font-extrabold
                           disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                {mutation.isPending ? "Placing Order..." : "I Have Paid – Place Order"}
              </button>
            </form>
          </div>
        </section>

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
                    (line.selectedOptions || [])
                      .map((o) => o.label)
                      .filter(Boolean)
                      .join(", ") || "No options";
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

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Items</span>
                    <span className="text-sm font-bold">
                      {formatETB(subtotalCents)}
                    </span>
                  </div>

                  {fulfillmentType === "delivery" ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">
                        Delivery fee
                      </span>
                      <span className="text-sm font-bold">
                        {formatETB(deliveryFeeCents)}
                      </span>
                    </div>
                  ) : null}

                  {/* ✅ TAKEAWAY BOX */}
                  {cartHasDesserts ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">
                        Takeaway box
                      </span>
                      <span className="text-sm font-bold">
                        {formatETB(takeawayBoxFeeCents)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-700">Total</span>
                    <span className="text-xl font-extrabold">
                      {formatETB(totalCents)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}