import React from "react";
import { Link } from "react-router-dom";
import { CommunityMember, Page, StoreProduct } from "../../shared/contracts";
import { useResource, useStore } from "./state";
import { Empty, ErrorBox, Loading, PageHeading, Picture } from "./ui";
import { ProductCarousel } from "./ProductCarousel";
import "./ProductShowcase.css";

export function ProductShowcase({ viewed = false }: { viewed?: boolean }) {
  const { member } = useStore();
  const title = viewed ? "Most Viewed" : "New Arrivals";
  const order = viewed ? "productViews" : "createdAt";
  const result = useResource<Page<StoreProduct>>(
    `/product/all?includeMeta=true&order=${order}&sort=desc&limit=8`,
    member?._id,
  );
  const products =
    result.data?.items.filter((p) => !viewed || p.productViews > 0) || [];
  if (!result.loading && !result.error && viewed && !products.length)
    return null;
  return (
    <section
      className={`kv-product-showcase ${viewed ? "kv-product-showcase--viewed" : "kv-tint"}`}
      id={viewed ? "most-viewed" : "new-arrivals"}
    >
      <div className="kv-product-showcase-backdrop" aria-hidden="true">
        <span>{viewed ? "MOST VIEWED" : "NEW"}</span>
      </div>
      <div className="kv-wrap kv-section">
        {result.loading || result.error || !products.length ? (
          <>
            <div className="kv-section-title">
              <h2>{title}</h2>
            </div>
            {result.loading ? (
              <Loading cards />
            ) : result.error ? (
              <ErrorBox message={result.error} retry={result.reload} />
            ) : (
              <Empty title="New pieces are on their way.">
                <Link to="/products">Browse products</Link>
              </Empty>
            )}
          </>
        ) : (
          <ProductCarousel title={title} products={products} />
        )}
      </div>
    </section>
  );
}

export function AboutStore() {
  return (
    <section
      className="kv-wrap kv-section kv-about"
      aria-labelledby="about-store-title"
    >
      <img
        src="/media/images/campaigns/everyday-layers-1200.webp"
        alt="Everyday clothing styled in layers"
        loading="lazy"
        width={1200}
        height={900}
      />
      <div>
        <h2 id="about-store-title">About KVN Store</h2>
        <p>
          KVN Store brings clothing, footwear, and everyday essentials together
          in one place.
        </p>
        <div className="kv-actions">
          <Link className="kv-button" to="/products">
            Explore collections
          </Link>
          <Link className="kv-text-link" to="/help">
            Shopping guide ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Community({ preview = false }: { preview?: boolean }) {
  const result = useResource<CommunityMember[]>(
    `/member/community?limit=${preview ? 4 : 12}`,
  );
  return (
    <section className={`kv-wrap ${preview ? "kv-section" : "kv-page"}`}>
      {preview ? (
        <div className="kv-section-title">
          <h2>Our Community</h2>
          <Link className="kv-text-link" to="/community">
            Meet the community ↗
          </Link>
        </div>
      ) : (
        <PageHeading title="Our Community">
          Meet some of our most active shoppers.
        </PageHeading>
      )}
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : result.data?.length ? (
        <div className="kv-community-grid">
          {result.data.map((person) => (
            <article key={person.key} className="kv-panel">
              <div className="kv-row">
                <Picture
                  path={person.memberImage}
                  avatar
                  alt=""
                  className="kv-avatar"
                />
                <span className="kv-badge accent">Rank {person.rank}</span>
              </div>
              <h3>{person.memberNick}</h3>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Our community is taking shape.">
          <p>Explore the collection and find your everyday essentials.</p>
        </Empty>
      )}
      <Link className="kv-text-link" to="/products">
        Browse products ↗
      </Link>
    </section>
  );
}
