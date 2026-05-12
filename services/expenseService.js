import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

const ref = collection(db, "expenses");

export async function getExpenses() {
  const q = query(ref, orderBy("date", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function addExpense(data) {
  return addDoc(ref, {
    title: data.title,
    category: data.category,
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod || "cash",
    note: data.note || "",
    date: data.date ? Timestamp.fromDate(new Date(data.date)) : Timestamp.now(),
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
  });
}

export async function updateExpense(id, data) {
  return updateDoc(doc(db, "expenses", id), {
    title: data.title,
    category: data.category,
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod || "cash",
    note: data.note || "",
    date: data.date ? Timestamp.fromDate(new Date(data.date)) : Timestamp.now(),
  });
}

export async function deleteExpense(id) {
  return deleteDoc(doc(db, "expenses", id));
}