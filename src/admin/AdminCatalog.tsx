import { brands } from "../shared/brands";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { serverApi } from "../lib/config";
import { api } from "../shared/api";
import { AdminProduct, loadAdminProducts } from "./adminProducts";
import {
  clothingSizes,
  collections,
  money,
  shoeSizes,
} from "../shared/contracts";
import { useAdmin } from "./state";
import { Empty, ErrorBox, Loading, PageHeading, Picture } from "../shared/ui";
import { ProductCardFrame } from "../shared/ProductCardFrame";

export function AdminCatalog() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [collection, setCollection] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const editor = useRef<HTMLElement>(null);
  const { notify } = useAdmin();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loadAdminProducts(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setProducts(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause.message || "Unable to load products. Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  const edit = (product: AdminProduct) => {
    setEditing(product);
    setCollection(product.productCollection);
    setSizes(product.productSizes || []);
    setSaveError("");
  };
  useEffect(() => {
    if (editing) {
      editor.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
      editor.current?.focus();
    }
  }, [editing]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || busy) return;
    setSaveError("");
    if (!sizes.length || (sizes.includes("ONESIZE") && sizes.length > 1)) {
      setSaveError("Choose valid sizes. One size must be selected on its own.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const { data } = await api<{ data: AdminProduct }>(
        `/admin/product/${editing._id}`,
        {
          method: "POST",
          body: {
            productName: String(form.get("productName")).trim(),
            productCollection: collection,
            productBrand: String(form.get("productBrand") || ""),
            productPrice: Number(form.get("productPrice")),
            productLeftCount: Number(form.get("productLeftCount")),
            productSizes: sizes,
            productDesc: String(form.get("productDesc") || ""),
            productStatus: String(form.get("productStatus")),
          },
        },
      );
      setProducts((current) =>
        current.map((product) => (product._id === data._id ? data : product)),
      );
      setEditing(null);
      notify("Product updated.");
    } catch (cause) {
      setSaveError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading
        eyebrow="STORE ADMINISTRATION"
        title="Your collection, considered."
      >
        Manage every product, including paused and archived pieces.
      </PageHeading>
      <nav className="kv-admin-nav" aria-label="Administration">
        <Link to="/administration">Workspace</Link>
        <Link to="/administration/products">Products</Link>
        <Link to="/administration/orders">Orders ↗</Link>
        <Link to="/administration/customers">Customers ↗</Link>
      </nav>
      <div className="kv-row kv-admin-toolbar">
        <Link className="kv-button" to="/administration/create">
          Add product +
        </Link>
        <a className="kv-text-link" href={`${serverApi}/admin/product/all`}>
          Original product manager ↗
        </a>
      </div>
      {editing && (
        <section
          ref={editor}
          tabIndex={-1}
          className="kv-panel kv-admin-editor"
          aria-labelledby="edit-product-title"
        >
          <div className="kv-row">
            <h2 id="edit-product-title">Edit {editing.productName}</h2>
            <button
              className="kv-text-button"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Close editor
            </button>
          </div>
          <form key={editing._id} className="kv-form" onSubmit={save}>
            <ErrorBox message={saveError} />
            <div className="kv-form-grid">
              <label className="kv-field">
                Product name
                <input
                  name="productName"
                  defaultValue={editing.productName}
                  maxLength={200}
                  required
                />
              </label>
              <label className="kv-field">
                Collection
                <select
                  value={collection}
                  onChange={(event) => {
                    setCollection(event.target.value);
                    setSizes([]);
                  }}
                >
                  {Object.entries(collections).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="kv-field">
                Brand
                <select
                  name="productBrand"
                  defaultValue={editing.productBrand || ""}
                >
                  <option value="">Not assigned</option>
                  {Object.entries(brands).map(([key, brand]) => (
                    <option value={key} key={key}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="kv-field">
                Price (USD)
                <input
                  name="productPrice"
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  defaultValue={editing.productPrice}
                  required
                />
              </label>
              <label className="kv-field">
                Stock across all sizes
                <input
                  name="productLeftCount"
                  type="number"
                  min={0}
                  max={1000000}
                  step={1}
                  defaultValue={editing.productLeftCount}
                  required
                />
              </label>
            </div>
            <fieldset className="kv-size-field">
              <legend>Available sizes</legend>
              <div className="kv-size-options">
                {(collection === "SHOES" ? shoeSizes : clothingSizes).map(
                  (size) => (
                    <button
                      type="button"
                      key={size}
                      aria-pressed={sizes.includes(size)}
                      onClick={() =>
                        setSizes((current) =>
                          current.includes(size)
                            ? current.filter((value) => value !== size)
                            : size === "ONESIZE"
                              ? ["ONESIZE"]
                              : [
                                  ...current.filter(
                                    (value) => value !== "ONESIZE",
                                  ),
                                  size,
                                ],
                        )
                      }
                    >
                      {size === "ONESIZE" ? "One size" : size}
                    </button>
                  ),
                )}
              </div>
            </fieldset>
            <label className="kv-field">
              Description
              <textarea
                name="productDesc"
                defaultValue={editing.productDesc}
                maxLength={5000}
                rows={4}
              />
            </label>
            <label className="kv-field">
              Status
              <select name="productStatus" defaultValue={editing.productStatus}>
                <option value="PAUSE">Paused</option>
                <option value="PROCESS">Published</option>
                <option value="DELETE">Archived</option>
              </select>
            </label>
            <p className="kv-hint">
              Existing images are kept. Image replacement is not supported.
            </p>
            <button className="kv-button" disabled={busy}>
              {busy ? "Saving…" : "Save product changes"} ↗
            </button>
          </form>
        </section>
      )}
      {loading ? (
        <Loading cards />
      ) : error ? (
        <>
          <ErrorBox
            message={error}
            retry={() => setRevision((value) => value + 1)}
          />
          <Link className="kv-button secondary" to="/administration">
            Administrator sign in →
          </Link>
        </>
      ) : products.length ? (
        <div className="kv-grid">
          {products.map((product) => (
            <ProductCardFrame
              key={product._id}
              image={
                <div className="kv-product-image">
                  <Picture
                    path={product.productImages[0]}
                    alt={product.productName}
                  />
                  <span className="kv-badge">
                    {product.productLeftCount > 0
                      ? `${product.productLeftCount} in stock`
                      : "Sold out"}
                  </span>
                </div>
              }
            >
              <p className="kv-eyebrow">
                {collections[product.productCollection]}
              </p>
              <h3>{product.productName}</h3>
              <div className="kv-row">
                <strong>{money(product.productPrice)}</strong>
                <span>
                  {product.productStatus === "PROCESS"
                    ? "Published"
                    : product.productStatus === "PAUSE"
                      ? "Paused"
                      : "Archived"}
                </span>
              </div>
              <p className="kv-hint">
                Sizes: {product.productSizes?.join(", ") || "Not set"}
              </p>
              <button
                className="kv-button secondary full"
                onClick={() => edit(product)}
              >
                Edit product ↗
              </button>
            </ProductCardFrame>
          ))}
        </div>
      ) : (
        <Empty title="A new collection starts here.">
          <p>Add your first product to get started.</p>
          <Link className="kv-button" to="/administration/create">
            Create a product ↗
          </Link>
        </Empty>
      )}
    </div>
  );
}
