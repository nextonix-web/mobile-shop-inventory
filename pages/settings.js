import { useEffect, useState } from "react";
import {
  getShopSettings,
  saveShopSettings,
} from "../services/settingsService";

const emptyForm = {
  appName: "",
  shopName: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoText: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const data = await getShopSettings();
    setForm(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await saveShopSettings(form);
      alert("Shop settings saved successfully");
    } catch (error) {
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Shop Settings</h1>

      <div className="form-card">
        <div className="form-title">Business Information</div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>App Name</label>
            <input
              className="form-input"
              value={form.appName}
              onChange={(e) =>
                setForm({ ...form, appName: e.target.value })
              }
              placeholder="Mobile Parts Shop"
            />
          </div>

          <div className="form-field">
            <label>Shop Name</label>
            <input
              className="form-input"
              value={form.shopName}
              onChange={(e) =>
                setForm({ ...form, shopName: e.target.value })
              }
              placeholder="Beijing Mobile"
            />
          </div>

          <div className="form-field">
            <label>Logo Text</label>
            <input
              className="form-input"
              maxLength="4"
              value={form.logoText}
              onChange={(e) =>
                setForm({ ...form, logoText: e.target.value })
              }
              placeholder="BM"
            />
          </div>

          <div className="form-field">
            <label>Tagline</label>
            <input
              className="form-input"
              value={form.tagline}
              onChange={(e) =>
                setForm({ ...form, tagline: e.target.value })
              }
              placeholder="Mobile Parts, Panels, Batteries & Accessories"
            />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              placeholder="0300-0000000"
            />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input
              className="form-input"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="shop@email.com"
            />
          </div>

          <div className="form-field">
            <label>Website</label>
            <input
              className="form-input"
              value={form.website}
              onChange={(e) =>
                setForm({ ...form, website: e.target.value })
              }
              placeholder="www.yourshop.com"
            />
          </div>

          <div className="form-field">
            <label>Address</label>
            <input
              className="form-input"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
              placeholder="Shop address"
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>

      <div className="shop-preview-card">
        <div className="shop-preview-logo">
          {form.logoText || "MP"}
        </div>

        <div>
          <h2>{form.shopName || "Mobile Parts Shop"}</h2>
          <p>{form.tagline}</p>
          <p>{form.address}</p>
          <p>{form.phone}</p>
          <p>{form.email}</p>
          <p>{form.website}</p>
        </div>
      </div>
    </>
  );
}