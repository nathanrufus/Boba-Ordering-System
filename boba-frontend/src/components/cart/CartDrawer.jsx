// src/components/cart/CartDrawer.jsx
import { useCartStore } from "../../store/cartStore";
import { formatETB } from "../../lib/money";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose }) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const inc = useCartStore((s) => s.incrementQty);
  const dec = useCartStore((s) => s.decrementQty);
  const subtotalCents = useCartStore((s) => s.getSubtotalCents());
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Your Cart</h2>
            <p className="text-sm text-slate-600">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold">Cart is empty</p>
              <p className="text-sm text-slate-600 mt-1">
                Add items from the menu to begin.
              </p>
            </div>
          ) : (
            items.map((line) => {
              const optionsText =
                (line.selectedOptions || [])
                  .map((o) => o.label)
                  .filter(Boolean)
                  .join(", ") || "No options";

              return (
                <div
                  key={line.key}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold leading-tight">
                        {line.name}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {optionsText}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(line.key)}
                      className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(line.key)}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-lg font-bold"
                      >
                        −
                      </button>
                      <div className="w-12 text-center text-base font-bold">
                        {line.quantity}
                      </div>
                      <button
                        onClick={() => inc(line.key)}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-lg font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* display-only pricing */}
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Subtotal</p>
                      <p className="text-base font-extrabold">
                        {formatETB(
                          (() => {
                            const optionsCents = (line.selectedOptions || []).reduce(
                              (sum, o) => sum + (o.priceDeltaCents || 0),
                              0
                            );
                            const unit = (line.basePriceCents || 0) + optionsCents;
                            return unit * (line.quantity || 1);
                          })()
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-700">Total</p>
            <p className="text-xl font-extrabold">{formatETB(subtotalCents)}</p>
          </div>

          {/* Phase 3 will link to checkout */}
          <button
            disabled={items.length === 0}
            className="mt-4 w-full rounded-2xl bg-slate-900 text-white py-3 text-base font-extrabold
                      disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
            onClick={() => {
              onClose?.();
              navigate("/checkout");
            }}
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}