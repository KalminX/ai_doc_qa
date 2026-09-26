// Lightweight native IndexedDB utility for per-book conversation persistence

const DB_NAME = "DocIQ_DB";
const DB_VERSION = 2;
const STORE_NAME = "qa_history";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      let store;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      } else {
        store = event.target.transaction.objectStore(STORE_NAME);
      }
      if (!store.indexNames.contains("docScope")) {
        store.createIndex("docScope", "docScope", { unique: false });
      }
      if (!store.indexNames.contains("timestamp")) {
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveQaToIdb = async (qaItem) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(qaItem);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(qaItem);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error saving Q&A item:", err);
  }
};

export const getQaHistoryByScope = async (docScope = "doc_global") => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("docScope");
    const request = index.getAll(docScope);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = (request.result || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error fetching Q&A history for scope:", docScope, err);
    return [];
  }
};

export const deleteQaFromIdb = async (id) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[IndexedDB] Error deleting Q&A item:", err);
  }
};

export const clearScopeQaIdb = async (docScope) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("docScope");
    const request = index.getAllKeys(docScope);

    request.onsuccess = () => {
      const keys = request.result || [];
      keys.forEach((k) => store.delete(k));
    };
  } catch (err) {
    console.error("[IndexedDB] Error clearing scope Q&A history:", err);
  }
};
