import { useEffect, useMemo, useState } from "react";
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
import DataTable from "../../components/DataTable";

const emptyCustomer = {
  name: "",
  phone: "",
  address: "",
  openingReceivable: 0,
};

const emptyPayment = {
  customerId: "",
  amount: "",
  note: "",
};

function money(value) {
  return Number(value || 0).toLocaleString();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);

  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [editingCustomerId, setEditingCustomerId] = useState(null);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snap) => {
      setCustomers(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "sales"), (snap) => {
      setSales(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "payments"), (snap) => {
      setPayments(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  const customerRows = useMemo(() => {
    return customers.map((customer) => {
      const customerSales = sales.filter(
        (sale) => sale.customerId === customer.id
      );

      const customerPayments = payments.filter(
        (payment) => payment.customerId === customer.id
      );

      const salesTotal = customerSales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount || 0),
        0
      );

      const remainingFromSales = customerSales.reduce(
        (sum, sale) => sum + Number(sale.remainingAmount || 0),
        0
      );

      const paidFromPayments = customerPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );

      const openingReceivable = Number(customer.openingReceivable || 0);

      const totalReceivable = Math.max(
        0,
        openingReceivable + remainingFromSales - paidFromPayments
      );

      return {
        ...customer,
        salesTotal,
        paidFromPayments,
        totalReceivable,
      };
    });
  }, [customers, sales, payments]);

  const filteredCustomers = customerRows.filter((customer) => {
    const text = `
      ${customer.name || ""}
      ${customer.phone || ""}
      ${customer.address || ""}
      ${customer.totalReceivable || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const totalReceivable = filteredCustomers.reduce(
    (sum, customer) => sum + Number(customer.totalReceivable || 0),
    0
  );

  async function handleCustomerSubmit(e) {
    e.preventDefault();

    if (!customerForm.name.trim()) {
      alert("Customer name is required");
      return;
    }

    setLoading(true);

    const payload = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      openingReceivable: Number(customerForm.openingReceivable || 0),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingCustomerId) {
        await updateDoc(doc(db, "customers", editingCustomerId), payload);
      } else {
        await addDoc(collection(db, "customers"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setCustomerForm(emptyCustomer);
      setEditingCustomerId(null);
      setShowCustomerModal(false);
    } catch (error) {
      alert(error.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();

    if (!paymentForm.customerId) {
      alert("Please select customer");
      return;
    }

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Payment amount must be greater than 0");
      return;
    }

    const customer = customers.find((c) => c.id === paymentForm.customerId);

    setLoading(true);

    try {
      await addDoc(collection(db, "payments"), {
        customerId: paymentForm.customerId,
        customerName: customer?.name || "",
        amount: Number(paymentForm.amount || 0),
        note: paymentForm.note || "",
        createdAt: serverTimestamp(),
      });

      setPaymentForm(emptyPayment);
      setShowPaymentModal(false);
    } catch (error) {
      alert(error.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  }

  function handleEditCustomer(customer) {
    setEditingCustomerId(customer.id);

    setCustomerForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      openingReceivable: customer.openingReceivable || 0,
    });

    setShowCustomerModal(true);
  }

  async function handleDeleteCustomer(id) {
    if (!confirm("Delete this customer?")) return;

    try {
      await deleteDoc(doc(db, "customers", id));
    } catch (error) {
      alert(error.message || "Failed to delete customer");
    }
  }

  function closeCustomerModal() {
    setEditingCustomerId(null);
    setCustomerForm(emptyCustomer);
    setShowCustomerModal(false);
  }

  function closePaymentModal() {
    setPaymentForm(emptyPayment);
    setShowPaymentModal(false);
  }

  return (
    <>
      <div className="page-title-row">
        <h1>Customers & Credit</h1>

        <div className="title-actions">
          <button
            type="button"
            className="premium-add-btn"
            onClick={() => {
              setEditingCustomerId(null);
              setCustomerForm(emptyCustomer);
              setShowCustomerModal(true);
            }}
          >
            + Add Customer
          </button>

          <button
            type="button"
            className="premium-add-btn secondary"
            onClick={() => {
              setPaymentForm(emptyPayment);
              setShowPaymentModal(true);
            }}
          >
            + Add Payment
          </button>
        </div>
      </div>

      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <div className="modal-header">
              <h2>{editingCustomerId ? "Edit Customer" : "Add Customer"}</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={closeCustomerModal}
              >
                ✕
              </button>
            </div>

            <div className="form-card modal-form-card">
              <form onSubmit={handleCustomerSubmit} className="form-grid">
                <div className="form-field">
                  <label>Name</label>
                  <input
                    className="form-input"
                    value={customerForm.name}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Phone</label>
                  <input
                    className="form-input"
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Opening Receivable</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={customerForm.openingReceivable}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        openingReceivable: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Address</label>
                  <input
                    className="form-input"
                    value={customerForm.address}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-primary" disabled={loading}>
                    {loading
                      ? "Saving..."
                      : editingCustomerId
                      ? "Update Customer"
                      : "Save Customer"}
                  </button>

                  <button
                    type="button"
                    className="btn-muted"
                    onClick={closeCustomerModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <div className="modal-header">
              <h2>Add Payment</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={closePaymentModal}
              >
                ✕
              </button>
            </div>

            <div className="form-card modal-form-card">
              <form onSubmit={handlePaymentSubmit} className="form-grid">
                <div className="form-field">
                  <label>Customer</label>
                  <select
                    className="form-select"
                    value={paymentForm.customerId}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        customerId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Note</label>
                  <input
                    className="form-input"
                    value={paymentForm.note}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        note: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Payment"}
                  </button>

                  <button
                    type="button"
                    className="btn-muted"
                    onClick={closePaymentModal}
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
          placeholder="Search customer, phone, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn-muted" onClick={() => setSearch("")}>
          Reset
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <div className="muted">Total Customers</div>
          <div className="total">{filteredCustomers.length}</div>
        </div>

        <div className="card">
          <div className="muted">Total Receivable</div>
          <div className="total dangerText">{money(totalReceivable)}</div>
        </div>
      </div>

      <DataTable
        rows={filteredCustomers}
        empty="No customers found"
        columns={[
          {
            key: "sr",
            label: "#",
            render: (_, index) => index + 1,
          },
          {
            key: "name",
            label: "Name",
          },
          {
            key: "phone",
            label: "Phone",
          },
          {
            key: "address",
            label: "Address",
          },
          {
            key: "openingReceivable",
            label: "Opening",
            render: (customer) => money(customer.openingReceivable),
          },
          {
            key: "salesTotal",
            label: "Total Sales",
            render: (customer) => money(customer.salesTotal),
          },
          {
            key: "paidFromPayments",
            label: "Payments",
            render: (customer) => (
              <span className="successText">
                {money(customer.paidFromPayments)}
              </span>
            ),
          },
          {
            key: "totalReceivable",
            label: "Receivable",
            render: (customer) => (
              <span
                className={
                  customer.totalReceivable > 0 ? "dangerText" : "successText"
                }
              >
                {money(customer.totalReceivable)}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (customer) => (
              <div className="actions">
                <button
                  className="btn small"
                  onClick={() => handleEditCustomer(customer)}
                >
                  Edit
                </button>

                <button
                  className="btn small danger"
                  onClick={() => handleDeleteCustomer(customer.id)}
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