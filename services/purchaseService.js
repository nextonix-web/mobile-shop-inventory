import { db, serverTimestamp } from '../lib/firebase';
import { collection, doc, runTransaction, increment } from 'firebase/firestore';
export async function createPurchase({supplierName='',items}){
 if(!items?.length) throw new Error('Purchase must include at least one item.');
 return runTransaction(db, async tx=>{
  let totalCost=0; const normalized=[];
  for(const item of items){
   const productRef=doc(db,'products',item.productId); const snap=await tx.get(productRef); if(!snap.exists()) throw new Error('Product not found.');
   const p=snap.data(); const qty=Number(item.quantity); const cost=Number(item.costPrice);
   if(qty<=0 || cost<0) throw new Error('Invalid purchase quantity or cost.');
   totalCost += qty*cost; normalized.push({productRef,productId:item.productId,productName:p.name,quantity:qty,costPrice:cost,lineTotal:qty*cost});
  }
  const purchaseRef=doc(collection(db,'purchases'));
  tx.set(purchaseRef,{supplierName,totalCost,itemCount:normalized.length,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  normalized.forEach(it=>{tx.update(it.productRef,{stockQuantity:increment(it.quantity),purchasePrice:it.costPrice,updatedAt:serverTimestamp()});tx.set(doc(collection(db,'purchase_items')),{purchaseId:purchaseRef.id,...it,productRef:null,createdAt:serverTimestamp()});});
  return purchaseRef.id;
 });
}
