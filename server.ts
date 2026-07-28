import express from "express";
import path from "path";
import fs from "fs";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable Gzip/Deflate compression for fast loading speeds (LCP)
  app.use(compression());

  // Support large JSON payloads
  app.use(express.json({ limit: "50mb" }));

  // Initialize Firestore database dynamically if configuration is available for sitemap queries
  let dbInstance: any = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
      dbInstance = getFirestore(firebaseApp, config.firestoreDatabaseId);
      console.log("Firestore Client SDK initialized successfully on backend for sitemap");
    } else {
      console.warn("firebase-applet-config.json not found, backend running in static-only mode");
    }
  } catch (err) {
    console.error("Firestore Client SDK failed to initialize on backend. Error:", err);
  }

  // Telegram Notification API endpoint
  app.post("/api/telegram-notify", async (req, res) => {
    try {
      const { orderId, orderData } = req.body;
      let botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken || botToken.includes("AAFdxa6L")) {
        botToken = "8848765681:AAGcUny1qyNcTrZzBQVG0O3T8kkNgqm3Tek";
      }
      let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
      if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === "5534070765") {
        TELEGRAM_CHAT_ID = "-1004404503150";
      }
      console.log("TELEGRAM_CHAT_ID =", TELEGRAM_CHAT_ID);

      if (!botToken) {
        console.warn("TELEGRAM_BOT_TOKEN missing in environment variables.");
        return res.status(400).json({ success: false, error: "TELEGRAM_BOT_TOKEN missing" });
      }

      if (!orderData) {
        return res.status(400).json({ success: false, error: "Order data missing" });
      }

      const escapeHtml = (str: string) => (str || '').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const phone = orderData.phone || orderData.customerPhone || "غير محدد";
      const commune = orderData.municipality || orderData.commune || "غير محدد";
      const total = orderData.total || orderData.totalPrice || 0;
      const referrer = orderData.referrer || orderData.affiliateCode;

      const itemsList = Array.isArray(orderData.items)
        ? orderData.items.map((it: any) => `• ${escapeHtml(it.product?.name || 'منتج')} (الكمية: ${it.quantity})`).join("\n")
        : "لا تتوفر تفاصيل المنتجات";

      const deliveryText = orderData.deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب';

      const message = `🛍️ <b>طلب جديد في المتجر!</b>
----------------------------------
🆔 <b>رقم الطلب:</b> <code>${escapeHtml(orderId || "جديد")}</code>
👤 <b>اسم الزبون:</b> ${escapeHtml(orderData.customerName || "غير محدد")}
📞 <b>رقم الهاتف:</b> <code>${escapeHtml(phone)}</code>
📍 <b>البلدية والعنوان:</b> ${escapeHtml(commune)} - ${escapeHtml(orderData.address || "")}
💰 <b>المبلغ الإجمالي:</b> <b>${total} د.ج</b>
🚚 <b>طريقة التوصيل:</b> ${escapeHtml(deliveryText)}

🛒 <b>الطلبات:</b>
${itemsList}

${referrer ? `👥 <b>رمز المسوّق:</b> <code>${escapeHtml(referrer)}</code>` : ''}
----------------------------------
⏰ <b>تاريخ الطلب:</b> ${escapeHtml(new Date().toLocaleString('ar-DZ'))}`;

      console.log("==========================================");
      console.log("📡 Sending message to Telegram API...");
      console.log("Target Chat ID:", TELEGRAM_CHAT_ID);
      console.log("Bot Token Prefix:", botToken ? botToken.substring(0, 10) + "..." : "MISSING");

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML"
        })
      });

      const telegramRawText = await telegramRes.text();
      console.log("📲 Telegram API HTTP Status:", telegramRes.status);
      console.log("Telegram RAW Response:", telegramRawText);
      console.log("==========================================");

      let responseData: any = null;
      try {
        responseData = JSON.parse(telegramRawText);
      } catch (e) {
        responseData = null;
      }

      if (!telegramRes.ok || !responseData?.ok) {
        console.error("Telegram API returned error:", responseData || telegramRawText);
        return res.status(500).json({
          success: false,
          error: responseData?.description || "Telegram API failure",
          telegramResponse: responseData,
          rawText: telegramRawText
        });
      }

      return res.json({
        success: true,
        telegramResponse: responseData,
        rawText: telegramRawText
      });
    } catch (err: any) {
      console.error("Failed to send telegram notification:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dynamic robots.txt serving
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    const host = `${req.protocol}://${req.get('host')}`;
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${host}/sitemap.xml`);
  });

  // Dynamic sitemap.xml serving
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = `${req.protocol}://${req.get('host')}`;
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home Page
      xml += `  <url>\n    <loc>${host}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Static Views
      xml += `  <url>\n    <loc>${host}/auth</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/profile</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/privacy</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/terms</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/shipping</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/faq</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;

      if (dbInstance) {
        try {
          const productsSnap = await getDocs(collection(dbInstance, "products"));
          productsSnap.forEach((doc) => {
            xml += `  <url>\n    <loc>${host}/product/${doc.id}</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
          });

          const packsSnap = await getDocs(collection(dbInstance, "packs"));
          packsSnap.forEach((doc) => {
            xml += `  <url>\n    <loc>${host}/product/${doc.id}</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
          });
        } catch (e) {
          console.error("Failed to query products/packs from Firestore for sitemap:", e);
        }
      }

      xml += `</urlset>`;
      res.type("application/xml");
      res.send(xml);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Integration with Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
