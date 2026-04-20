// db.js
const DB_NAME = "QuizDB";
const STORE_NAME = "books";
const RESULTS_STORE = "quiz_results"; // नया स्टोर नाम

export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Version को बढ़ाकर 2 किया गया है ताकि नया स्टोर बन सके
    const request = indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // 'books' स्टोर बनाना
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "_id" });
      }
      // नया स्टोर 'quiz_results' बनाना, 'topicId' को कीपथ रखकर
      if (!db.objectStoreNames.contains(RESULTS_STORE)) {
        db.createObjectStore(RESULTS_STORE, { keyPath: "topicId" });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

// सारा डेटा एक साथ सेव करने के लिए (Books)
export const saveBooksToLocal = async (books) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.clear(); // पुराना डेटा साफ़ करें
    books.forEach((book) => store.add(book)); 

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(false);
  });
};

// सारा डेटा प्राप्त करने के लिए (Books)
export const getAllBooksFromLocal = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};

// किसी विशिष्ट बुक को अपडेट करने के लिए
export const updateBookInLocal = async (updatedBook) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    // .put() मेथड ID के आधार पर डेटा को ओवरराइट (Update) कर देता है
    const request = store.put(updatedBook);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getBookByName = async (bookName) => {
  const books = await getAllBooksFromLocal();
  return books.find(b => b.bookName === bookName);
};

// --- रिजल्ट्स के लिए नए फंक्शन्स ---

// रिजल्ट सेव करने के लिए नया फंक्शन
export const saveQuizResult = async (resultData) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RESULTS_STORE, "readwrite");
    const store = tx.objectStore(RESULTS_STORE);
    const request = store.put(resultData);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(false);
  });
};

// सारे रिजल्ट्स प्राप्त करने के लिए नया फंक्शन
export const getAllResults = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(RESULTS_STORE, "readonly");
    const store = tx.objectStore(RESULTS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};