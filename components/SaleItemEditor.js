import { useState } from "react";

export default function SaleItemEditor({ products, items, setItems }) {
  const [searchTerms, setSearchTerms] = useState({});

  const add = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0 }]);
  };

  const update = (i, data) => {
    setItems(
      items.map((it, idx) =>
        idx === i ? { ...it, ...data } : it
      )
    );
  };

  const remove = (i) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="sale-items">
      {items.map((it, i) => {
        const selectedProduct = products.find((x) => x.id === it.productId);

        const search = searchTerms[i] || "";

        const filteredProducts = products.filter((product) => {
          const text = `
            ${product.name || ""}
            ${product.model || ""}
            ${product.category || ""}
          `.toLowerCase();

          return text.includes(search.toLowerCase());
        });

        return (
          <div className="sale-item-card" key={i}>
            <div className="form-field">
              <label>Search Product</label>
              <input
                className="form-input"
                placeholder="Search product / model / category..."
                value={search}
                onChange={(e) =>
                  setSearchTerms({
                    ...searchTerms,
                    [i]: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Product</label>

              <select
                className="form-select"
                required
                value={it.productId}
                onChange={(e) => {
                  const product = products.find(
                    (x) => x.id === e.target.value
                  );

                  update(i, {
                    productId: e.target.value,
                    price: product?.salePrice || 0,
                  });
                }}
              >
                <option value="">Select product</option>

                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.model} | Stock {p.stockQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Qty</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max={selectedProduct?.stockQuantity || 999999}
                value={it.quantity}
                onChange={(e) =>
                  update(i, { quantity: Number(e.target.value) })
                }
              />
            </div>

            <div className="form-field">
              <label>Price</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={it.price}
                onChange={(e) =>
                  update(i, { price: Number(e.target.value) })
                }
              />
            </div>

            <button
              type="button"
              className="btn small danger"
              onClick={() => remove(i)}
            >
              Remove
            </button>
          </div>
        );
      })}

      <button type="button" className="btn-muted add-item-btn" onClick={add}>
        + Add item
      </button>
    </div>
  );
}