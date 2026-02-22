function buildWhatsAppTextAndLink(order) {
  const lines = [];

  lines.push(`New Order`);
  lines.push(`Name: ${order.customerName}`);
  lines.push(`Phone: ${order.customerPhone}`);
  lines.push(`Type: ${order.fulfillmentType}`);

  if (order.fulfillmentType === "delivery") {
    lines.push(`Address: ${order.deliveryAddress}`);
  }

  if (order.customerNote) {
    lines.push(`Note: ${order.customerNote}`);
  }

  lines.push(``);
  lines.push(`Items:`);

  for (const it of order.items) {
    lines.push(`- ${it.quantity} x ${it.name} @ ${it.unitPrice} = ${it.lineTotal}`);
    for (const op of it.options) {
      lines.push(`  • ${op.group}: ${op.label} (+${op.priceDelta})`);
    }
  }

  lines.push(``);
  lines.push(`Subtotal: ${order.subtotalStr}`);

  const text = lines.join("\n");
  const deeplink = `https://wa.me/${order.customerPhone}?text=${encodeURIComponent(text)}`;

  return { text, deeplink };
}

module.exports = { buildWhatsAppTextAndLink };