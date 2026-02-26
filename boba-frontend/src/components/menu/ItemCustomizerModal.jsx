// src/components/menu/ItemCustomizerModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "../../store/cartStore";
import { toCents, formatETB } from "../../lib/money";
import {
  getItemName,
  getItemDescription,
  getItemBasePrice,
  getItemOptionGroups,
  getGroupId,
  getGroupName,
  getGroupSelectionType,
  getGroupIsRequired,
  getGroupOptions,
  getOptionId,
  getOptionLabel,
  getOptionPriceDelta,
} from "../../lib/menuAccessors";

function buildInitialSelection(groups) {
  // start empty; user selects
  return new Map(groups.map((g) => [getGroupId(g), []]));
}

export default function ItemCustomizerModal({ open, item, onClose, onAdded }) {
  const addItem = useCartStore((s) => s.addItem);

  const groups = useMemo(() => getItemOptionGroups(item), [item]);
  const [quantity, setQuantity] = useState(1);

  // groupId -> optionIds[]
  const [selection, setSelection] = useState(() => buildInitialSelection(groups));

  useEffect(() => {
    // reset when opening new item
    if (open) {
      setQuantity(1);
      setSelection(buildInitialSelection(groups));
    }
  }, [open, item, groups]);

  const selectedOptionIds = useMemo(() => {
    const ids = [];
    for (const arr of selection.values()) ids.push(...arr);
    return ids;
  }, [selection]);

  const validation = useMemo(() => {
    // enforce required: each required group must have >= 1 selected option
    const missing = [];
    for (const g of groups) {
      const gid = getGroupId(g);
      const required = getGroupIsRequired(g);
      if (!required) continue;
      const picked = selection.get(gid) || [];
      if (!picked.length) missing.push(getGroupName(g));
    }
    return { ok: missing.length === 0, missing };
  }, [groups, selection]);

  const baseCents = toCents(getItemBasePrice(item));
  const optionsCents = useMemo(() => {
    // sum selected option deltas
    let sum = 0;
    for (const g of groups) {
      const opts = getGroupOptions(g);
      const picked = new Set(selection.get(getGroupId(g)) || []);
      for (const o of opts) {
        const oid = getOptionId(o);
        if (picked.has(oid)) sum += toCents(getOptionPriceDelta(o));
      }
    }
    return sum;
  }, [groups, selection]);

  const unitCents = baseCents + optionsCents;
  const totalCents = unitCents * Math.max(1, quantity);

  if (!open || !item) return null;

  function toggleOption(group, option) {
    const gid = getGroupId(group);
    const oid = getOptionId(option);
    const type = getGroupSelectionType(group);

    setSelection((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(gid) || []);

      if (type === "single") {
        // exactly one: selecting replaces; selecting same again keeps it selected
        next.set(gid, [oid]);
        return next;
      }

      // multi
      if (current.has(oid)) current.delete(oid);
      else current.add(oid);

      next.set(gid, Array.from(current));
      return next;
    });
  }

  function isSelected(group, option) {
    const gid = getGroupId(group);
    const oid = getOptionId(option);
    const picked = selection.get(gid) || [];
    return picked.includes(oid);
  }

  function handleAdd() {
  if (!validation.ok) return;

  addItem({
    item,
    quantity,
    selectedOptionIds,
  });

  // ✅ Just close the modal so user continues browsing menu
  onClose?.();
}

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      {/* Modal */}
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="w-full md:max-w-2xl bg-white md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold leading-tight">
                {getItemName(item)}
              </h2>
              {getItemDescription(item) ? (
                <p className="mt-1 text-base text-slate-600">
                  {getItemDescription(item)}
                </p>
              ) : null}

              <p className="mt-2 text-base font-bold text-slate-900">
                Base: {formatETB(baseCents)}
              </p>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-auto p-5 space-y-6">
            {groups.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold">No options for this item</p>
                <p className="text-sm text-slate-600 mt-1">
                  You can add it directly to cart.
                </p>
              </div>
            ) : (
              groups.map((g) => {
                const type = getGroupSelectionType(g);
                const required = getGroupIsRequired(g);
                const opts = getGroupOptions(g);

                return (
                  <div key={getGroupId(g)} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold">
                          {getGroupName(g)}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {type === "single" ? "Choose 1" : "Choose any"}
                          {required ? " • Required" : ""}
                        </p>
                      </div>

                      {required ? (
                        <span className="text-xs font-bold text-white bg-amber-500 px-2 py-1 rounded-full">
                          Required
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                          Optional
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-2">
                      {opts.map((o) => {
                        const selected = isSelected(g, o);
                        const deltaCents = toCents(getOptionPriceDelta(o));

                        return (
                          <button
                            key={getOptionId(o)}
                            type="button"
                            onClick={() => toggleOption(g, o)}
                            className={[
                              "w-full rounded-xl border px-4 py-3 text-left flex items-center justify-between gap-3 transition",
                              selected
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 bg-white hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "w-5 h-5 rounded border grid place-items-center text-xs font-black",
                                  selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white",
                                ].join(" ")}
                              >
                                {selected ? "✓" : ""}
                              </span>

                              <div>
                                <p className="text-base font-bold">
                                  {getOptionLabel(o)}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {deltaCents === 0 ? "No extra cost" : `+ ${formatETB(deltaCents)}`}
                                </p>
                              </div>
                            </div>

                            <span className="text-sm font-bold text-slate-900">
                              {deltaCents === 0 ? "" : `+${formatETB(deltaCents)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Required warnings */}
            {!validation.ok && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-800">
                  Select required options:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
                  {validation.missing.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 flex items-center justify-between gap-4">
            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-lg font-black"
              >
                −
              </button>
              <div className="w-12 text-center text-base font-extrabold">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-lg font-black"
              >
                +
              </button>
            </div>

            {/* Total + Add */}
            <div className="text-right">
              <p className="text-sm text-slate-600">Item total</p>
              <p className="text-xl font-extrabold">{formatETB(totalCents)}</p>
            </div>

            <button
              disabled={!validation.ok}
              onClick={handleAdd}
              className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-base font-extrabold
                         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}