import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const categoryRef = collection(db, "categories");

export async function getCategories() {
  const q = query(categoryRef, orderBy("label", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function addCategory(label) {
  const cleanLabel = label.trim();

  if (!cleanLabel) {
    throw new Error("Category name is required");
  }

  return addDoc(categoryRef, {
    label: cleanLabel,
    name: cleanLabel.toLowerCase().replace(/\s+/g, "-"),
    createdAt: serverTimestamp(),
  });
}