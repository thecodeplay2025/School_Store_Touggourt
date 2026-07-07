import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAG8evB7v_A6neNJnRR96T4tZAKBdQZljM",
  authDomain: "gen-lang-client-0492434614.firebaseapp.com",
  projectId: "gen-lang-client-0492434614",
  storageBucket: "gen-lang-client-0492434614.firebasestorage.app",
  messagingSenderId: "527396157281",
  appId: "1:527396157281:web:7d4a7e998bbea53d28f720"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = getFirestore(app, "ai-studio-schoolstoretougg-b34a2d09-602f-4c7a-a928-567751600572");

// Helper to recursively replace undefined with null and log any instances found
function sanitizeData(val: any, path: string = ""): any {
  if (val === undefined) {
    console.warn(`[Firestore Sanitizer] Replaced undefined with null at path: ${path || "root"}`);
    return null;
  }
  if (val === null) {
    return null;
  }
  if (Array.isArray(val)) {
    return val.map((item, index) => sanitizeData(item, `${path}[${index}]`));
  }
  if (typeof val === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      const cleaned = sanitizeData(val[key], path ? `${path}.${key}` : key);
      if (cleaned !== undefined) {
        cleanObj[key] = cleaned;
      }
    }
    return cleanObj;
  }
  return val;
}

// Helper to save a document to the 'store_data' collection
export async function saveDoc(key: string, data: any) {
  if (key === 'orders') {
    console.warn(`[saveDoc TRACE] key='orders', raw data:`, data);
  }
  
  // Clean all undefined values recursively
  const sanitized = sanitizeData(data);
  
  if (key === 'orders') {
    console.warn(`[saveDoc TRACE] key='orders', sanitized data:`, sanitized);
  }

  try {
    const docRef = doc(db, "store_data", key);
    if (Array.isArray(sanitized)) {
      await setDoc(docRef, { list: sanitized });
    } else {
      await setDoc(docRef, sanitized || {});
    }
  } catch (err) {
    console.error(`Error writing ${key} to Firestore:`, err);
    throw err;
  }
}

// Helper to get a document from the 'store_data' collection
export async function getDocData(key: string) {
  try {
    const docRef = doc(db, "store_data", key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && "list" in data) {
        return data.list;
      }
      return data;
    }
    return null;
  } catch (err) {
    console.error(`Error reading ${key} from Firestore:`, err);
    throw err;
  }
}

// Helper to subscribe to real-time updates of a document in 'store_data' collection
export function subscribeDoc(key: string, callback: (data: any) => void) {
  try {
    const docRef = doc(db, "store_data", key);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && "list" in data) {
          callback(data.list);
        } else {
          callback(data);
        }
      } else {
        callback(null);
      }
    }, (err) => {
      console.error(`Error in subscription to ${key}:`, err);
    });
  } catch (err) {
    console.error(`Error setting up subscription to ${key}:`, err);
    return () => {};
  }
}

