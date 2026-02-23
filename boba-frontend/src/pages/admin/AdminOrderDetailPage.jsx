import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminOrderById, patchAdminOrderStatus } from "../../api/adminOrders";

const STATUS_ACTIONS = ["PREPARING", "DONE", "CANCELLED"];

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ["adminOrder", id],
    queryFn: () => fetchAdminOrderById(id),
  });

  const mutation = useMutation({
    mutationFn: patchAdminOrderStatus,
    onSuccess: async () => {
      // refresh detail + list
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminOrder", id] }),
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] }),
      ]);
    },
  });

  const errMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Failed to load order";

  const onSetStatus = (nextStatus) => {
    if (!order?.id) return;
    mutation.mutate({ id: order.id, status: nextStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-base font-bold">Loading order…</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-900 p-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-extrabold">Order not found</h1>
          <p className="mt-2 text-base text-red-700 font-semibold">{errMsg}</p>
          <button
            onClick={() => navigate("/admin/orders")}
            className="mt-5 w-full rounded-2xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const isDelivery = String(order.fulfillmentType || "").toUpperCase() === "DELIVERY";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{order.orderNumber}</h1>
            <p className="text-base text-slate-600">
              Created: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/orders")}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-semibold hover:bg-slate-200"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 grid gap-6 lg:grid-cols-12">
        {/* Left: details */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Customer</h2>
            <p className="mt-2 text-base font-bold">{order.customerName}</p>
            <p className="text-base text-slate-700 font-semibold">{order.customerPhone}</p>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="text-lg font-extrabold">Fulfillment</h3>
              <p className="mt-2 text-base font-bold">{order.fulfillmentType}</p>
              {isDelivery ? (
                <p className="mt-1 text-base text-slate-700 font-semibold">
                  Address: {order.deliveryAddress || "-"}
                </p>
              ) : null}
            </div>

            {order.customerNote ? (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <h3 className="text-lg font-extrabold">Note</h3>
                <p className="mt-2 text-base text-slate-700">{order.customerNote}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Items (snapshot)</h2>
              <p className="text-base font-extrabold">ETB {order.subtotal}</p>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-extrabold">
                        {it.itemNameSnapshot} <span className="text-slate-500">x{it.quantity}</span>
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Unit: ETB {it.unitPriceSnapshot} • Line: ETB {it.lineTotal}
                      </p>

                      {it.options?.length ? (
                        <div className="mt-3 space-y-1">
                          {it.options.map((op, idx) => (
                            <p key={`${op.optionId}-${idx}`} className="text-sm text-slate-700">
                              <span className="font-bold">{op.optionGroupNameSnapshot}:</span>{" "}
                              {op.optionLabelSnapshot}{" "}
                              <span className="text-slate-500">
                                (+ETB {op.optionPriceDeltaSnapshot})
                              </span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500 italic">No options</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: status actions */}
        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Status</h2>

            <div className="mt-3">
              <span className="inline-flex rounded-full bg-slate-100 text-slate-900 px-3 py-1 text-sm font-extrabold border border-slate-200">
                {order.status}
              </span>
            </div>

            {mutation.isError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-800">Could not update status</p>
                <p className="text-sm text-red-700 mt-1">
                  {mutation.error?.response?.data?.message ||
                    mutation.error?.message ||
                    "Update failed"}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              {STATUS_ACTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSetStatus(s)}
                  disabled={mutation.isPending || order.status === s}
                  className={[
                    "w-full rounded-2xl py-3 text-base font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed",
                    s === "CANCELLED"
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-slate-900 text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  {mutation.isPending ? "Updating…" : `Mark ${s}`}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}