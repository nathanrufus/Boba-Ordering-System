require("dotenv").config();
const { sendAdminNewOrderEmail } = require("../src/services/emailService");

sendAdminNewOrderEmail({
  orderNumber: "TEST-0001",
  customerName: "Test Customer",
  customerPhone: "+251900000000",
  subtotal: "ETB 10.00",
  paymentMethod: "E_BIRR",
})
  .then(() => console.log("Email sent OK"))
  .catch((e) => console.error("Email failed:", e));