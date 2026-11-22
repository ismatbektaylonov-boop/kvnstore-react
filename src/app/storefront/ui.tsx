import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FavoriteButton } from "./Favorites";
import StoreHeader from "./StoreHeader";
import { useStore } from "./state";
import { Picture, Loading, ErrorBox, Empty } from "../../shared/ui";
import { StoreProduct, collections, money } from "../../shared/contracts";
import { ProductCardFrame } from "../../shared/ProductCardFrame";
import { GradientBars } from "./GradientBars";
import { StoreFooter } from "./StoreFooter";
export {
  Picture,
  Loading,
  ErrorBox,
  Empty,
  PageHeading,
  Pagination,
} from "../../shared/ui";

export function ProductCard({
  product,
  duplicate = false,
  label = product.productName,
}: {
  product: StoreProduct;
  duplicate?: boolean;
  label?: string;
}) {
  const tabIndex = duplicate ? -1 : undefined;
  return (
    <ProductCardFrame
      image={
        <Link
          className="kv-product-image"
          to={`/products/${product._id}`}
          tabIndex={tabIndex}
        >
          <Picture
            path={product.productImages[0]}
            alt={duplicate ? "" : label}
          />
          <span className="kv-badge">
            {product.productLeftCount > 0
              ? `${product.productLeftCount} in stock`
              : "Sold out"}
          </span>
        </Link>
      }
    >
      <p className="kv-eyebrow">
        {collections[product.productCollection] || product.productCollection}
      </p>
      <Link to={`/products/${product._id}`} tabIndex={tabIndex}>
        <h3>{product.productName}</h3>
      </Link>
      <div className="kv-row">
        <strong>{money(product.productPrice)}</strong>
        <FavoriteButton product={product} tabIndex={tabIndex} />
      </div>
      <Link
        className="kv-button secondary full"
        to={`/products/${product._id}`}
        tabIndex={tabIndex}
        aria-label={label !== product.productName ? `View ${label}` : undefined}
      >
        View details <span aria-hidden="true">↗</span>
      </Link>
    </ProductCardFrame>
  );
}
export function Protected({ children }: { children: React.ReactNode }) {
  const { member, checking, authError, refreshMember } = useStore();
  const location = useLocation();
  if (checking) return <Loading />;
  if (authError) return <ErrorBox message={authError} retry={refreshMember} />;
  if (!member)
    return (
      <Empty title="Sign in to continue">
        <p>
          Your account keeps your cart, delivery address, and orders together.
        </p>
        <Link
          className="kv-button"
          to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        >
          Sign in
        </Link>
        <Link className="kv-text-link" to="/signup">
          Create an account
        </Link>
      </Empty>
    );
  return <>{children}</>;
}
export function Layout({ children }: { children: React.ReactNode }) {
  const { notice, notify, logout } = useStore();
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return (
    <div className={isHome ? "kv-app kv-app--home" : "kv-app"}>
      {isHome && <GradientBars />}
      <a className="kv-skip" href="#main-content">
        Skip to content
      </a>
      <StoreHeader
        signingOut={leaving}
        onSignOut={async () => {
          setLeaving(true);
          setError("");
          try {
            await logout();
          } catch (cause) {
            setError((cause as Error).message);
          } finally {
            setLeaving(false);
          }
        }}
      />
      <main id="main-content" tabIndex={-1}>
        {error && (
          <div className="kv-wrap">
            <ErrorBox message={error} />
          </div>
        )}
        {children}
      </main>
      <StoreFooter />
      {notice && (
        <div className="kv-toast" role="status">
          <span>✓ {notice}</span>
          <button aria-label="Dismiss notification" onClick={() => notify("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
