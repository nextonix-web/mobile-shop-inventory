import { useEffect, useState } from "react";
import { getCategories, addCategory } from "../services/categoryService";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    const data = await getCategories();
    setCategories(data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Category name is required");
      return;
    }

    setLoading(true);

    try {
      await addCategory(name);
      setName("");
      await loadCategories();
    } catch (error) {
      alert(error.message || "Failed to add category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Inventory Categories</h1>

      <div className="form-card">
        <div className="form-title">Add New Category</div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Category Name</label>
            <input
              className="form-input"
              placeholder="Example: Charger, LCD, Cable"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Add Category"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Categories</h2>

        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Stored Value</th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan="2">No categories found.</td>
              </tr>
            )}

            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.label}</td>
                <td>{cat.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}