import { buildWhatsAppLink } from "../utils/whatsapp";
import { buildStoreWhatsAppMessage } from "../utils/orderMessage";

export function SendOrderOnWhatsAppButton({ order, customer }) {
  const storeNumber =
    import.meta.env.VITE_STORE_WHATSAPP_NUMBER || import.meta.env.VITE_STORE_WHATSAPP;

  const onClick = () => {
    if (!storeNumber) {
      alert("Store WhatsApp number is missing. Set VITE_STORE_WHATSAPP_NUMBER in your .env.local");
      return;
    }

    const message = buildStoreWhatsAppMessage(order, customer);
    const url = buildWhatsAppLink(storeNumber, message);

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-emerald-600 text-white py-3 text-base font-extrabold hover:bg-emerald-700 active:bg-emerald-800 transition"
    >
      Send this order on WhatsApp
    </button>
  );
}