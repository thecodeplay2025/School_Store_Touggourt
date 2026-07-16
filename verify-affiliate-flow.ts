import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function run() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.error("firebase-applet-config.json not found!");
      return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });
    
    const db = getFirestore(app, config.firestoreDatabaseId);

    console.log("------------------------------------------");
    console.log("CONNECTING TO FIRESTORE DATABASE...");
    console.log("Database ID:", config.firestoreDatabaseId);
    console.log("------------------------------------------");

    // Read Affiliates
    const affiliatesRef = doc(db, "store_data", "affiliates");
    const affiliatesSnap = await getDoc(affiliatesRef);
    if (affiliatesSnap.exists()) {
      const affData = affiliatesSnap.data();
      console.log("Affiliates in DB:", JSON.stringify(affData, null, 2));
    } else {
      console.log("No affiliates document found in Firestore.");
    }

    // Read Orders
    const ordersRef = doc(db, "store_data", "orders");
    const ordersSnap = await getDoc(ordersRef);
    if (ordersSnap.exists()) {
      const ordersData = ordersSnap.data();
      const list = ordersData.list || [];
      console.log(`Orders in DB (Total Count: ${list.length}):`);
      // Print first 3 orders as samples
      console.log(JSON.stringify(list.slice(0, 3), null, 2));
    } else {
      console.log("No orders document found in Firestore.");
    }

  } catch (err) {
    console.error("Firestore inspection failed:", err);
  }
}

run();
