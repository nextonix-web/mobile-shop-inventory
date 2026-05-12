import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;

  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadInvoice();
  }, [id]);

  async function loadInvoice() {
    try {
      setLoading(true);

      const saleSnap = await getDoc(doc(db, "sales", id));

      if (!saleSnap.exists()) {
        alert("Sale not found");
        router.push("/sales");
        return;
      }

      const saleData = {
        id: saleSnap.id,
        ...saleSnap.data(),
      };

      setSale(saleData);

      if (saleData.customerId) {
        const customerSnap = await getDoc(
          doc(db, "customers", saleData.customerId)
        );

        if (customerSnap.exists()) {
          setCustomer(customerSnap.data());
        }
      }

      const itemsQuery = query(
        collection(db, "sale_items"),
        where("saleId", "==", id)
      );

      const itemsSnap = await getDocs(itemsQuery);

      const saleItems = itemsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setItems(saleItems);
    } catch (error) {
      alert(error.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading invoice...</p>;
  if (!sale) return <p>Invoice not found.</p>;

  const invoiceNo = sale.id.slice(0, 8).toUpperCase();

  const invoiceDate = sale.createdAt?.toDate
    ? sale.createdAt.toDate().toLocaleString()
    : "-";

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <button className="btn primary" onClick={() => window.print()}>
          Print Invoice
        </button>

        <button className="btn muted" onClick={() => router.push("/sales")}>
          Back to Sales
        </button>
      </div>

      <div className="invoice-box">
        <div className="invoice-top">
          <div className="shop-brand">
            <div className="shop-logo">BM</div>

            <div>
              <h1>Beijing Mobile</h1>
              <p>Mobile Parts, Panels, Batteries, Accessories</p>
              <p>Shop # 11, Brother Plaza, Hall Road, Lahore </p>
              <p>Phone: +92 309 7224272</p>
            </div>
          </div>

          <div className="invoice-info">
            <h2>INVOICE</h2>
            <p>
              <strong>Invoice No:</strong> {invoiceNo}
            </p>
            <p>
              <strong>Date:</strong> {invoiceDate}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {sale.remainingAmount > 0 ? "PARTIAL / CREDIT" : "PAID"}
            </p>
          </div>
        </div>

        <div className="invoice-section">
          <h3>Customer Details</h3>

          <div className="customer-grid">
            <p>
              <strong>Name:</strong> {customer?.name || "Walk-in Customer"}
            </p>
            <p>
              <strong>Phone:</strong> {customer?.phone || "-"}
            </p>
            <p>
              <strong>Address:</strong> {customer?.address || "-"}
            </p>
          </div>
        </div>

        <div className="invoice-section">
          <h3>Sale Items</h3>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Model</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan="6">No sale items found.</td>
                </tr>
              )}

              {items.map((item, index) => {
                const qty = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const lineTotal = Number(item.lineTotal || qty * price);

                return (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.productName || item.name || "-"}</td>
                    <td>{item.model || "-"}</td>
                    <td>{qty}</td>
                    <td>{price.toLocaleString()}</td>
                    <td>{lineTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-bottom">
          <div className="invoice-note">
            <h3>Terms & Notes</h3>
            <p>Goods once sold will not be returned without valid reason.</p>
            <p>Please keep this invoice for warranty or payment record.</p>
          </div>

          <div className="invoice-summary-box">
            <div>
              <span>Total Amount</span>
              <strong>{Number(sale.totalAmount || 0).toLocaleString()}</strong>
            </div>

            <div>
              <span>Paid Amount</span>
              <strong>{Number(sale.paidAmount || 0).toLocaleString()}</strong>
            </div>

            <div className="remaining-row">
              <span>Remaining Balance</span>
              <strong>
                {Number(sale.remainingAmount || 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        <div className="invoice-footer">
          Thank you for your business.
        </div>
      </div>
    </div>
  );
}