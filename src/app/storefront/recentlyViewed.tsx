import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api";
import { StoreProduct } from "../../shared/contracts";
import { useStore } from "./state";
import { ProductCarousel } from "./ProductCarousel";
import { Empty, ErrorBox, Loading, ProductCard } from "./ui";

const key = (memberId: string) => `kvn:recent-products:v2:${memberId}`;
const changed = "kvn:recent-products";
export function readRecent(memberId?: string): string[] {
  if (!memberId) return [];
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(key(memberId)) || "[]",
    );
    return Array.isArray(value)
      ? Array.from(
          new Set(
            value
              .filter(
                (id): id is string =>
                  typeof id === "string" && /^[a-f\d]{24}$/i.test(id),
              )
              .map((id) => id.toLowerCase()),
          ),
        ).slice(0, 6)
      : [];
  } catch {
    return [];
  }
}
function writeRecent(ids: string[], memberId: string) {
  try {
    localStorage.setItem(key(memberId), JSON.stringify(ids));
  } catch {
    /* Storage is optional. */
  }
  window.dispatchEvent(new Event(changed));
}
export function rememberProduct(id: string, memberId?: string) {
  if (memberId && /^[a-f\d]{24}$/i.test(id))
    writeRecent(
      [
        id.toLowerCase(),
        ...readRecent(memberId).filter((value) => value !== id.toLowerCase()),
      ].slice(0, 6),
      memberId,
    );
}
export function clearRecent(memberId?: string) {
  if (memberId) writeRecent([], memberId);
}
interface RecentlyViewedProps {
  currentId?: string;
  account?: boolean;
}
export function RecentlyViewed(props: RecentlyViewedProps) {
  const { member } = useStore();
  return member ? (
    <MemberRecentlyViewed key={member._id} memberId={member._id} {...props} />
  ) : null;
}
function MemberRecentlyViewed({
  currentId,
  account = false,
  memberId,
}: RecentlyViewedProps & { memberId: string }) {
  const [ids, setIds] = useState(() => readRecent(memberId));
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() =>
    ids.some((id) => id !== currentId),
  );
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const update = () => setIds(readRecent(memberId));
    window.addEventListener(changed, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(changed, update);
      window.removeEventListener("storage", update);
    };
  }, [memberId]);
  const query = ids.filter((id) => id !== currentId).join(",");
  useEffect(() => {
    const controller = new AbortController();
    setProducts([]);
    setError("");
    if (!query) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<StoreProduct[]>(`/product/cards?ids=${query}`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setProducts(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, memberId, version]);
  if (account)
    return (
      <section
        className="kv-account-recent"
        aria-label="Recently viewed products"
      >
        {ids.length > 0 && (
          <div className="kv-actions">
            <button
              className="kv-text-button"
              onClick={() => clearRecent(memberId)}
            >
              Clear history
            </button>
          </div>
        )}
        {!query || (!loading && !error && !products.length) ? (
          <Empty title="No recently viewed products yet.">
            <p>Products you view while signed in will appear here.</p>
            <Link className="kv-button" to="/products">
              Browse products
            </Link>
          </Empty>
        ) : loading ? (
          <Loading cards />
        ) : error ? (
          <ErrorBox message={error} retry={() => setVersion((v) => v + 1)} />
        ) : (
          <div className="kv-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    );
  if (!query || (!loading && !error && !products.length)) return null;
  return (
    <section className="kv-wrap kv-section">
      {loading ? (
        <>
          <h2>Recently Viewed</h2>
          <Loading cards />
        </>
      ) : error ? (
        <>
          <h2>Recently Viewed</h2>
          <ErrorBox message={error} retry={() => setVersion((v) => v + 1)} />
          <button
            className="kv-text-button"
            onClick={() => clearRecent(memberId)}
          >
            Clear history
          </button>
        </>
      ) : (
        <ProductCarousel
          title="Recently Viewed"
          products={products}
          action={
            <button
              className="kv-text-button"
              onClick={() => clearRecent(memberId)}
            >
              Clear history
            </button>
          }
        />
      )}
    </section>
  );
}
