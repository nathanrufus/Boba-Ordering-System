const nodemailer = require("nodemailer");

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing).");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendAdminNewOrderEmail({
  orderNumber,
  paymentMethod,
  subtotal,
  customerName,
  customerPhone,
  fulfillmentType,
  deliveryAddress,
  customerNote,
  items = [],
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!to) {
    throw new Error("ADMIN_NOTIFY_EMAIL not set.");
  }

  const subject = `New Order: ${orderNumber}`;

  const itemsText = items
    .map((item) => {
      const optionsText =
        item.options && item.options.length > 0
          ? item.options
              .map((opt) => {
                const group = opt.group ? `${opt.group}: ` : "";
                return `${group}${opt.label}`;
              })
              .join(", ")
          : "None";

      const lineTotal =
        item.lineTotal?.toFixed ? item.lineTotal.toFixed(2) : String(item.lineTotal ?? "-");

      return [
        `- ${item.name} x${item.quantity}`,
        `  Options: ${optionsText}`,
        `  Line Total: ${lineTotal} ETB`,
      ].join("\n");
    })
    .join("\n\n");

  const text = `
New order received

Order: ${orderNumber}
Customer: ${customerName || "-"}
Phone: ${customerPhone || "-"}
Fulfillment: ${fulfillmentType || "-"}
Delivery Address: ${deliveryAddress || "N/A"}
Payment: ${paymentMethod || "-"}
Total: ${subtotal || "-"} ETB

Items:
${itemsText || "-"}

Customer Note:
${customerNote || "None"}

Login to admin to review & confirm.
  `.trim();

  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, text });
}

module.exports = { sendAdminNewOrderEmail };