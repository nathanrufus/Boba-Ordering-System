export function buildStoreWhatsAppMessage(order, customer) {
  const orderNumber = order?.orderNumber ?? "";
  const status = order?.status ?? "NEW";

  const paymentMethod = order?.paymentMethod ?? "";
  const paymentLabel =
    paymentMethod === "E_BIRR"
      ? "E-Birr"
      : paymentMethod === "CBE"
        ? "CBE Bank Transfer"
        : paymentMethod === "TELEBIRR"
          ? "Telebirr"
          : "-";

  // If customer is not provided (route-based fetch), keep safe defaults
  const name = customer?.customerName ?? "-";
  const phone = customer?.customerPhone ?? "-";

  const ftRaw = customer?.fulfillmentType ?? order?.summary?.fulfillmentType ?? "";
  const fulfillmentType = String(ftRaw).toUpperCase();

  const address = customer?.deliveryAddress ?? order?.summary?.deliveryAddress ?? "";
  const note = customer?.customerNote ?? "";

  const items = order?.summary?.items ?? [];

  const lines = [];
  // ✅ Template requirement from client doc:
  // "Hi, I placed order #123 and paid via E-Birr." :contentReference[oaicite:4]{index=4}
  lines.push(`Hi, I placed order #${orderNumber} and paid via ${paymentLabel}.`);
  lines.push("");

  lines.push(`Order: ${orderNumber}`);
  lines.push(`Status: ${status}`);
  lines.push(`Paid via: ${paymentLabel}`);
  lines.push("");

  lines.push(`Customer: ${name} (${phone})`);
  lines.push(`Fulfillment: ${fulfillmentType || "-"}`);

  if (fulfillmentType === "DELIVERY") {
    lines.push(`Address: ${address || "-"}`);
  }

  lines.push("");
  lines.push("Items:");

  if (Array.isArray(items) && items.length) {
    for (const it of items) {
      lines.push(`- ${it.name} x${it.quantity}`);
      const opts = (it.options || []).map((o) => o.label).filter(Boolean);
      if (opts.length) lines.push(`  Options: ${opts.join(", ")}`);
    }
  } else {
    lines.push("- (no items)");
  }

  if (note) {
    lines.push("");
    lines.push(`Note: ${note}`);
  }

  return lines.join("\n");
}