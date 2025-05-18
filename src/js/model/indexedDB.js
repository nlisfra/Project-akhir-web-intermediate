const DB_NAME = "StoryDB";
const DB_VERSION = 1;
const STORE_NAME = "stories";

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function addLocalStory(story) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    if (!story.id) {
      story.id = Date.now().toString();
    }
    const request = store.put(story);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllLocalStories() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteCeritaById(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const deleteRequest = store.delete(id.toString());

    deleteRequest.onsuccess = () => resolve(true);
    deleteRequest.onerror = () => reject("Gagal menghapus data");
  });
}

export async function clearLocalStories() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getStoryById(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id.toString());

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function updateStory(id, updatedData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const getRequest = store.get(id.toString());

    getRequest.onsuccess = () => {
      const existingData = getRequest.result;
      if (!existingData) {
        reject(new Error("Cerita tidak ditemukan"));
        return;
      }

      const updatedStory = { ...existingData, ...updatedData, id: id.toString() };
      const updateRequest = store.put(updatedStory);

      updateRequest.onsuccess = () => resolve(true);
      updateRequest.onerror = (e) => reject(e.target.error);
    };

    getRequest.onerror = (e) => reject(e.target.error);
  });
}

// Jangan ekspor ulang fungsi yang sudah diekspor langsung
// export {
//   openDatabase,       // sudah diekspor langsung
//   addLocalStory,      // sudah diekspor langsung
//   getAllLocalStories, // sudah diekspor langsung
//   clearLocalStories,  // sudah diekspor langsung
// };