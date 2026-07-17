import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch, 
  runTransaction,
  deleteDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { PRODUCTS, CATEGORIES, MUNICIPALITIES } from "../data";

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
export const auth = getAuth();

// Helper to recursively replace undefined with null and log any instances found
export function sanitizeData(val: any, path: string = ""): any {
  if (val === undefined) {
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

// 1. Database Seeder on Startup
export async function initializeCollectionsIfEmpty() {
  try {
    console.log("[Firestore Seeder] Verifying collection schemas...");

    // Seed products
    const productsSnap = await getDocs(collection(db, "products"));
    if (productsSnap.empty) {
      console.log("[Firestore Seeder] Seeding default products...");
      const batch = writeBatch(db);
      PRODUCTS.forEach(p => {
        batch.set(doc(db, "products", p.id), sanitizeData(p));
      });
      await batch.commit();
    }

    // Seed categories
    const categoriesSnap = await getDocs(collection(db, "categories"));
    if (categoriesSnap.empty) {
      console.log("[Firestore Seeder] Seeding default categories...");
      const batch = writeBatch(db);
      CATEGORIES.forEach(c => {
        batch.set(doc(db, "categories", c.id), sanitizeData(c));
      });
      await batch.commit();
    }

    // Seed municipalities
    const municipalitiesSnap = await getDocs(collection(db, "municipalities"));
    if (municipalitiesSnap.empty) {
      console.log("[Firestore Seeder] Seeding default municipalities...");
      const batch = writeBatch(db);
      MUNICIPALITIES.forEach(m => {
        const id = m.name.replace(/[\s\(\)]/g, "_");
        batch.set(doc(db, "municipalities", id), sanitizeData(m));
      });
      await batch.commit();
    }

    // Seed default site settings
    const settingsDoc = await getDoc(doc(db, "settings", "siteSettings"));
    if (!settingsDoc.exists()) {
      console.log("[Firestore Seeder] Seeding default siteSettings...");
      await setDoc(doc(db, "settings", "siteSettings"), sanitizeData({
        storeName: 'midad | مداد',
        storeDescription: 'مداد (midad) - وجهتك الإلكترونية الأولى لشراء كافة اللوازم والمستلزمات المدرسية والأكاديمية بأفضل الأسعار.',
        contactPhone1: '0661000000',
        contactPhone2: '0771000000',
        warehouseAddress: 'حي المستقبل، وسط مدينة توقرت، الجزائر',
        freeShippingThreshold: 6000,
        promoBannerText: 'توصيل مجاني في كافة بلديات توقرت للطلبات الأكثر من 6000 د.ج!'
      }));
    }

    // Seed visitors
    const visitorsDoc = await getDoc(doc(db, "visitors", "stats"));
    if (!visitorsDoc.exists()) {
      console.log("[Firestore Seeder] Seeding default visitors stats...");
      await setDoc(doc(db, "visitors", "stats"), { count: 0 });
    }

    console.log("[Firestore Seeder] Database is synchronized and fully seeded!");
  } catch (err) {
    console.error("[Firestore Seeder] Seeding failed:", err);
  }
}

// 2. Collection Listeners & Subscription
export function subscribeCollection(collectionName: string, callback: (data: any[]) => void) {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(colRef, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      callback(items);
    }, (err) => {
      console.error(`Error subscribing to collection ${collectionName}:`, err);
    });
  } catch (err) {
    console.error(`Error setting up subscription to ${collectionName}:`, err);
    return () => {};
  }
}

// 3. Document Listener & Subscription
export function subscribeDoc(collectionName: string, docId: string, callback: (data: any) => void) {
  try {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback(null);
      }
    }, (err) => {
      console.error(`Error subscribing to document ${collectionName}/${docId}:`, err);
    });
  } catch (err) {
    console.error(`Error setting up subscription to ${collectionName}/${docId}:`, err);
    return () => {};
  }
}

// 4. Save single document helper
export async function saveDocument(collectionName: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionName, docId);
    const sanitized = sanitizeData(data);
    await setDoc(docRef, sanitized || {}, { merge: true });
    console.log(`[Firestore] Document saved successfully at: ${collectionName}/${docId}`);
  } catch (err) {
    console.error(`Error saving document ${collectionName}/${docId}:`, err);
    throw err;
  }
}

