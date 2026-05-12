import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DataTable from "../../components/DataTable";
import SaleItemEditor from "../../components/SaleItemEditor";
import { listenCollection } from "../../services/crudService";
import { createSale } from "../../services/salesService";

export default function Sales() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState([
    { productId: "", quantity: 1, price: 0 },
  ]);

  const [err, setErr] = useState("");

  useEffect(() => listenCollection("products", setProducts), []);
  useEffect(() => listenCollection("customers", setCustomers), []);
  useEffect(() => listenCollection("sales", setSales), []);

  const total = items.reduce(
    (s, it) => s + (+it.quantity || 0) * (+it.price || 0),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      const customer = customers.find((x) => x.id === customerId);

      await createSale({
        customerId,
        customerName: customer?.name || "",
        paidAmount,
        items: items.map((item) => {
          const product = products.find((p) => p.id === item.productId);

          return {
            ...item,
            productName: product?.name || "",
            model: product?.model || "",
          };
        }),
      });

      setCustomerId("");
      setPaidAmount(0);
      setItems([{ productId: "", quantity: 1, price: 0 }]);
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <>
      <h1>Sales</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>New Multi-Item Sale</h2>

        <div className="form-grid">
          <div className="field">
            <label>Customer Optional</label>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Walk-in / Cash Customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Paid Amount</label>

            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>
        </div>

        <SaleItemEditor products={products} items={items} setItems={setItems} />

        <div className="row">
          <div className="total">Total: {total}</div>

          <div className="dangerText">
            Remaining: {Math.max(0, total - (+paidAmount || 0))}
          </div>
        </div>

        {err && <p className="dangerText">{err}</p>}

        <button className="btn primary">Complete Sale</button>

        <p className="notice">
          Credit sale requires a selected customer. Stock is deducted inside a
          Firestore transaction, so negative stock is blocked.
        </p>
      </form>

      <DataTable
        rows={sales}
        columns={[
          {
            key: "createdAt",
            label: "Date",
            render: (sale) =>
              sale.createdAt?.toDate?.().toLocaleString() || "",
          },
          {
            key: "customerName",
            label: "Customer",
            render: (sale) => sale.customerName || "Walk-in",
          },
          {
            key: "itemCount",
            label: "Items",
          },
          {
            key: "totalAmount",
            label: "Total",
          },
          {
            key: "paidAmount",
            label: "Paid",
          },
          {
            key: "remainingAmount",
            label: "Remaining",
            render: (sale) => (
              <span
                className={
                  sale.remainingAmount > 0 ? "dangerText" : "successText"
                }
              >
                {sale.remainingAmount}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
          },
          {
            key: "invoice",
            label: "Invoice",
            render: (sale) => (
              <button
                type="button"
                className="btn small"
                onClick={() => router.push(`/invoice/${sale.id}`)}
              >
                Invoice
              </button>
            ),
          },
        ]}
      />
    </>
  );
}