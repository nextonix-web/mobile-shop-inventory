import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

function num(value) {
  return Number(value || 0);
}

function money(value) {
  return num(value).toLocaleString();
}

function toDate(timestamp) {
  return timestamp?.toDate ? timestamp.toDate() : null;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);

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
    return onSnapshot(collection(db, "expenses"), (snap) =>
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "payments"), (snap) =>
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const dashboard = useMemo(() => {
    const today = new Date();
    const todayKey = dateKey(today);
    const thisMonth = monthKey(today);

    let todaySales = 0;
    let monthSales = 0;
    let totalSales = 0;
    let totalPaid = 0;
    let pendingPayments = 0;
    let grossProfit = 0;
    let totalExpenses = 0;

    const dailyMap = {};
    const categoryMap = {};
    const bestMap = {};

    sales.forEach((sale) => {
      const d = toDate(sale.createdAt);
      const total = num(sale.totalAmount);
      const paid = num(sale.paidAmount);
      const remaining = num(sale.remainingAmount);

      totalSales += total;
      totalPaid += paid;
      pendingPayments += remaining;

      if (d) {
        const day = dateKey(d);
        const month = monthKey(d);

        if (day === todayKey) todaySales += total;
        if (month === thisMonth) monthSales += total;

        dailyMap[day] = dailyMap[day] || {
          label: day.slice(5),
          sales: 0,
        };

        dailyMap[day].sales += total;
      }
    });

    saleItems.forEach((item) => {
      const qty = num(item.quantity);
      const lineTotal = num(item.lineTotal || qty * num(item.price));
      const profit = num(item.profit);

      grossProfit += profit;

      bestMap[item.productId] = bestMap[item.productId] || {
        name: item.productName || "Unknown",
        qty: 0,
        total: 0,
      };

      bestMap[item.productId].qty += qty;
      bestMap[item.productId].total += lineTotal;

      const product = products.find((p) => p.id === item.productId);
      const category = product?.category || "Unknown";

      categoryMap[category] = categoryMap[category] || {
        name: category,
        total: 0,
      };

      categoryMap[category].total += lineTotal;
    });

    expenses.forEach((expense) => {
      totalExpenses += num(expense.amount);
    });

    const inventoryCostValue = products.reduce(
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

    const recentSales = sales.slice(0, 6);

    const dailySales = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    const bestProducts = Object.values(bestMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const categorySales = Object.values(categoryMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      todaySales,
      monthSales,
      totalSales,
      totalPaid,
      pendingPayments,
      grossProfit,
      totalExpenses,
      netProfit: grossProfit - totalExpenses,
      inventoryCostValue,
      inventorySaleValue,
      totalProducts: products.length,
      totalCustomers: customers.length,
      lowStock,
      recentSales,
      dailySales,
      bestProducts,
      categorySales,
      paymentCount: payments.length,
    };
  }, [sales, saleItems, products, customers, expenses, payments]);

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Business Dashboard</h1>
          <p className="muted">
            Live overview of sales, profit, stock, credit and performance.
          </p>
        </div>

        <div className="dashboard-date">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="dashboard-kpis">
        <KpiCard title="Today Sales" value={money(dashboard.todaySales)} />
        <KpiCard title="This Month Sales" value={money(dashboard.monthSales)} />
        <KpiCard title="Pending Payments" value={money(dashboard.pendingPayments)} danger />
        <KpiCard title="Net Profit" value={money(dashboard.netProfit)} success={dashboard.netProfit >= 0} danger={dashboard.netProfit < 0} />
        <KpiCard title="Inventory Cost Value" value={money(dashboard.inventoryCostValue)} />
        <KpiCard title="Inventory Sale Value" value={money(dashboard.inventorySaleValue)} />
        <KpiCard title="Products" value={dashboard.totalProducts} />
        <KpiCard title="Customers" value={dashboard.totalCustomers} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card large">
          <div className="card-head">
            <h2>Last 7 Days Sales</h2>
            <span>Sales trend</span>
          </div>

          <BarChart
            data={dashboard.dailySales}
            labelKey="label"
            valueKey="sales"
          />
        </div>

        <div className="dashboard-card">
          <div className="card-head">
            <h2>Profit Summary</h2>
            <span>Gross vs Expenses</span>
          </div>

          <div className="profit-box">
            <div>
              <span>Gross Profit</span>
              <strong className="successText">{money(dashboard.grossProfit)}</strong>
            </div>

            <div>
              <span>Expenses</span>
              <strong className="dangerText">{money(dashboard.totalExpenses)}</strong>
            </div>

            <div>
              <span>Net Profit</span>
              <strong className={dashboard.netProfit >= 0 ? "successText" : "dangerText"}>
                {money(dashboard.netProfit)}
              </strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-head">
            <h2>Best Selling Products</h2>
            <span>By quantity</span>
          </div>

          <MiniList
            rows={dashboard.bestProducts}
            empty="No sales yet"
            render={(item, index) => (
              <>
                <div>
                  <strong>{index + 1}. {item.name}</strong>
                  <span>{item.qty} sold</span>
                </div>
                <b>{money(item.total)}</b>
              </>
            )}
          />
        </div>

        <div className="dashboard-card">
          <div className="card-head">
            <h2>Category Sales</h2>
            <span>Top categories</span>
          </div>

          <ProgressList rows={dashboard.categorySales} />
        </div>

        <div className="dashboard-card">
          <div className="card-head">
            <h2>Low Stock Alerts</h2>
            <span>{dashboard.lowStock.length} items</span>
          </div>

          <MiniList
            rows={dashboard.lowStock.slice(0, 7)}
            empty="No low stock items"
            render={(item) => (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.model || "-"} / {item.category || "-"}</span>
                </div>
                <b className="dangerText">{item.stockQuantity}</b>
              </>
            )}
          />
        </div>

        <div className="dashboard-card">
          <div className="card-head">
            <h2>Recent Sales</h2>
            <span>Latest invoices</span>
          </div>

          <MiniList
            rows={dashboard.recentSales}
            empty="No recent sales"
            render={(sale) => (
              <>
                <div>
                  <strong>{sale.customerName || "Walk-in"}</strong>
                  <span>
                    {sale.createdAt?.toDate?.().toLocaleString() || "-"}
                  </span>
                </div>
                <b>{money(sale.totalAmount)}</b>
              </>
            )}
          />
        </div>
      </div>
    </>
  );
}

