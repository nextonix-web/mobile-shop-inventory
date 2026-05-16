import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DataTable from "../../components/DataTable";
import SaleItemEditor from "../../components/SaleItemEditor";
import { listenCollection } from "../../services/crudService";
import { createSale } from "../../services/salesService";

function money(value) {
  return Number(value || 0).toLocaleString();
}

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
  const [loading, setLoading] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  useEffect(() => listenCollection("products", setProducts), []);
  useEffect(() => listenCollection("customers", setCustomers), []);
  useEffect(() => listenCollection("sales", setSales), []);

  const total = items.reduce(
    (sum, item) => sum + (+item.quantity || 0) * (+item.price || 0),
    0
  );

  const remaining = Math.max(0, total - (+paidAmount || 0));

  function resetSaleForm() {
    setCustomerId("");
    setPaidAmount(0);
    setItems([{ productId: "", quantity: 1, price: 0 }]);
    setErr("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!items.length) {
      setErr("Please add at least one item");
      return;
    }

    const invalidItem = items.find(
      (item) => !item.productId || Number(item.quantity || 0) <= 0
    );

    if (invalidItem) {
      setErr("Please select product and valid quantity for all items");
      return;
    }

    if (remaining > 0 && !customerId) {
      setErr("Credit sale requires a selected customer");
      return;
    }

    setLoading(true);

    try {
      const customer = customers.find((x) => x.id === customerId);

      await createSale({
        customerId,
        customerName: customer?.name || "",
        paidAmount: Number(paidAmount || 0),
        items: items.map((item) => {
          const product = products.find((p) => p.id === item.productId);

          return {
            ...item,
            productName: product?.name || "",
            model: product?.model || "",
          };
        }),
      });

      resetSaleForm();
      setShowSaleModal(false);
    } catch (error) {
      setErr(error.message || "Failed to create sale");
    } finally {
      setLoading(false);
    }
  }

  const filteredSales = sales.filter((sale) => {
    const text = `
      ${sale.customerName || "walk-in"}
      ${sale.status || ""}
      ${sale.totalAmount || ""}
      ${sale.paidAmount || ""}
      ${sale.remainingAmount || ""}
      ${sale.id || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesStatus = statusFilter ? sale.status === statusFilter : true;

    const matchesCustomer = customerFilter
      ? sale.customerId === customerFilter
      : true;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const filteredTotalSales = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );

  const filteredPaidSales = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.paidAmount || 0),
    0
  );

  const filteredRemainingSales = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.remainingAmount || 0),
    0
  );

  return (
    <>
      <div className="page-title-row">
        <h1>Sales</h1>

        <button
          type="button"
          className="premium-add-btn"
          onClick={() => {
            resetSaleForm();
            setShowSaleModal(true);
          }}
        >
          + New Sale
        </button>
      </div>

      {showSaleModal && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <div className="modal-header">
              <h2>New Multi-Item Sale</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() => {
                  resetSaleForm();
                  setShowSaleModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="form-card modal-form-card">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Customer Optional</label>

                    <select
                      className="form-select"
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

                  <div className="form-field">
                    <label>Paid Amount</label>

                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                    />
                  </div>
                </div>

                <SaleItemEditor
                  products={products}
                  items={items}
                  setItems={setItems}
                />

                <div className="sale-summary">
                  <div>
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <div>
                    <span>Paid</span>
                    <strong className="successText">
                      {money(paidAmount)}
                    </strong>
                  </div>

                  <div>
                    <span>Remaining</span>
                    <strong
                      className={remaining > 0 ? "dangerText" : "successText"}
                    >
                      {money(remaining)}
                    </strong>
                  </div>
                </div>

                {err && <p className="dangerText">{err}</p>}

                <div className="form-actions">
                  <button className="btn-primary" disabled={loading}>
                    {loading ? "Creating Sale..." : "Complete Sale"}
                  </button>

                  <button
                    type="button"
                    className="btn-muted"
                    onClick={() => {
                      resetSaleForm();
                      setShowSaleModal(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>

                <p className="notice">
                  Credit sale requires a selected customer. Stock is deducted
                  inside a Firestore transaction, so negative stock is blocked.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="filter-card">
        <input
          className="form-input"
          placeholder="Search customer, invoice ID, amount, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="credit">Credit</option>
        </select>

        <select
          className="form-select"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        >
          <option value="">All Customers</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>

        <button
          className="btn-muted"
          onClick={() => {
            setSearch("");
            setStatusFilter("");
            setCustomerFilter("");
          }}
        >
          Reset
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="muted">Filtered Sales</div>
          <div className="total">{filteredSales.length}</div>
        </div>

        <div className="card">
          <div className="muted">Total Sales</div>
          <div className="total">{money(filteredTotalSales)}</div>
        </div>

        <div className="card">
          <div className="muted">Paid Amount</div>
          <div className="total successText">{money(filteredPaidSales)}</div>
        </div>

        <div className="card">
          <div className="muted">Remaining</div>
          <div className="total dangerText">{money(filteredRemainingSales)}</div>
        </div>
      </div>

      <DataTable
        rows={filteredSales}
        empty="No sales found"
        columns={[
          {
            key: "sr",
            label: "#",
            render: (_, index) => index + 1,
          },
          {
            key: "createdAt",
            label: "Date",
            render: (sale) =>
              sale.createdAt?.toDate?.().toLocaleString() || "",
          },
          {
            key: "invoice",
            label: "Invoice",
            render: (sale) => sale.id.slice(0, 8).toUpperCase(),
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
            render: (sale) => money(sale.totalAmount),
          },
          {
            key: "paidAmount",
            label: "Paid",
            render: (sale) => (
              <span className="successText">{money(sale.paidAmount)}</span>
            ),
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
                {money(sale.remainingAmount)}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (sale) => (
              <span
                className={
                  sale.status === "paid"
                    ? "successText"
                    : sale.status === "partial"
                    ? "warningText"
                    : "dangerText"
                }
              >
                {sale.status}
              </span>
            ),
          },
          {
            key: "invoiceAction",
            label: "Invoice",
            render: (sale) => (
              <button
                type="button"
                className="btn small"
                onClick={() => router.push(`/invoice/${sale.id}`)}
              >
                View
              </button>
            ),
          },
        ]}
      />
    </>
  );
}