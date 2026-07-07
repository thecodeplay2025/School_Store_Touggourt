import { Firestore } from "@google-cloud/firestore";
import fs from "fs";
import path from "path";

async function test() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.error("firebase-applet-config.json not found!");
      return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    const firestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
    });

    console.log("Firestore initialized, testing write...");
    const docRef = firestore.collection("store_data").doc("test_connection");
    await docRef.set({ test: true, timestamp: new Date().toISOString() });
    console.log("Write success!");

    console.log("Testing read...");
    const snap = await docRef.get();
    console.log("Read success! Data:", snap.data());
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

test();