function KpiCard({ title, value, success, danger }) {
  return (
    <div className="kpi-card">
      <span>{title}</span>
      <strong className={success ? "successText" : danger ? "dangerText" : ""}>
        {value}
      </strong>
    </div>
  );
}

function BarChart({ data, labelKey, valueKey }) {
  const max = Math.max(...data.map((d) => num(d[valueKey])), 1);

  return (
    <div className="bar-chart">
      {data.length === 0 && <div className="empty-chart">No sales data</div>}

      {data.map((item) => {
        const height = Math.max((num(item[valueKey]) / max) * 100, 6);

        return (
          <div className="bar-item" key={item[labelKey]}>
            <div className="bar-value">{money(item[valueKey])}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${height}%` }} />
            </div>
            <div className="bar-label">{item[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

function MiniList({ rows, render, empty }) {
  if (!rows || rows.length === 0) {
    return <div className="mini-empty">{empty}</div>;
  }

  return (
    <div className="mini-list">
      {rows.map((row, index) => (
        <div className="mini-row" key={row.id || row.name || index}>
          {render(row, index)}
        </div>
      ))}
    </div>
  );
}

function ProgressList({ rows }) {
  const max = Math.max(...rows.map((r) => num(r.total)), 1);

  if (!rows || rows.length === 0) {
    return <div className="mini-empty">No category sales yet</div>;
  }

  return (
    <div className="progress-list">
      {rows.map((row) => {
        const width = Math.max((num(row.total) / max) * 100, 4);

        return (
          <div className="progress-row" key={row.name}>
            <div className="progress-top">
              <strong>{row.name}</strong>
              <span>{money(row.total)}</span>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}