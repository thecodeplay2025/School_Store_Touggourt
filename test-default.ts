import { Firestore } from "@google-cloud/firestore";
import fs from "fs";
import path from "path";

async function test() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    const firestore = new Firestore({
      projectId: config.projectId,
      databaseId: "(default)",
    });

    console.log("Firestore initialized on (default), testing write...");
    const docRef = firestore.collection("store_data").doc("test_connection");
    await docRef.set({ test: true, timestamp: new Date().toISOString() });
    console.log("Write success on (default)!");

    console.log("Testing read on (default)...");
    const snap = await docRef.get();
    console.log("Read success! Data:", snap.data());
  } catch (err) {
    console.error("Test failed on (default) with error:", err);
  }
}

test();
