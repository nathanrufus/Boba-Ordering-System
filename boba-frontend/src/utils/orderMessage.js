export function buildStoreWhatsAppMessage(order, customer) {
  const orderNumber = order?.orderNumber ?? "";
  const status = order?.status ?? "NEW";

  const name = customer?.customerName ?? "-";
  const phone = customer?.customerPhone ?? "-";

  const ftRaw = customer?.fulfillmentType ?? "";
  const fulfillmentType = String(ftRaw).toUpperCase(); // pickup -> PICKUP, delivery -> DELIVERY

  const address = customer?.deliveryAddress ?? "";
  const note = customer?.customerNote ?? "";

  // Backend returns items at order.summary.items
  const items = order?.summary?.items ?? [];

  const lines = [];
  lines.push(`Order: ${orderNumber}`);
  lines.push(`Status: ${status}`);
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