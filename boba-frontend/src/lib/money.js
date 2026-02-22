// src/lib/money.js

export function toCents(moneyString) {
  // accepts "150.00", "0.00", 150 (but backend design is string)
  const s = String(moneyString ?? "0").trim();
  if (!s) return 0;

  // remove commas if any
  const normalized = s.replace(/,/g, "");
  const num = Number(normalized);

  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function fromCents(cents) {
  const n = Number(cents ?? 0);
  return (n / 100).toFixed(2);
}

export function formatETB(cents) {
  return `ETB ${fromCents(cents)}`;
}