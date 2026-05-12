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
  }

  async function handleDelete(id) {
    const ok = confirm("Delete this expense?");
    if (!ok) return;

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
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  return (
    <>
      <h1>Expenses</h1>

      <div className="card">
        <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>

        <form onSubmit={handleSubmit} className="grid">
          <input
            required
            placeholder="Expense title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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

          <input
            required
            type="number"
            min="1"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <select
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

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <input
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <button className="btn" disabled={loading}>
            {loading
              ? "Saving..."
              : editingId
              ? "Update Expense"
              : "Add Expense"}
          </button>

          {editingId && (
            <button type="button" className="btn muted" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Total Expenses: {totalExpenses}</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
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
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="7">No expenses found.</td>
                </tr>
              )}

              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    {expense.date?.toDate
                      ? expense.date.toDate().toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{expense.title}</td>
                  <td>{expense.category}</td>
                  <td>{expense.paymentMethod}</td>
                  <td>{expense.amount}</td>
                  <td>{expense.note || "-"}</td>
                  <td className="actions">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}