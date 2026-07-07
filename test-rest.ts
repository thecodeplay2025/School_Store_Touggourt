import fs from "fs";
import path from "path";

async function test() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // REST API Endpoint
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/test_connection?key=${config.apiKey}`;
    
    console.log("Testing REST API write to url:", url);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          restTest: { booleanValue: true },
          timestamp: { stringValue: new Date().toISOString() }
        }
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log("REST Write Success! Data:", JSON.stringify(data, null, 2));
    } else {
      console.error("REST Write Failed. Status:", res.status, "Body:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("REST test failed with error:", err);
  }
}

test();
