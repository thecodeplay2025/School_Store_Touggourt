import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function test() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
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

    console.log("Initializing Firebase Client SDK on Node, testing write...");
    const docRef = doc(db, "store_data", "test_connection");
    await setDoc(docRef, { clientNodeTest: true, timestamp: new Date().toISOString() });
    console.log("Client SDK write success!");

    console.log("Testing read...");
    const snap = await getDoc(docRef);
    console.log("Client SDK read success! Data:", snap.data());
  } catch (err) {
    console.error("Client SDK test failed with error:", err);
  }
}

test();
