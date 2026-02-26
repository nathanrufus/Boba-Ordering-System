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
    secure, // true for 465, false for 587
    auth: { user, pass },
  });
}

async function sendAdminNewOrderEmail({ orderNumber, customerName, customerPhone, subtotal, paymentMethod }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!to) {
    throw new Error("ADMIN_NOTIFY_EMAIL not set.");
  }

  const subject = `New Order: ${orderNumber}`;
  const text =
`New order received

Order: ${orderNumber}
Customer: ${customerName || "-"}
Phone: ${customerPhone || "-"}
Payment: ${paymentMethod || "-"}
Total: ${subtotal || "-"}

Login to admin to review & confirm.`;

  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, text });
}

module.exports = { sendAdminNewOrderEmail };