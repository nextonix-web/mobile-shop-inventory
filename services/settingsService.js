import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const settingsRef = doc(db, "settings", "shop");

export async function getShopSettings() {
  const snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    return {
      appName: "Mobile Parts Shop",
      shopName: "Mobile Parts Shop",
      tagline: "Mobile Parts, Panels, Batteries & Accessories",
      address: "",
      phone: "",
      email: "",
      website: "",
      logoText: "MP",
    };
  }

  return snap.data();
}

export async function saveShopSettings(data) {
  return setDoc(
    settingsRef,
    {
      appName: data.appName || "Mobile Parts Shop",
      shopName: data.shopName || "Mobile Parts Shop",
      tagline: data.tagline || "",
      address: data.address || "",
      phone: data.phone || "",
      email: data.email || "",
      website: data.website || "",
      logoText: data.logoText || "MP",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}