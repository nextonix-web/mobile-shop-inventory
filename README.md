# Mobile Shop Inventory & Business Management System

Next.js Pages Router + Firebase Auth + Firestore app for a mobile phone parts shop.

## Setup
1. Create a Firebase project.
2. Add a Web App and copy config values into `.env.local` using `.env.example` keys.
3. Enable Authentication > Email/Password.
4. Create one admin user manually in Firebase Authentication.
5. Create Firestore database in production mode.
6. Paste `firestore.rules` first, or use `firestore.production.rules` after adding custom claims (`role: owner|manager|staff`).
7. Run:
```bash
npm install
npm run dev
```

## Firestore Collections
- `products`: name, category, model, purchasePrice, salePrice, stockQuantity, lowStockAlert, timestamps
- `customers`: name, phone, address, totalReceivable, timestamps
- `sales`: customerId, customerName, totalAmount, paidAmount, remainingAmount, status, itemCount, timestamps
- `sale_items`: saleId, productId, productName, category, model, quantity, price, purchasePrice, lineTotal, profit, createdAt
- `payments`: customerId, saleId, amount, note, createdAt
- `purchases`: supplierName, totalCost, itemCount, timestamps
- `purchase_items`: purchaseId, productId, productName, quantity, costPrice, lineTotal, createdAt

## Important Logic
- Sales are created with Firestore `runTransaction`.
- Every product in a sale is read inside the transaction, checked for stock, and then deducted atomically.
- Negative stock is blocked before committing the sale.
- Sale line items are stored separately in `sale_items` for reporting and scalable querying.
- Credit sales increase `customers.totalReceivable`.
- Payments decrease `customers.totalReceivable` and can optionally be tied to a sale.
- Purchases increase product stock inside a transaction and create `purchase_items` records.

## Production Notes
- Use custom claims for staff roles before deploying `firestore.production.rules`.
- Add server-side Admin SDK functions later for stricter enforcement if multiple staff roles are needed.
- Add composite indexes if Firestore suggests them while filtering larger reports.
