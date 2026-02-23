// src/utils/whatsapp.js
export function buildWhatsAppLink(phoneNumber, message) {
  const clean = String(phoneNumber).replace(/[^\d]/g, ""); // digits only
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}