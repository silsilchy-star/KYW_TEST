import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const SCORES_COLLECTION = "scores";

export async function saveScore(ms, nickname) {
  await addDoc(collection(db, SCORES_COLLECTION), {
    nickname,
    ms,
    createdAt: serverTimestamp(),
  });
}

export async function getTop(n) {
  const q = query(collection(db, SCORES_COLLECTION), orderBy("ms", "asc"), limit(n));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}
