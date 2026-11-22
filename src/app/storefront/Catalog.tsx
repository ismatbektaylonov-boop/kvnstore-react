import React, { FormEvent, useEffect, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { api, pendingCheckout } from "../../shared/api";
import {
  collections,
  clothingSizes,
  shoeSizes,
  money,
  Page,
  StoreCart,
  StoreProduct,
  sizesOf,
} from "../../shared/contracts";
import { useResource, useStore } from "./state";
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
  Pagination,
  Picture,
  ProductCard,
} from "./ui";
import { HomeCollections } from "./HomeCollections";
import { CategoryShowcase } from "./CategoryShowcase";
import { FeaturedBrands } from "./FeaturedBrands";
import { brands, brandName } from "../../shared/brands";
import HeroCarousel from "./HeroCarousel";
import { RisingLines } from "./RisingLines";
import { ProductShowcase, AboutStore, Community } from "./Discovery";
import { FavoriteButton } from "./Favorites";
import { ProductReviews } from "./ProductReviews";
import { RecentlyViewed, rememberProduct } from "./recentlyViewed";

export function Home() {
  return (
    <>
      <section className="kv-hero">
        <RisingLines />
        <div className="kv-wrap kv-hero-grid">
          <div className="kv-hero-copy">
            <p className="kv-eyebrow">THE EVERYDAY EDIT · NEW SEASON</p>
            <h1>
              <span>Good style.</span>{" "}
              <span className="kv-hero-copy__accent">
                Great
                <br />
                everyday.
              </span>
            </h1>
            <p>
              A fresh perspective on your daily wardrobe. Clothing, footwear and
              the finishing touches that make it yours.
            </p>
            <div className="kv-actions">
              <Link className="kv-button" to="/products">
                Shop the collection
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <path d="M4 12h16m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <a className="kv-text-link" href="#new-arrivals">
                See what’s new
              </a>
            </div>
            <div className="kv-hero-facts">
              <div>
                <strong>5 collections</strong>
                <span>Find your everyday</span>
              </div>
              <div>
                <strong>$100+</strong>
                <span>Complimentary delivery</span>
              </div>
            </div>
          </div>
          <HeroCarousel />
        </div>
      </section>
      <CategoryShowcase />
      <HomeCollections />
      <ProductShowcase />
      <ProductShowcase viewed />
      <AboutStore />
      <Community preview />
      <section className="kv-wrap kv-section kv-delivery">
        <span className="kv-delivery-icon" aria-hidden="true">
          ↗
        </span>
        <div>
          <h2>Good things, delivered.</h2>
          <p>
            Standard delivery is $5. Make it complimentary with an order of $100
            or more.
          </p>
        </div>
        <Link className="kv-text-link" to="/products">
          Find your next favorite ↗
        </Link>
      </section>
      <FeaturedBrands />
    </>
  );
}
export function Catalog() {
  const { member } = useStore();
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const collection = params.get("productCollection") || "";
  const brand = params.get("brand") || "";
  const selectedBrand = brandName(brand);
  const order = params.get("order") || "createdAt";
  const sort =
    params.get("sort") || (order === "productPrice" ? "asc" : "desc");
  const [search, setSearch] = useState(params.get("search") || "");
  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("search") || "");
  }, [location.search]);
  const query = new URLSearchParams(location.search);
  query.set("page", String(page));
  query.set("limit", "9");
  query.set("includeMeta", "true");
  const result = useResource<Page<StoreProduct>>(
    `/product/all?${query.toString()}`,
    member?._id,
  );
  const change = (values: Record<string, string>) => {
    const next = new URLSearchParams(location.search);
    next.delete("page");
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    history.push(`/products?${next}`);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    change({ search: search.trim() });
  };
  const sizes =
    collection === "SHOES"
      ? shoeSizes
      : collection
        ? clothingSizes
        : [...clothingSizes, ...shoeSizes];
  return (
    <div className="kv-wrap kv-page">
      <PageHeading
        eyebrow="THE COLLECTION"
        title={
          selectedBrand ? `${selectedBrand} collection` : "Find your everyday."
        }
      >
        {selectedBrand
          ? `Explore pieces from ${selectedBrand}.`
          : "Explore the pieces that fit your life."}
      </PageHeading>
      <form className="kv-search" onSubmit={submit}>
        <label className="kv-sr" htmlFor="catalog-search">
          Search products
        </label>
        <input
          id="catalog-search"
          placeholder="Search by product name…"
          maxLength={100}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="kv-button" type="submit">
          Search
        </button>
      </form>
      <div className="kv-catalog-layout">
        <aside className="kv-filters">
          <h2>Collections</h2>
          <div className="kv-filter-list">
            <button
              className={!collection ? "active" : ""}
              onClick={() => change({ productCollection: "", size: "" })}
            >
              All pieces <span>↗</span>
            </button>
            {Object.entries(collections).map(([key, name]) => (
              <button
                className={collection === key ? "active" : ""}
                key={key}
                onClick={() => change({ productCollection: key, size: "" })}
              >
                {name}
                <span>↗</span>
              </button>
            ))}
          </div>
          <label className="kv-field">
            Brand
            <select
              value={brand}
              onChange={(event) => change({ brand: event.target.value })}
            >
              <option value="">All brands</option>
              {Object.entries(brands).map(([key, value]) => (
                <option value={key} key={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>
          <label className="kv-field">
            Size
            <select
              value={params.get("size") || ""}
              onChange={(event) => change({ size: event.target.value })}
            >
              <option value="">All sizes</option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size === "ONESIZE" ? "One size" : size}
                </option>
              ))}
            </select>
          </label>
          <button
            className="kv-text-button"
            onClick={() => history.push("/products")}
          >
            Clear all filters
          </button>
          <div className="kv-filter-note">
            <span className="kv-dot">●</span>
            <p>
              Free delivery from $100.
              <br />A little extra to look forward to.
            </p>
          </div>
        </aside>
        <div>
          <div className="kv-results-bar">
            <span className="kv-muted">
              {result.loading
                ? "Finding your pieces…"
                : `${result.data?.total || 0} pieces`}
            </span>
            <label className="kv-sort">
              Sort by
              <select
                aria-label="Sort products"
                value={`${order}:${sort}`}
                onChange={(event) => {
                  const [nextOrder, nextSort] = event.target.value.split(":");
                  change({ order: nextOrder, sort: nextSort });
                }}
              >
                <option value="createdAt:desc">Newest arrivals</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="productViews:desc">Most viewed</option>
                <option value="productPrice:asc">Price: low to high</option>
                <option value="productPrice:desc">Price: high to low</option>
              </select>
            </label>
          </div>
          {result.loading ? (
            <Loading cards />
          ) : result.error ? (
            <ErrorBox message={result.error} retry={result.reload} />
          ) : result.data?.items.length ? (
            <>
              <div className="kv-grid">
                {result.data.items.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <Pagination
                page={page}
                total={result.data.total}
                limit={9}
                go={(value) => change({ page: String(value) })}
              />
            </>
          ) : (
            <Empty title="No pieces found.">
              <p>Try another search or give your filters a little room.</p>
              <button
                className="kv-button"
                onClick={() => history.push("/products")}
              >
                Clear filters
              </button>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { member, cart, cartReady, cartError, refreshCart, setCart, notify } =
    useStore();
  const result = useResource<StoreProduct>(`/product/${id}`, member?._id);
  const history = useHistory();
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setSize("");
    setQuantity(1);
    setImage(0);
    setError("");
  }, [id]);
  const product = result.data;
  useEffect(() => {
    if (product?._id && !result.loading && !result.error)
      rememberProduct(product._id, member?._id);
  }, [product?._id, result.loading, result.error, member?._id]);
  const add = async () => {
    if (!member) {
      history.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
      return;
    }
    if (!product) return;
    if (!cartReady || busy) return;
    if (pendingCheckout(member._id)) {
      history.push("/checkout");
      notify("Check your previous order request before changing your cart.");
      return;
    }
    const selectedSize =
      size || (sizesOf(product).length === 1 ? sizesOf(product)[0] : "");
    if (!selectedSize) {
      setError("Choose a size before adding this piece.");
      return;
    }
    const existing = cart.items.find(
      (item) => item.productId === id && item.selectedSize === selectedSize,
    );
    const total =
      cart.items
        .filter((item) => item.productId === id)
        .reduce((sum, item) => sum + item.quantity, 0) + quantity;
    if (total > 20 || total > product.productLeftCount) {
      setError(
        "This quantity exceeds available stock or the 20-piece limit for this product.",
      );
      return;
    }
    setBusy("add");
    setError("");
    try {
      setCart(
        await api<StoreCart>("/cart/items", {
          method: "PUT",
          body: {
            productId: id,
            selectedSize,
            quantity: (existing?.quantity || 0) + quantity,
          },
        }),
      );
      notify("Added to your cart.");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <Link className="kv-text-link" to="/products">
        ← Back to collection
      </Link>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : (
        product && (
          <>
            <div className="kv-detail">
              <div>
                <div className="kv-detail-image">
                  <Picture
                    path={product.productImages[image]}
                    alt={product.productName}
                  />
                </div>
                <div className="kv-thumbnails">
                  {product.productImages.map((path, index) => (
                    <button
                      aria-label={`View product image ${index + 1}`}
                      aria-pressed={image === index}
                      key={path}
                      onClick={() => setImage(index)}
                    >
                      <Picture path={path} alt="" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="kv-detail-copy">
                <p className="kv-eyebrow">
                  {collections[product.productCollection]}
                </p>
                <h1>{product.productName}</h1>
                <div className="kv-row">
                  <p className="kv-price">
                    {money(product.productPrice)} <small>USD</small>
                  </p>
                  <FavoriteButton product={product} />
                </div>
                <span className="kv-badge">
                  {product.productLeftCount
                    ? `${product.productLeftCount} available across sizes`
                    : "Out of stock"}
                </span>
                <p className="kv-description">
                  {product.productDesc ||
                    "Explore this piece and choose your fit."}
                </p>
                <fieldset className="kv-size-field">
                  <legend>Choose your size</legend>
                  <div className="kv-size-options">
                    {sizesOf(product).map((value) => (
                      <button
                        type="button"
                        disabled={!product.productLeftCount}
                        aria-pressed={
                          (size ||
                            (sizesOf(product).length === 1
                              ? sizesOf(product)[0]
                              : "")) === value
                        }
                        key={value}
                        onClick={() => setSize(value)}
                      >
                        {value === "ONESIZE" ? "One size" : value}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="kv-field kv-quantity">
                  Quantity
                  <input
                    type="number"
                    min={1}
                    max={Math.min(20, product.productLeftCount)}
                    disabled={!product.productLeftCount}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  />
                </label>
                <ErrorBox message={error} />
                <ErrorBox message={cartError} retry={refreshCart} />
                <button
                  className="kv-button full"
                  disabled={
                    !!busy ||
                    !!(member && !cartReady) ||
                    !product.productLeftCount ||
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    quantity > Math.min(20, product.productLeftCount)
                  }
                  onClick={add}
                >
                  {busy === "add"
                    ? "Adding…"
                    : member && !cartReady
                      ? cartError
                        ? "Cart unavailable"
                        : "Loading your cart…"
                      : product.productLeftCount
                        ? "Add to cart"
                        : "Sold out"}{" "}
                  <span aria-hidden="true">↗</span>
                </button>
                <Link className="kv-text-link" to="/cart">
                  View your cart →
                </Link>
                <div className="kv-panel kv-shipping-note">
                  <strong>Delivered simply.</strong>
                  <p>$5 delivery. Complimentary on orders of $100 or more.</p>
                  <p className="kv-muted">
                    Stock is reserved for 30 minutes when you place an order.
                  </p>
                </div>
              </div>
            </div>
            <ProductReviews
              key={`${id}:${member?._id || "guest"}`}
              productId={id}
            />
            <RecentlyViewed currentId={id} />
          </>
        )
      )}
    </div>
  );
}
