import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getCategories, addCategory } from "../../services/categoryService";
import DataTable from "../../components/DataTable";

const emptyForm = {
  name: "",
  category: "",
  model: "",
  purchasePrice: "",
  salePrice: "",
  stockQuantity: "",
  lowStockAlert: "",
};

const defaultCategories = [
  { name: "panel", label: "Panel" },
  { name: "battery", label: "Battery" },
  { name: "body", label: "Body" },
  { name: "board", label: "Board" },
  { name: "accessories", label: "Accessories" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    loadCategories();

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setProducts(data);
    });

    return () => unsub();
  }, []);

  async function loadCategories() {
    const data = await getCategories();

    if (data.length > 0) {
      setCategories(data);
    } else {
      setCategories(defaultCategories);
    }
  }

  async function handleAddCategory() {
    const categoryName = prompt("Enter new category name");

    if (!categoryName || !categoryName.trim()) return;

    setCategoryLoading(true);

    try {
      await addCategory(categoryName);
      await loadCategories();
      alert("Category added successfully");
    } catch (error) {
      alert(error.message || "Failed to add category");
    } finally {
      setCategoryLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Product name is required");
      return;
    }

    if (!form.category) {
      alert("Please select category");
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      model: form.model.trim(),
      purchasePrice: Number(form.purchasePrice || 0),
      salePrice: Number(form.salePrice || 0),
      stockQuantity: Number(form.stockQuantity || 0),
      lowStockAlert: Number(form.lowStockAlert || 0),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      alert(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "",
      model: product.model || "",
      purchasePrice: product.purchasePrice || "",
      salePrice: product.salePrice || "",
      stockQuantity: product.stockQuantity || "",
      lowStockAlert: product.lowStockAlert || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      alert(error.message || "Failed to delete product");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <>
      <h1>Inventory</h1>

      <div className="form-card">
        <div className="form-title">
          {editingId ? "Edit Product" : "Add Product"}
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Product Name</label>
            <input
              className="form-input"
              placeholder="Samsung A12 Panel"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div className="form-field">
            <label>Category</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="">Select Category</option>

              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-muted"
              onClick={handleAddCategory}
              disabled={categoryLoading}
              style={{ marginTop: 8 }}
            >
              {categoryLoading ? "Adding..." : "+ Add New Category"}
            </button>
          </div>

          <div className="form-field">
            <label>Model</label>
            <input
              className="form-input"
              placeholder="A12, A32, A54"
              value={form.model}
              onChange={(e) =>
                setForm({ ...form, model: e.target.value })
              }
            />
          </div>

          <div className="form-field">
            <label>Purchase Price</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.purchasePrice}
              onChange={(e) =>
                setForm({ ...form, purchasePrice: e.target.value })
              }
            />
          </div>

          <div className="form-field">
            <label>Sale Price</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.salePrice}
              onChange={(e) =>
                setForm({ ...form, salePrice: e.target.value })
              }
            />
          </div>

          <div className="form-field">
            <label>Stock Quantity</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) =>
                setForm({ ...form, stockQuantity: e.target.value })
              }
            />
          </div>

          <div className="form-field">
            <label>Low Stock Alert</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.lowStockAlert}
              onChange={(e) =>
                setForm({ ...form, lowStockAlert: e.target.value })
              }
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" disabled={loading}>
              {loading
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-muted"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <DataTable
        rows={products}
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "model", label: "Model" },
          { key: "purchasePrice", label: "Purchase Price" },
          { key: "salePrice", label: "Sale Price" },
          {
            key: "stockQuantity",
            label: "Stock",
            render: (product) => (
              <span
                className={
                  Number(product.stockQuantity || 0) <=
                  Number(product.lowStockAlert || 0)
                    ? "dangerText"
                    : "successText"
                }
              >
                {product.stockQuantity}
              </span>
            ),
          },
          { key: "lowStockAlert", label: "Low Alert" },
          {
            key: "actions",
            label: "Actions",
            render: (product) => (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn small"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>

                <button
                  className="btn small danger"
                  onClick={() => handleDelete(product.id)}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}