import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import DataTable from "../../components/DataTable";

function num(value) {
  return Number(value || 0);
}

function formatMoney(value) {
  return num(value).toLocaleString();
}

function getDateValue(timestamp) {
  return timestamp?.toDate ? timestamp.toDate() : null;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function isBetween(date, from, to) {
  if (!date) return false;

  const current = dateKey(date);

  if (from && current < from) return false;
  if (to && current > to) return false;

  return true;
}

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [fromDate, setFromDate] = useState(`${currentMonth}-01`);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "sales"), orderBy("createdAt", "desc")),
      (snap) => setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "sale_items"), (snap) =>
      setSaleItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "customers"), (snap) =>
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "payments"), (snap) =>
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "purchases"), (snap) =>
      setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "purchase_items"), (snap) =>
      setPurchaseItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "expenses"), (snap) =>
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const report = useMemo(() => {
    const filteredSales = sales.filter((sale) =>
      isBetween(getDateValue(sale.createdAt), fromDate, toDate)
    );

    const filteredSaleIds = new Set(filteredSales.map((sale) => sale.id));

    const filteredSaleItems = saleItems.filter((item) =>
      filteredSaleIds.has(item.saleId)
    );

    const filteredPayments = payments.filter((payment) =>
      isBetween(getDateValue(payment.createdAt || payment.date), fromDate, toDate)
    );

    const filteredPurchases = purchases.filter((purchase) =>
      isBetween(getDateValue(purchase.createdAt || purchase.date), fromDate, toDate)
    );

    const filteredPurchaseIds = new Set(filteredPurchases.map((p) => p.id));

    const filteredPurchaseItems = purchaseItems.filter((item) =>
      filteredPurchaseIds.has(item.purchaseId)
    );

    const filteredExpenses = expenses.filter((expense) =>
      isBetween(getDateValue(expense.date || expense.createdAt), fromDate, toDate)
    );

    let totalSales = 0;
    let totalPaid = 0;
    let totalReceivable = 0;
    let grossProfit = 0;
    let totalExpenses = 0;
    let totalPurchases = 0;
    let totalItemsSold = 0;

    const dailySales = {};
    const monthlySales = {};
    const bestProducts = {};
    const categorySales = {};
    const customerSales = {};
    const creditSales = [];

    filteredSales.forEach((sale) => {
      const saleTotal = num(sale.totalAmount);
      const paid = num(sale.paidAmount);
      const remaining = num(sale.remainingAmount);

      totalSales += saleTotal;
      totalPaid += paid;
      totalReceivable += remaining;

      const d = getDateValue(sale.createdAt);

      if (d) {
        const day = dateKey(d);
        const month = monthKey(d);

        dailySales[day] = dailySales[day] || {
          date: day,
          sales: 0,
          paid: 0,
          remaining: 0,
          orders: 0,
        };

        dailySales[day].sales += saleTotal;
        dailySales[day].paid += paid;
        dailySales[day].remaining += remaining;
        dailySales[day].orders += 1;

        monthlySales[month] = monthlySales[month] || {
          month,
          sales: 0,
          paid: 0,
          remaining: 0,
          orders: 0,
        };

        monthlySales[month].sales += saleTotal;
        monthlySales[month].paid += paid;
        monthlySales[month].remaining += remaining;
        monthlySales[month].orders += 1;
      }

      if (remaining > 0) {
        creditSales.push({
          invoice: sale.id.slice(0, 8).toUpperCase(),
          customerName: sale.customerName || "Walk-in",
          totalAmount: saleTotal,
          paidAmount: paid,
          remainingAmount: remaining,
          status: sale.status || "credit",
        });
      }

      const customerKey = sale.customerId || "walk-in";

      customerSales[customerKey] = customerSales[customerKey] || {
        customerName: sale.customerName || "Walk-in",
        orders: 0,
        totalSales: 0,
        paid: 0,
        remaining: 0,
      };

      customerSales[customerKey].orders += 1;
      customerSales[customerKey].totalSales += saleTotal;
      customerSales[customerKey].paid += paid;
      customerSales[customerKey].remaining += remaining;
    });

    filteredSaleItems.forEach((item) => {
      const qty = num(item.quantity);
      const lineTotal = num(item.lineTotal || qty * num(item.price));
      const profit = num(item.profit);

      totalItemsSold += qty;
      grossProfit += profit;

      const productId = item.productId || "unknown";

      bestProducts[productId] = bestProducts[productId] || {
        productName: item.productName || "Unknown Product",
        model: item.model || "-",
        quantity: 0,
        salesValue: 0,
        profit: 0,
      };

      bestProducts[productId].quantity += qty;
      bestProducts[productId].salesValue += lineTotal;
      bestProducts[productId].profit += profit;

      const product = products.find((p) => p.id === item.productId);
      const category = product?.category || "unknown";

      categorySales[category] = categorySales[category] || {
        category,
        quantity: 0,
        salesValue: 0,
        profit: 0,
      };

      categorySales[category].quantity += qty;
      categorySales[category].salesValue += lineTotal;
      categorySales[category].profit += profit;
    });

    filteredExpenses.forEach((expense) => {
      totalExpenses += num(expense.amount);
    });

    filteredPurchases.forEach((purchase) => {
      totalPurchases += num(purchase.totalAmount || purchase.totalCost);
    });

    filteredPurchaseItems.forEach((item) => {
      if (!item.purchaseId) {
        totalPurchases += num(item.lineTotal || num(item.quantity) * num(item.purchasePrice));
      }
    });

    const inventoryValue = products.reduce(
      (sum, p) => sum + num(p.stockQuantity) * num(p.purchasePrice),
      0
    );

    const inventorySaleValue = products.reduce(
      (sum, p) => sum + num(p.stockQuantity) * num(p.salePrice),
      0
    );

    const lowStock = products.filter(
      (p) => num(p.stockQuantity) <= num(p.lowStockAlert)
    );

    const soldProductIds = new Set(saleItems.map((item) => item.productId));

    const deadStock = products.filter(
      (p) => num(p.stockQuantity) > 0 && !soldProductIds.has(p.id)
    );

    const netProfit = grossProfit - totalExpenses;

    return {
      summary: {
        totalSales,
        totalPaid,
        totalReceivable,
        grossProfit,
        totalExpenses,
        netProfit,
        totalPurchases,
        totalItemsSold,
        inventoryValue,
        inventorySaleValue,
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: filteredSales.length,
      },

      dailySales: Object.values(dailySales).sort((a, b) =>
        b.date.localeCompare(a.date)
      ),

      monthlySales: Object.values(monthlySales).sort((a, b) =>
        b.month.localeCompare(a.month)
      ),

      bestProducts: Object.values(bestProducts).sort(
        (a, b) => b.quantity - a.quantity
      ),

      categorySales: Object.values(categorySales).sort(
        (a, b) => b.salesValue - a.salesValue
      ),

      customerSales: Object.values(customerSales).sort(
        (a, b) => b.totalSales - a.totalSales
      ),

      creditSales: creditSales.sort(
        (a, b) => b.remainingAmount - a.remainingAmount
      ),

      lowStock,
      deadStock,
    };
  }, [
    sales,
    saleItems,
    products,
    customers,
    payments,
    purchases,
    purchaseItems,
    expenses,
    fromDate,
    toDate,
  ]);

  return (
    <>
      <div className="report-header">
        <div>
          <h1>Detailed Reports</h1>
          <p className="muted">
            Sales, profit, credit, inventory, customers, expenses and stock
            performance.
          </p>
        </div>

        <div className="report-filters">
          <div className="form-field">
            <label>From</label>
            <input
              className="form-input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>To</label>
            <input
              className="form-input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button
            className="btn-muted"
            onClick={() => {
              setFromDate(`${currentMonth}-01`);
              setToDate(today);
            }}
          >
            This Month
          </button>

          <button
            className="btn-muted"
            onClick={() => {
              setFromDate(today);
              setToDate(today);
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="report-grid">
        <ReportCard title="Total Sales" value={formatMoney(report.summary.totalSales)} />
        <ReportCard title="Paid Amount" value={formatMoney(report.summary.totalPaid)} success />
        <ReportCard title="Pending Receivable" value={formatMoney(report.summary.totalReceivable)} danger />
        <ReportCard title="Gross Profit" value={formatMoney(report.summary.grossProfit)} success />
        <ReportCard title="Expenses" value={formatMoney(report.summary.totalExpenses)} danger />
        <ReportCard title="Net Profit" value={formatMoney(report.summary.netProfit)} success={report.summary.netProfit >= 0} danger={report.summary.netProfit < 0} />
        <ReportCard title="Purchase Cost" value={formatMoney(report.summary.totalPurchases)} />
        <ReportCard title="Items Sold" value={formatMoney(report.summary.totalItemsSold)} />
        <ReportCard title="Inventory Cost Value" value={formatMoney(report.summary.inventoryValue)} />
        <ReportCard title="Inventory Sale Value" value={formatMoney(report.summary.inventorySaleValue)} />
        <ReportCard title="Total Products" value={formatMoney(report.summary.totalProducts)} />
        <ReportCard title="Total Customers" value={formatMoney(report.summary.totalCustomers)} />
      </div>

      <div className="card">
        <h2>Daily Sales Report</h2>
        <DataTable
          rows={report.dailySales}
          empty="No daily sales found"
          columns={[
            { key: "date", label: "Date" },
            { key: "orders", label: "Orders" },
            { key: "sales", label: "Sales", render: (r) => formatMoney(r.sales) },
            { key: "paid", label: "Paid", render: (r) => formatMoney(r.paid) },
            {
              key: "remaining",
              label: "Remaining",
              render: (r) => (
                <span className={r.remaining > 0 ? "dangerText" : "successText"}>
                  {formatMoney(r.remaining)}
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="card">
        <h2>Monthly Sales Report</h2>
        <DataTable
          rows={report.monthlySales}
          empty="No monthly sales found"
          columns={[
            { key: "month", label: "Month" },
            { key: "orders", label: "Orders" },
            { key: "sales", label: "Sales", render: (r) => formatMoney(r.sales) },
            { key: "paid", label: "Paid", render: (r) => formatMoney(r.paid) },
            {
              key: "remaining",
              label: "Remaining",
              render: (r) => formatMoney(r.remaining),
            },
          ]}
        />
      </div>

      <div className="card">
        <h2>Best Selling Products</h2>
        <DataTable
          rows={report.bestProducts}
          empty="No best sellers yet"
          columns={[
            { key: "productName", label: "Product" },
            { key: "model", label: "Model" },
            { key: "quantity", label: "Qty Sold" },
            {
              key: "salesValue",
              label: "Sales Value",
              render: (r) => formatMoney(r.salesValue),
            },
            {
              key: "profit",
              label: "Profit",
              render: (r) => (
                <span className="successText">{formatMoney(r.profit)}</span>
              ),
            },
          ]}
        />
      </div>

      <div className="card">
        <h2>Category Wise Sales</h2>
        <DataTable
          rows={report.categorySales}
          empty="No category sales yet"
          columns={[
            { key: "category", label: "Category" },
            { key: "quantity", label: "Qty Sold" },
            {
              key: "salesValue",
              label: "Sales Value",
              render: (r) => formatMoney(r.salesValue),
            },
            {
              key: "profit",
              label: "Profit",
              render: (r) => formatMoney(r.profit),
            },
          ]}
        />
      </div>

      <div className="card">
        <h2>Customer Wise Sales & Credit</h2>
        <DataTable
          rows={report.customerSales}
          empty="No customer sales found"
          columns={[
            { key: "customerName", label: "Customer" },
            { key: "orders", label: "Orders" },
            {
              key: "totalSales",
              label: "Total Sales",
              render: (r) => formatMoney(r.totalSales),
            },
            { key: "paid", label: "Paid", render: (r) => formatMoney(r.paid) },
            {
              key: "remaining",
              label: "Receivable",
              render: (r) => (
                <span className={r.remaining > 0 ? "dangerText" : "successText"}>
                  {formatMoney(r.remaining)}
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="card">
        <h2>Pending / Credit Sales</h2>
        <DataTable
          rows={report.creditSales}
          empty="No pending credit sales"
          columns={[
            { key: "invoice", label: "Invoice" },
            { key: "customerName", label: "Customer" },
            {
              key: "totalAmount",
              label: "Total",
              render: (r) => formatMoney(r.totalAmount),
            },
            {
              key: "paidAmount",
              label: "Paid",
              render: (r) => formatMoney(r.paidAmount),
            },
            {
              key: "remainingAmount",
              label: "Remaining",
              render: (r) => (
                <span className="dangerText">
                  {formatMoney(r.remainingAmount)}
                </span>
              ),
            },
            { key: "status", label: "Status" },
          ]}
        />
      </div>

      <div className="card">
        <h2>Low Stock Items</h2>
        <DataTable
          rows={report.lowStock}
          empty="No low stock items"
          columns={[
            { key: "name", label: "Product" },
            { key: "model", label: "Model" },
            { key: "category", label: "Category" },
            {
              key: "stockQuantity",
              label: "Stock",
              render: (r) => (
                <span className="dangerText">{r.stockQuantity}</span>
              ),
            },
            { key: "lowStockAlert", label: "Low Alert" },
          ]}
        />
      </div>

      <div className="card">
        <h2>Dead Stock</h2>
        <DataTable
          rows={report.deadStock}
          empty="No dead stock"
          columns={[
            { key: "name", label: "Product" },
            { key: "model", label: "Model" },
            { key: "category", label: "Category" },
            { key: "stockQuantity", label: "Stock" },
            {
              key: "purchasePrice",
              label: "Cost Value",
              render: (r) => formatMoney(num(r.stockQuantity) * num(r.purchasePrice)),
            },
          ]}
        />
      </div>
    </>
  );
}

function ReportCard({ title, value, success, danger }) {
  return (
    <div className="report-card">
      <div className="muted">{title}</div>
      <div
        className={`report-value ${
          success ? "successText" : danger ? "dangerText" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}