// 5. Delete single document helper
export async function deleteDocument(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Document deleted successfully at: ${collectionName}/${docId}`);
  } catch (err) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, err);
    throw err;
  }
}

// 6. Synchronize an array list directly to Firestore (supports additions, updates, and deletions atomically)
export async function saveCollection(collectionName: string, dataArray: any[]) {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const existingIds = snap.docs.map(doc => doc.id);
    const newIds = dataArray.map(item => String(item.id || item.name || ""));

    const batch = writeBatch(db);

    // Write new and updated items
    dataArray.forEach(item => {
      const docId = String(item.id || item.name || "");
      if (docId) {
        const docRef = doc(db, collectionName, docId);
        batch.set(docRef, sanitizeData(item), { merge: true });
      }
    });

    // Delete items not present in the new array
    existingIds.forEach(id => {
      if (!newIds.includes(id)) {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      }
    });

    await batch.commit();
    console.log(`[Firestore] Successfully synchronized array collection "${collectionName}" to individual docs.`);
  } catch (err) {
    console.error(`Error synchronizing collection ${collectionName} array:`, err);
    throw err;
  }
}

// 7. Atomic Order Update (Transaction)
export async function updateOrderStatusAtomic(
  orderId: string,
  newStatus: string,
  commissionAmount: number,
  referrerCode: string,
  orderTotal: number
) {
  try {
    console.log(`%c[Transaction Trace - START] Initiating transaction...`, "color: #2563eb; font-weight: bold;");
    console.log(`[Transaction Trace - PARAMS] orderId="${orderId}", newStatus="${newStatus}", commissionAmount=${commissionAmount}, referrerCode="${referrerCode || 'None'}", orderTotal=${orderTotal}`);
    
    await runTransaction(db, async (transaction) => {
      console.log(`[Transaction Trace - STEP 1] Executing transaction callback...`);
      const orderRef = doc(db, "orders", orderId);
      
      console.log(`[Transaction Trace - STEP 2] Fetching Order document from Firestore for ID: "${orderId}"`);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        console.error(`[Transaction Trace - ERROR] Order with ID ${orderId} does not exist in Firestore!`);
        throw new Error(`Order with ID ${orderId} does not exist in Firestore!`);
      }
      
      const orderData = orderSnap.data();
      console.log(`[Transaction Trace - DATA] Retrieved Order doc data:`, JSON.stringify(orderData, null, 2));

      const isMovingToDelivered = (newStatus === 'delivered' || newStatus === 'completed');
      console.log(`[Transaction Trace - CHECK] Is status transitioning to delivered/completed? -> ${isMovingToDelivered}`);
      console.log(`[Transaction Trace - CHECK] Order referrer: "${orderData.referrer || 'None'}"`);
      console.log(`[Transaction Trace - CHECK] Has commission already been calculated? -> ${orderData.commissionCalculated || false}`);

      if (isMovingToDelivered && referrerCode && !orderData.commissionCalculated) {
        const uppercaseRefCode = referrerCode.trim().toUpperCase();
        const affDocId = uppercaseRefCode;
        console.log(`[Transaction Trace - REFERRER INFO]`);
        console.log(`   - Referrer value in order: "${referrerCode}"`);
        console.log(`   - Target Affiliate Document ID in Firestore: "${affDocId}"`);
        
        const affRef = doc(db, "affiliates", affDocId);
        console.log(`[Transaction Trace - STEP 4] Fetching Affiliate document for ID: "${affDocId}"`);
        const affSnap = await transaction.get(affRef);

        if (affSnap.exists()) {
          console.log(`[Transaction Trace - FIND SUCCESS] Affiliate was found! Document ID matches: "${affDocId}"`);
          const affData = affSnap.data();
          console.log(`[Transaction Trace - DATA] Retrieved Affiliate doc data:`, JSON.stringify(affData, null, 2));

          const prevBalance = affData.commissionBalance || 0;
          const prevSales = affData.totalSales || 0;
          const prevOrders = affData.totalOrders || 0;

          const newBalance = prevBalance + commissionAmount;
          const newSales = prevSales + orderTotal;
          const newOrders = prevOrders + 1;

          console.log(`[Transaction Trace - CALC] Affiliate updates prepared:`);
          console.log(`   - Commission Balance: ${prevBalance} -> ${newBalance} (Added: +${commissionAmount})`);
          console.log(`   - Total Sales: ${prevSales} -> ${newSales} (Added: +${orderTotal})`);
          console.log(`   - Total Orders count: ${prevOrders} -> ${newOrders} (Added: +1)`);

          // 1. Update affiliate stats atomically
          console.log(`[Transaction Trace - UPDATE] Registering update on Affiliate doc "${affDocId}"`);
          transaction.update(affRef, {
            commissionBalance: newBalance,
            totalSales: newSales,
            totalOrders: newOrders
          });
          console.log(`[Transaction Trace - STEP 5] Affiliate document "${affDocId}" update has been registered in the transaction.`);

          // 2. Update order status and set commissionCalculated to true
          console.log(`[Transaction Trace - UPDATE] Registering update on Order doc "${orderId}" (status="${newStatus}", commissionCalculated=true, commissionAmount=${commissionAmount})`);
          transaction.update(orderRef, {
            status: newStatus,
            commissionCalculated: true,
            commissionAmount: commissionAmount
          });
          console.log(`[Transaction Trace - SUCCESS] Operations queued successfully in transaction for referrer "${referrerCode}" and order "${orderId}".`);
        } else {
          console.error(`%c[Transaction Trace - FIND FAILURE] Affiliate NOT found! No document exists with ID: "${affDocId}"`, "color: #f43f5e; font-weight: bold;");
          console.error(`[Transaction Trace - REASON] An order has referrer="${referrerCode}" but no corresponding affiliate document exists in collection "affiliates" with Document ID "${affDocId}".`);
          console.error(`[Transaction Trace - ACTION] Aborting and rolling back transaction to prevent partial state corruption.`);
          throw new Error(`Affiliate with code "${uppercaseRefCode}" (Document ID: "${affDocId}") was not found in Firestore. Transaction aborted.`);
        }
      } else {
        console.log(`[Transaction Trace - SIMPLE UPDATE] No commission calculation needed. Transitioning status to "${newStatus}" only.`);
        transaction.update(orderRef, { status: newStatus });
      }
    });

    console.log(`%c[Transaction Trace - END] Transaction successfully committed in Firestore!`, "color: #10b981; font-weight: bold;");
  } catch (err) {
    console.error(`%c[Transaction Trace - FAILURE] Firestore Transaction failed!`, "color: #ef4444; font-weight: bold;");
    console.error("Root error:", err);
    throw err;
  }
}

// 8. Visitor tracker atomic increment
export async function incrementVisitors() {
  try {
    const docRef = doc(db, "visitors", "stats");
    const snap = await getDoc(docRef);
    const count = snap.exists() ? (snap.data().count || 0) : 0;
    const nextCount = count + 1;
    await setDoc(docRef, { count: nextCount }, { merge: true });
    return nextCount;
  } catch (err) {
    console.error("Error in incrementVisitors:", err);
    return 1;
  }
}

// Backwards-compatible legacy wrappers
export async function saveDoc(key: string, data: any) {
  if (key === 'settings' || key === 'siteSettings') {
    await saveDocument('settings', 'siteSettings', data);
  } else if (key === 'visitors') {
    await saveDocument('visitors', 'stats', data);
  } else if (Array.isArray(data)) {
    await saveCollection(key, data);
  } else {
    await saveDocument('store_data', key, data);
  }
}

export async function getDocData(key: string) {
  if (key === 'visitors') {
    const docRef = doc(db, "visitors", "stats");
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : { count: 0 };
  }
  if (key === 'settings' || key === 'siteSettings') {
    const docRef = doc(db, "settings", "siteSettings");
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  }
  const colRef = collection(db, key);
  const snap = await getDocs(colRef);
  if (snap.empty) return null;
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeDocLegacy(key: string, callback: (data: any) => void) {
  if (key === 'visitors') {
    return subscribeDoc('visitors', 'stats', callback);
  }
  if (key === 'settings' || key === 'siteSettings') {
    return subscribeDoc('settings', 'siteSettings', callback);
  }
  return subscribeCollection(key, callback);
}
