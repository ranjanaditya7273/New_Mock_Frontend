// db.js
const DB_NAME = "QuizDB";
const STORE_NAME = "books";

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "_id" });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

// सारा डेटा एक साथ सेव करने के लिए
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

// सारा डेटा प्राप्त करने के लिए
export const getAllBooksFromLocal = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};

// किसी विशिष्ट बुक को अपडेट करने के लिए (Topic डिलीट करने के बाद ज़रूरी है)
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