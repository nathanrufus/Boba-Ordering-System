// src/store/cartStore.js
import { create } from "zustand";
import { toCents } from "../lib/money";
import {
  getItemId,
  getItemName,
  getItemBasePrice,
  getItemOptionGroups,
  getGroupOptions,
  getOptionId,
  getOptionLabel,
  getOptionPriceDelta,
} from "../lib/menuAccessors";

function buildOptionIndexFromItem(item) {
  const groups = getItemOptionGroups(item);
  const map = new Map();
  for (const g of groups) {
    const opts = getGroupOptions(g);
    for (const o of opts) {
      const id = getOptionId(o);
      map.set(id, {
        id,
        label: getOptionLabel(o),
        priceDeltaCents: toCents(getOptionPriceDelta(o)),
      });
    }
  }
  return map;
}

function normalizeSelectedOptionIds(selectedOptionIds) {
  const ids = Array.isArray(selectedOptionIds) ? selectedOptionIds : [];
  const clean = [...new Set(ids.map((x) => Number(x)).filter((n) => Number.isFinite(n)))];
  return clean;
}

function makeCartKey(menuItemId, selectedOptionIds) {
  const sorted = [...selectedOptionIds].sort((a, b) => a - b);
  return `${menuItemId}::${sorted.join(",")}`;
}

export const useCartStore = create((set, get) => ({
  items: [],

  addItem: ({ item, quantity, selectedOptionIds }) => {
    const menuItemId = Number(getItemId(item));
    const qty = Math.max(1, Number(quantity || 1));
    const selectedIds = normalizeSelectedOptionIds(selectedOptionIds);
    const key = makeCartKey(menuItemId, selectedIds);

    const optionIndex = buildOptionIndexFromItem(item);
    const selectedOptions = selectedIds
      .map((id) => optionIndex.get(id))
      .filter(Boolean);

    const basePriceCents = toCents(getItemBasePrice(item));

    set((state) => {
      const existing = state.items.find((x) => x.key === key);
      if (existing) {
        return {
          items: state.items.map((x) =>
            x.key === key ? { ...x, quantity: x.quantity + qty } : x
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            key,
            menuItemId,
            quantity: qty,
            selectedOptionIds: selectedIds,
            name: getItemName(item),
            basePriceCents,
            categoryName: item?.categoryName ?? "", // ✅ for takeaway box fee
            selectedOptions,
          },
        ],
      };
    });
  },

  removeItem: (key) => {
    set((state) => ({ items: state.items.filter((x) => x.key !== key) }));
  },

  incrementQty: (key) => {
    set((state) => ({
      items: state.items.map((x) =>
        x.key === key ? { ...x, quantity: x.quantity + 1 } : x
      ),
    }));
  },

  decrementQty: (key) => {
    set((state) => ({
      items: state.items
        .map((x) => (x.key === key ? { ...x, quantity: x.quantity - 1 } : x))
        .map((x) => (x.quantity < 1 ? { ...x, quantity: 1 } : x)),
    }));
  },

  clear: () => set({ items: [] }),

  getSubtotalCents: () => {
    const items = get().items;
    let subtotal = 0;
    for (const line of items) {
      const optionsCents = (line.selectedOptions || []).reduce(
        (sum, o) => sum + (o.priceDeltaCents || 0),
        0
      );
      const unit = (line.basePriceCents || 0) + optionsCents;
      subtotal += unit * (line.quantity || 1);
    }
    return subtotal;
  },

  toOrderPayloadItems: () => {
    return get().items.map((line) => ({
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      selectedOptionIds: line.selectedOptionIds,
    }));
  },
}));