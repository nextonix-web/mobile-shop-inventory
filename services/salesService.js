import { db, serverTimestamp } from '../lib/firebase';
import { collection, doc, runTransaction, increment } from 'firebase/firestore';

export async function createSale({ customerId='', customerName='', items, paidAmount=0 }){
 if(!items?.length) throw new Error('Sale must include at least one item.');
 return runTransaction(db, async tx=>{
  let totalAmount=0; const normalized=[];
  for(const item of items){
   const productRef=doc(db,'products',item.productId); const snap=await tx.get(productRef);
   if(!snap.exists()) throw new Error(`Product not found: ${item.productName}`);
   const p=snap.data(); const qty=Number(item.quantity); const price=Number(item.price);
   if(qty<=0 || price<0) throw new Error('Invalid quantity or price.');
   if(Number(p.stockQuantity||0)<qty) throw new Error(`${p.name} has only ${p.stockQuantity||0} in stock.`);
   totalAmount += qty*price;
   normalized.push({productRef, productId:item.productId, productName:p.name, category:p.category, model:p.model, quantity:qty, price, purchasePrice:Number(p.purchasePrice||0), lineTotal:qty*price, profit:qty*(price-Number(p.purchasePrice||0))});
  }
  const paid=Number(paidAmount||0); if(paid<0 || paid>totalAmount) throw new Error('Paid amount cannot be negative or greater than total.');
  const saleRef=doc(collection(db,'sales')); const remainingAmount=totalAmount-paid;
  tx.set(saleRef,{customerId,customerName,totalAmount,paidAmount:paid,remainingAmount,status:remainingAmount>0?'credit':'paid',itemCount:normalized.length,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  normalized.forEach(it=>{tx.update(it.productRef,{stockQuantity:increment(-it.quantity),updatedAt:serverTimestamp()});tx.set(doc(collection(db,'sale_items')),{saleId:saleRef.id,...it,productRef:null,createdAt:serverTimestamp()});});
  if(customerId && remainingAmount>0) tx.update(doc(db,'customers',customerId),{totalReceivable:increment(remainingAmount),updatedAt:serverTimestamp()});
  return saleRef.id;
 });
}

export async function addPayment({customerId,saleId='',amount,note=''}){
 const paymentAmount=Number(amount); if(!customerId || paymentAmount<=0) throw new Error('Customer and positive amount are required.');
 return runTransaction(db, async tx=>{
  let remainingPayment=paymentAmount;
  const paymentRef=doc(collection(db,'payments'));
  if(saleId){
   const saleRef=doc(db,'sales',saleId); const saleSnap=await tx.get(saleRef); if(!saleSnap.exists()) throw new Error('Sale not found.');
   const sale=saleSnap.data(); const saleRemaining=Number(sale.remainingAmount||0); if(paymentAmount>saleRemaining) throw new Error('Payment is greater than sale remaining balance.');
   tx.update(saleRef,{paidAmount:increment(paymentAmount),remainingAmount:increment(-paymentAmount),status:paymentAmount===saleRemaining?'paid':'credit',updatedAt:serverTimestamp()});
  }
  tx.update(doc(db,'customers',customerId),{totalReceivable:increment(-paymentAmount),updatedAt:serverTimestamp()});
  tx.set(paymentRef,{customerId,saleId,amount:paymentAmount,note,createdAt:serverTimestamp()});
  return paymentRef.id;
 });
}
