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
