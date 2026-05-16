import { useEffect, useState } from "react";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../services/expenseService";

const emptyForm = {
  title: "",
  category: "general",
  amount: "",
  paymentMethod: "cash",
  note: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  async function loadExpenses() {
    const data = await getExpenses();
    setExpenses(data);
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Expense title is required");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Expense amount must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await updateExpense(editingId, form);
      } else {
        await addExpense(form);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowExpenseModal(false);

      await loadExpenses();
    } catch (error) {
      alert(error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(expense) {
    setEditingId(expense.id);

    setForm({
      title: expense.title || "",
      category: expense.category || "general",
      amount: expense.amount || "",
      paymentMethod: expense.paymentMethod || "cash",
      note: expense.note || "",
      date: expense.date?.toDate
        ? expense.date.toDate().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });

    setShowExpenseModal(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this expense?")) return;

    try {
      await deleteExpense(id);
      await loadExpenses();
    } catch (error) {
      alert(error.message || "Failed to delete expense");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setShowExpenseModal(false);
  }

  const filteredExpenses = expenses.filter((expense) => {
    const text = `
      ${expense.title || ""}
      ${expense.category || ""}
      ${expense.paymentMethod || ""}
      ${expense.note || ""}
      ${expense.amount || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory = categoryFilter
      ? expense.category === categoryFilter
      : true;

    const matchesMethod = methodFilter
      ? expense.paymentMethod === methodFilter
      : true;

    return matchesSearch && matchesCategory && matchesMethod;
  });

  const totalFilteredExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  return (
    <>
      <div className="page-title-row">
        <h1>Expenses</h1>

        <button
          type="button"
          className="premium-add-btn"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowExpenseModal(true);
          }}
        >
          + Add Expense
        </button>
      </div>

      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <div className="modal-header">
              <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={cancelEdit}
              >
                ✕
              </button>
            </div>

            <div className="form-card modal-form-card">
              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-field">
                  <label>Title</label>
                  <input
                    className="form-input"
                    required
                    placeholder="Expense title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
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
                    <option value="general">General</option>
                    <option value="rent">Rent</option>
                    <option value="salary">Salary</option>
                    <option value="electricity">Electricity</option>
                    <option value="internet">Internet</option>
                    <option value="transport">Transport</option>
                    <option value="repair">Repair</option>
                    <option value="food">Food</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Amount</label>
                  <input
                    className="form-input"
                    required
                    type="number"
                    min="1"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Payment Method</label>
                  <select
                    className="form-select"
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value })
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Note</label>
                  <input
                    className="form-input"
                    placeholder="Note"
                    value={form.note}
                    onChange={(e) =>
                      setForm({ ...form, note: e.target.value })
                    }
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-primary" disabled={loading}>
                    {loading
                      ? "Saving..."
                      : editingId
                      ? "Update Expense"
                      : "Add Expense"}
                  </button>

                  <button
                    type="button"
                    className="btn-muted"
                    onClick={cancelEdit}
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
          placeholder="Search title, note, category, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="rent">Rent</option>
          <option value="salary">Salary</option>
          <option value="electricity">Electricity</option>
          <option value="internet">Internet</option>
          <option value="transport">Transport</option>
          <option value="repair">Repair</option>
          <option value="food">Food</option>
          <option value="other">Other</option>
        </select>

        <select
          className="form-select"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="easypaisa">Easypaisa</option>
          <option value="jazzcash">JazzCash</option>
          <option value="card">Card</option>
        </select>

        <button
          className="btn-muted"
          onClick={() => {
            setSearch("");
            setCategoryFilter("");
            setMethodFilter("");
          }}
        >
          Reset
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="muted">Filtered Expenses</div>
          <div className="total">{filteredExpenses.length}</div>
        </div>

        <div className="card">
          <div className="muted">Total Expenses</div>
          <div className="total dangerText">
            {totalFilteredExpenses.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="8">No expenses found.</td>
              </tr>
            )}

            {filteredExpenses.map((expense, index) => (
              <tr key={expense.id}>
                <td>{index + 1}</td>

                <td>
                  {expense.date?.toDate
                    ? expense.date.toDate().toLocaleDateString()
                    : "-"}
                </td>

                <td>{expense.title}</td>
                <td>{expense.category}</td>
                <td>{expense.paymentMethod}</td>
                <td>{Number(expense.amount || 0).toLocaleString()}</td>
                <td>{expense.note || "-"}</td>

                <td>
                  <div className="actions">
                    <button
                      className="btn small"
                      onClick={() => handleEdit(expense)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn small danger"
                      onClick={() => handleDelete(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}