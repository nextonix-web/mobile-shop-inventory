import { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import { listenCollection } from "../../services/crudService";
import { createPurchase } from "../../services/purchaseService";

function money(value) {
  return Number(value || 0).toLocaleString();
}

export default function Purchases() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [supplierName, setSupplierName] = useState("");
  const [items, setItems] = useState([
    { productId: "", quantity: 1, purchasePrice: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => listenCollection("products", setProducts), []);
  useEffect(() => listenCollection("purchases", setPurchases), []);

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.purchasePrice || 0),
    0
  );

  function resetForm() {
    setSupplierName("");
    setItems([{ productId: "", quantity: 1, purchasePrice: 0 }]);
    setErr("");
  }

  function addItem() {
    setItems([...items, { productId: "", quantity: 1, purchasePrice: 0 }]);
  }

  function updateItem(index, data) {
    setItems(
      items.map((item, i) => (i === index ? { ...item, ...data } : item))
    );
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!supplierName.trim()) {
      setErr("Supplier name is required");
      return;
    }

    const invalidItem = items.find(
      (item) => !item.productId || Number(item.quantity || 0) <= 0
    );

    if (invalidItem) {
      setErr("Please select product and valid quantity for all items");
      return;
    }

    setLoading(true);

    try {
      await createPurchase({
        supplierName,
        items: items.map((item) => {
          const product = products.find((p) => p.id === item.productId);

          return {
            ...item,
            productName: product?.name || "",
            model: product?.model || "",
          };
        }),
      });

      resetForm();
      setShowPurchaseModal(false);
    } catch (error) {
      setErr(error.message || "Failed to save purchase");
    } finally {
      setLoading(false);
    }
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const text = `
      ${purchase.supplierName || ""}
      ${purchase.totalAmount || ""}
      ${purchase.itemCount || ""}
      ${purchase.id || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const filteredTotal = filteredPurchases.reduce(
    (sum, purchase) => sum + Number(purchase.totalAmount || 0),
    0
  );

  return (
    <>
      <div className="page-title-row">
        <h1>Purchases / Stock In</h1>

        <button
          type="button"
          className="premium-add-btn"
          onClick={() => {
            resetForm();
            setShowPurchaseModal(true);
          }}
        >
          + Add Purchase
        </button>
      </div>

      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <div className="modal-header">
              <h2>Record Supplier Purchase</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() => {
                  resetForm();
                  setShowPurchaseModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="form-card modal-form-card">
              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label>Supplier Name</label>
                  <input
                    className="form-input"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>

                <div className="purchase-items">
                  {items.map((item, index) => (
                    <div className="purchase-item-card" key={index}>
                      <div className="form-field">
                        <label>Product</label>

                        <select
                          className="form-select"
                          value={item.productId}
                          onChange={(e) => {
                            const product = products.find(
                              (p) => p.id === e.target.value
                            );

                            updateItem(index, {
                              productId: e.target.value,
                              purchasePrice: product?.purchasePrice || 0,
                            });
                          }}
                        >
                          <option value="">Select</option>

                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.model} | Stock{" "}
                              {product.stockQuantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Qty</label>
                        <input
                          className="form-input"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Cost</label>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          value={item.purchasePrice}
                          onChange={(e) =>
                            updateItem(index, {
                              purchasePrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="btn small danger"
                        onClick={() => removeItem(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-muted add-item-btn"
                  onClick={addItem}
                >
                  + Add Item
                </button>

                <div className="sale-summary">
                  <div>
                    <span>Total Purchase</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <div>
                    <span>Total Items</span>
                    <strong>{items.length}</strong>
                  </div>
                </div>

                {err && <p className="dangerText">{err}</p>}

                <div className="form-actions">
                  <button className="btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Purchase"}
                  </button>

                  <button
                    type="button"
                    className="btn-muted"
                    onClick={() => {
                      resetForm();
                      setShowPurchaseModal(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="filter-card">
        <input
          className="form-input"
          placeholder="Search supplier, amount, invoice ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn-muted" onClick={() => setSearch("")}>
          Reset
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="muted">Filtered Purchases</div>
          <div className="total">{filteredPurchases.length}</div>
        </div>

        <div className="card">
          <div className="muted">Total Purchase Cost</div>
          <div className="total">{money(filteredTotal)}</div>
        </div>
      </div>

      <DataTable
        rows={filteredPurchases}
        empty="No purchases found"
        columns={[
          {
            key: "sr",
            label: "#",
            render: (_, index) => index + 1,
          },
          {
            key: "createdAt",
            label: "Date",
            render: (purchase) =>
              purchase.createdAt?.toDate?.().toLocaleString() || "",
          },
          {
            key: "supplierName",
            label: "Supplier",
          },
          {
            key: "itemCount",
            label: "Items",
          },
          {
            key: "totalAmount",
            label: "Total",
            render: (purchase) => money(purchase.totalAmount),
          },
        ]}
      />
    </>
  );
}