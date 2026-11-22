import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ArrowOutward from "@mui/icons-material/ArrowOutward";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import { StoreProduct } from "../../shared/contracts";
import { useResource } from "../../shared/useResource";
import { Empty, ErrorBox, Loading, Picture } from "../../shared/ui";
import {
  homeCollectionProducts,
  homeCollectionsPath,
} from "./homeCollectionProducts";
import "./HomeCollections.css";

function CollectionCard({
  product,
  duplicate = false,
}: {
  product: StoreProduct;
  duplicate?: boolean;
}) {
  const tone = homeCollectionProducts.find(
    (item) => item.id === product._id,
  )?.tone;
  const name = `${product.productName}${tone ? `, ${tone}` : ""}`;
  return (
    <article className="kv-collection-product">
      <Picture
        className="kv-collection-product__image"
        path={product.productImages[0]}
        alt={duplicate ? "" : name}
      />
      <span className="kv-collection-product__stock">
        {product.productLeftCount} in stock
      </span>
      <Link
        className="kv-collection-product__open"
        to={`/products/${product._id}`}
        aria-label={`View ${name}`}
        tabIndex={duplicate ? -1 : undefined}
      >
        <ArrowOutward aria-hidden="true" fontSize="small" />
      </Link>
    </article>
  );
}

function CollectionRail({ products }: { products: StoreProduct[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const firstGroup = useRef<HTMLDivElement>(null);
  const loopWidth = useRef(0);
  const idleUntil = useRef(0);
  const [canLoop, setCanLoop] = useState(false);
  const [reduced, setReduced] = useState(
    () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = viewport.current,
        group = firstGroup.current;
      if (!el || !group) return;
      const gap =
        parseFloat(getComputedStyle(group.parentElement!).columnGap) || 0;
      loopWidth.current = group.offsetWidth + gap;
      setCanLoop(group.offsetWidth > el.clientWidth + 1);
    };
    measure();
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    if (viewport.current) resize?.observe(viewport.current);
    if (firstGroup.current) resize?.observe(firstGroup.current);
    window.addEventListener("resize", measure);
    return () => {
      resize?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [products]);

  useEffect(() => {
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { rootMargin: "100px 0px" },
          );
    if (viewport.current) observer?.observe(viewport.current);
    const visibility = () => setPageVisible(!document.hidden);
    const release = () => {
      setDragging(false);
      idleUntil.current = performance.now() + 1200;
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (
      !el ||
      !canLoop ||
      reduced ||
      paused ||
      hovered ||
      focused ||
      dragging ||
      !visible ||
      !pageVisible
    )
      return;
    let frame = 0,
      last: number | null = null,
      position = el.scrollLeft;
    const tick = (now: number) => {
      const elapsed = last === null ? 0 : Math.min(now - last, 50);
      last = now;
      if (now < idleUntil.current) position = el.scrollLeft;
      else if (loopWidth.current > 0) {
        // Retain fractional pixels so low-speed scrolling stays smooth on every display.
        if (Math.abs(el.scrollLeft - position) > 2) position = el.scrollLeft;
        position = (position + elapsed * 0.028) % loopWidth.current;
        el.scrollLeft = position;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    canLoop,
    reduced,
    paused,
    hovered,
    focused,
    dragging,
    visible,
    pageVisible,
  ]);

  return (
    <>
      <div className="kv-section-title">
        <h2 id="home-collections-title">Collections</h2>
        {canLoop && !reduced && (
          <button
            type="button"
            className="kv-collections-motion"
            aria-label={
              paused
                ? "Resume collection scrolling"
                : "Pause collection scrolling"
            }
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? (
              <PlayArrow aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
            <span>{paused ? "Play" : "Pause"}</span>
          </button>
        )}
      </div>
      <div
        className="kv-collections-viewport"
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label="Collection products"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => setDragging(true)}
        onWheel={() => {
          idleUntil.current = performance.now() + 1200;
        }}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
      >
        <div className="kv-collections-track">
          <div className="kv-collections-group" ref={firstGroup}>
            {products.map((product) => (
              <CollectionCard key={product._id} product={product} />
            ))}
          </div>
          {canLoop && !reduced && (
            <div className="kv-collections-group" aria-hidden="true">
              {products.map((product) => (
                <CollectionCard key={product._id} product={product} duplicate />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function HomeCollections() {
  const result = useResource<StoreProduct[]>(homeCollectionsPath);
  return (
    <section
      className="kv-wrap kv-section kv-home-collections"
      aria-labelledby="home-collections-title"
    >
      {result.loading || result.error || !result.data?.length ? (
        <>
          <div className="kv-section-title">
            <h2 id="home-collections-title">Collections</h2>
          </div>
          {result.loading ? (
            <Loading cards />
          ) : result.error ? (
            <ErrorBox message={result.error} retry={result.reload} />
          ) : (
            <Empty title="Collections are being refreshed.">
              <Link className="kv-text-link" to="/products">
                Browse products
              </Link>
            </Empty>
          )}
        </>
      ) : (
        <CollectionRail products={result.data} />
      )}
    </section>
  );
}
