import { brands } from "../shared/brands";
import { storefrontUrl } from "../lib/config";
import React, { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../shared/api";
import { adminLogin, adminLogout } from "./adminApi";
import {
  clothingSizes,
  collections,
  shoeSizes,
  StoreMember,
  StoreProduct,
} from "../shared/contracts";
import { validImage } from "../shared/validation";
import { useAdmin } from "./state";
import { useResource } from "../shared/useResource";
import { ErrorBox, Loading, PageHeading } from "../shared/ui";

export function Administration({ create = false }: { create?: boolean }) {
  const session = useResource<{ member: StoreMember }>("/admin/check");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [collection, setCollection] = useState("CLOTHE");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [created, setCreated] = useState<StoreProduct | null>(null);
  const { notify } = useAdmin();
  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await adminLogin(
        String(data.get("memberNick")).trim(),
        String(data.get("memberPassword")),
      );
      session.reload();
      notify("Administrator session is ready.");
    } catch (cause) {
      setError((cause as Error).message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const data = new FormData(event.currentTarget);
    const files = data.getAll("productImages") as File[];
    if (!files.length || files.length > 5 || !files[0].size) {
      setError("Choose between one and five product images.");
      return;
    }
    for (const file of files) {
      const problem = validImage(file);
      if (problem) {
        setError(problem);
        return;
      }
    }
    if (
      !selectedSizes.length ||
      (selectedSizes.includes("ONESIZE") && selectedSizes.length > 1)
    ) {
      setError("Choose valid sizes; One size must be selected on its own.");
      return;
    }
    selectedSizes.forEach((size) => data.append("productSizes", size));
    setBusy(true);
    try {
      const value = await api<{ data: StoreProduct }>("/admin/product/create", {
        method: "POST",
        body: data,
      });
      setCreated(value.data);
      notify("Product created.");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading
        eyebrow="KVN STORE ADMINISTRATION"
        title={create ? "Add a considered piece." : "Your store workspace."}
      >
        Manage the collection, customers, and fulfillment.
      </PageHeading>
      <div className="kv-admin-nav">
        <Link to="/administration">Workspace</Link>
        <Link to="/administration/products">Products</Link>
        <Link to="/administration/orders">Orders ↗</Link>
        <Link to="/administration/customers">Customers ↗</Link>
        <Link to="/administration/reviews">Reviews</Link>
        <a href={storefrontUrl}>Storefront</a>
      </div>
      {session.loading ? (
        <Loading />
      ) : !session.data ? (
        <div className="kv-panel kv-admin-login">
          <h2>Administrator sign in</h2>
          <p className="kv-muted">
            Use your provisioned administrator account. Storefront sign-in and
            administration use separate sessions.
          </p>
          <ErrorBox
            message={
              error ||
              (session.error &&
              !/login required|not authorized/i.test(session.error)
                ? session.error
                : "")
            }
            retry={
              session.error &&
              !/login required|not authorized/i.test(session.error)
                ? session.reload
                : undefined
            }
          />
          <form className="kv-form" onSubmit={login}>
            <label className="kv-field">
              Nickname
              <input
                required
                name="memberNick"
                maxLength={500}
                autoComplete="username"
              />
            </label>
            <label className="kv-field">
              Password
              <input
                required
                name="memberPassword"
                type="password"
                maxLength={500}
                autoComplete="current-password"
              />
            </label>
            <button className="kv-button" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to administration"} ↗
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="kv-row">
            <p>
              Signed in as <strong>{session.data.member.memberNick}</strong>
            </p>
            <button
              disabled={busy}
              className="kv-text-button"
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await adminLogout();
                  session.reload();
                } catch (cause) {
                  setError((cause as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sign out of administration
            </button>
          </div>
          <ErrorBox message={error} />
          {create ? (
            created ? (
              <div className="kv-panel">
                <span className="kv-badge accent">Created</span>
                <h2>{created.productName}</h2>
                <p>Your product is {created.productStatus.toLowerCase()}.</p>
                <Link className="kv-button" to="/administration/products">
                  Manage products ↗
                </Link>
                <button
                  className="kv-text-button"
                  onClick={() => {
                    setCreated(null);
                    setSelectedSizes([]);
                  }}
                >
                  Add another product
                </button>
              </div>
            ) : (
              <form className="kv-panel kv-form" onSubmit={submit}>
                <div className="kv-form-grid">
                  <label className="kv-field">
                    Product name
                    <input name="productName" required maxLength={200} />
                  </label>
                  <label className="kv-field">
                    Collection
                    <select
                      name="productCollection"
                      value={collection}
                      onChange={(event) => {
                        setCollection(event.target.value);
                        setSelectedSizes([]);
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
                    <select name="productBrand" defaultValue="">
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
                          aria-pressed={selectedSizes.includes(size)}
                          key={size}
                          onClick={() =>
                            setSelectedSizes((current) =>
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
                  <textarea name="productDesc" maxLength={5000} rows={5} />
                </label>
                <label className="kv-field">
                  Product images
                  <input
                    name="productImages"
                    type="file"
                    required
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <span className="kv-hint">
                    1–5 JPEG, PNG, or WebP images. Each up to 5 MiB and 32
                    million pixels. Images cannot be replaced after creation.
                  </span>
                </label>
                <label className="kv-field">
                  Status
                  <select name="productStatus" defaultValue="PAUSE">
                    <option value="PAUSE">Paused</option>
                    <option value="PROCESS">Published</option>
                    <option value="DELETE">Archived</option>
                  </select>
                </label>
                <button className="kv-button" disabled={busy}>
                  {busy ? "Creating…" : "Create product"} ↗
                </button>
              </form>
            )
          ) : (
            <div className="kv-admin-cards">
              <article className="kv-panel">
                <p className="kv-eyebrow">01 / COLLECTION</p>
                <h2>Products</h2>
                <p>
                  Manage product availability, sizes, and status using your
                  existing catalog workspace.
                </p>
                <Link className="kv-button full" to="/administration/products">
                  Manage products ↗
                </Link>
                <Link className="kv-text-link" to="/administration/create">
                  Create a product →
                </Link>
              </article>
              <article className="kv-panel">
                <p className="kv-eyebrow">02 / FULFILLMENT</p>
                <h2>Orders</h2>
                <p>
                  Move paid orders through processing, shipped, and delivered.
                </p>
                <Link className="kv-button full" to="/administration/orders">
                  Manage orders ↗
                </Link>
              </article>
              <article className="kv-panel">
                <p className="kv-eyebrow">03 / COMMUNITY</p>
                <h2>Customers</h2>
                <p>
                  Review customer accounts and manage active, blocked, or
                  deleted status.
                </p>
                <Link className="kv-button full" to="/administration/customers">
                  Manage customers ↗
                </Link>
              </article>
            </div>
          )}
        </>
      )}
    </div>
  );
}
