import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "europe-west1" });

export const onNewOrderCreated = onDocumentCreated(
  {
    document: "orders/{orderId}",
    database: "ai-studio-schoolstoretougg-b34a2d09-602f-4c7a-a928-567751600572",
    secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const orderData = snapshot.data();
    const orderId = event.params.orderId;

    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || botToken.includes("AAFdxa6L")) {
      botToken = "8848765681:AAGcUny1qyNcTrZzBQVG0O3T8kkNgqm3Tek";
    }
    let chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId || chatId === "5534070765") {
      chatId = "-1004404503150";
    }

    const escapeHtml = (str: any) => (str || '').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const phone = orderData.phone || orderData.customerPhone || "غير محدد";
    const commune = orderData.municipality || orderData.commune || "غير محدد";
    const total = orderData.total || orderData.totalPrice || 0;
    const referrer = orderData.referrer || orderData.affiliateCode;

    const itemsList = Array.isArray(orderData.items)
      ? orderData.items.map((it: any) => `• ${escapeHtml(it.product?.name || 'منتج')} (الكمية: ${it.quantity})`).join("\n")
      : "لا تتوفر تفاصيل المنتجات";

    const message = `🛍️ <b>طلب جديد في المتجر! (عبر Firestore Trigger)</b>
----------------------------------
🆔 <b>رقم الطلب:</b> <code>${escapeHtml(orderId)}</code>
👤 <b>اسم الزبون:</b> ${escapeHtml(orderData.customerName || "غير محدد")}
📞 <b>رقم الهاتف:</b> <code>${escapeHtml(phone)}</code>
📍 <b>البلدية والعنوان:</b> ${escapeHtml(commune)} - ${escapeHtml(orderData.address || "")}
💰 <b>المبلغ الإجمالي:</b> <b>${total} د.ج</b>

🛒 <b>الطلبات:</b>
${itemsList}
${referrer ? `\n👥 <b>رمز المسوّق:</b> <code>${escapeHtml(referrer)}</code>` : ''}
----------------------------------
⏰ <b>تاريخ الطلب:</b> ${escapeHtml(new Date().toLocaleString('ar-DZ'))}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        })
      });

      if (!res.ok) {
        console.error("Failed to send Telegram message:", await res.text());
      }
    } catch (err) {
      console.error("Error sending Telegram notification:", err);
    }
  }
);
