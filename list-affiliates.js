import fs from "fs";
import path from "path";

try {
  const dbPath = path.join(process.cwd(), "data", "db.json");
  if (!fs.existsSync(dbPath)) {
    console.error("data/db.json not found!");
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  
  console.log("=== AFFILIATES ===");
  if (db.affiliates) {
    console.log(JSON.stringify(db.affiliates, null, 2));
  } else {
    console.log("No affiliates key in db.");
  }

  console.log("\n=== ORDERS WITH REFERRER ===");
  if (db.orders) {
    const ordersWithReferrer = db.orders.filter(o => o.referrer);
    console.log(`Total orders with referrer: ${ordersWithReferrer.length}`);
    console.log(JSON.stringify(ordersWithReferrer, null, 2));
  } else {
    console.log("No orders key in db.");
  }
} catch (err) {
  console.error("Error:", err);
}
