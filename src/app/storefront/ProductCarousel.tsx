import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { StoreProduct } from "../../shared/contracts";
import { ProductCard } from "./ui";

export function ProductCarousel({
  title,
  products,
  viewAll,
  action,
}: {
  title: string;
  products: StoreProduct[];
  viewAll?: string;
  action?: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const [ends, setEnds] = useState({ start: true, end: true, fits: true });
  const measure = useCallback(() => {
    const el = track.current;
    if (el)
      setEnds({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
        fits: el.scrollWidth <= el.clientWidth + 2,
      });
  }, []);
  useEffect(() => {
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    if (track.current) observer?.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, products]);
  const move = (direction: number) => {
    const el = track.current;
    el?.scrollBy({
      left: direction * el.clientWidth,
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  return (
    <section className="kv-product-carousel" aria-labelledby={`${id}-title`}>
      <div className="kv-section-title">
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="kv-actions">
          {action}
          {viewAll && (
            <Link className="kv-text-link" to={viewAll}>
              View all <span className="kv-sr">{title}</span> ↗
            </Link>
          )}
          {!ends.fits && (
            <div className="kv-carousel-controls">
              <button
                type="button"
                className="kv-button secondary"
                aria-label={`Previous ${title}`}
                aria-controls={id}
                disabled={ends.start}
                onClick={() => move(-1)}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="kv-button secondary"
                aria-label={`Next ${title}`}
                aria-controls={id}
                disabled={ends.end}
                onClick={() => move(1)}
              >
                <ChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className="kv-product-track"
        id={id}
        ref={track}
        onScroll={measure}
        tabIndex={0}
        role="region"
        aria-label={`${title} products`}
      >
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
