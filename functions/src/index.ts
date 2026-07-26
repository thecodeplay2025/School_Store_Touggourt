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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || "5534070765";

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is missing in environment/secrets.");
      return;
    }

    const itemsList = Array.isArray(orderData.items)
      ? orderData.items.map((it: any) => `• ${it.product?.name || 'منتج'} (الكمية: ${it.quantity})`).join("\n")
      : "لا تتوفر تفاصيل المنتجات";

    const deliveryText = orderData.deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب';

    const message = `🛍️ *طلب جديد في المتجر!*
----------------------------------
🆔 *رقم الطلب:* \`${orderId}\`
👤 *اسم الزبون:* ${orderData.customerName || "غير محدد"}
📞 *رقم الهاتف:* \`${orderData.customerPhone || "غير محدد"}\`
📍 *البلدية والعنوان:* ${orderData.commune || "غير محدد"} - ${orderData.address || ""}
💰 *المبلغ الإجمالي:* *${orderData.totalPrice || 0} د.ج*
🚚 *طريقة التوصيل:* ${deliveryText}

🛒 *الطلبات:*
${itemsList}

${orderData.affiliateCode ? `👥 *رمز المسوّق:* \`${orderData.affiliateCode}\`` : ''}
----------------------------------
⏰ *تاريخ الطلب:* ${new Date().toLocaleString('ar-DZ')}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
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
