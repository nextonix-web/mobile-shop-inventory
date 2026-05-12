import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../lib/firebase";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
<div className="login-logo">
  <img src="logo.png" alt="Logo" />
</div>
          <h1 className="login-title">Welcome Back</h1>

          <p className="login-subtitle">
            Login to manage your mobile parts shop inventory
          </p>

          {err && <div className="login-error">{err}</div>}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label>Email</label>

              <input
                type="email"
                placeholder="admin@shop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-footer">
            Mobile Shop Inventory Management System
          </div>
        </div>
      </div>
    );
  }

  return children;
}