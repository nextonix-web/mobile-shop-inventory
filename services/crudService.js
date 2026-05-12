import { db, serverTimestamp } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
export const listenCollection=(name,setter,order='createdAt')=>onSnapshot(query(collection(db,name),orderBy(order,'desc')),s=>setter(s.docs.map(d=>({id:d.id,...d.data()}))));
export const addRecord=(name,data)=>addDoc(collection(db,name),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
export const updateRecord=(name,id,data)=>updateDoc(doc(db,name,id),{...data,updatedAt:serverTimestamp()});
export const deleteRecord=(name,id)=>deleteDoc(doc(db,name,id));
export async function getCustomerLedger(customerId){
 const salesSnap=await getDocs(query(collection(db,'sales'),where('customerId','==',customerId)));
 const paymentsSnap=await getDocs(query(collection(db,'payments'),where('customerId','==',customerId)));
 return {sales:salesSnap.docs.map(d=>({id:d.id,...d.data()})),payments:paymentsSnap.docs.map(d=>({id:d.id,...d.data()}))};
}
