export default function SaleItemEditor({ products, items, setItems }) {
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

  return (
    <div>
      {items.map((it, i) => {
        const selectedProduct = products.find((x) => x.id === it.productId);

        return (
          <div className="itemLine" key={i}>
            <div className="field">
              <label>Product</label>

              <select
                required
                value={it.productId}
                onChange={(e) => {
                  const product = products.find((x) => x.id === e.target.value);

                  update(i, {
                    productId: e.target.value,
                    price: product?.salePrice || 0,
                  });
                }}
              >
                <option value="">Select product</option>

                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.model} | Stock {p.stockQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Qty</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stockQuantity || 999999}
                value={it.quantity}
                onChange={(e) =>
                  update(i, { quantity: Number(e.target.value) })
                }
              />
            </div>

            <div className="field">
              <label>Price</label>
              <input
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
              className="btn danger"
              onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </div>
        );
      })}

      <button type="button" className="btn muted" onClick={add}>
        + Add item
      </button>
    </div>
  );
}