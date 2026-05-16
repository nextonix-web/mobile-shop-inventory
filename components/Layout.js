import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const links = [
  ["/", "Dashboard"],
  ["/products", "Inventory"],
  ["/sales", "Sales"],
  ["/customers", "Customers"],
  ["/purchases", "Purchases"],
  ["/expenses", "Expenses"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
];

export default function Layout({ children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="app">
      <button
        className="mobile-menu-btn"
        type="button"
        onClick={() => setOpen(true)}
      >
        ☰ Menu
      </button>

      {open && <div className="mobile-overlay" onClick={closeMenu} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />

          <div>
            <div className="brand-title">Mobile Parts Shop</div>
            <div className="brand-subtitle">Inventory System</div>
          </div>
        </div>

        <nav className="nav">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className={
                router.pathname === href ||
                router.pathname.startsWith(href + "/")
                  ? "active"
                  : ""
              }
            >
              {label}
            </Link>
          ))}

          <button
            className="btn muted"
            onClick={() => signOut(auth)}
            style={{ marginTop: 20, width: "100%" }}
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}