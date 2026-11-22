import React from "react";
import { Link } from "react-router-dom";
import { brands } from "../../shared/brands";
import "./FeaturedBrands.css";

export function FeaturedBrands() {
  return (
    <section
      className="kv-featured-brands"
      aria-labelledby="featured-brands-title"
    >
      <div className="kv-wrap">
        <h2 id="featured-brands-title">Featured brands</h2>
        <ul className="kv-featured-brands__list">
          {Object.entries(brands).map(([key, brand]) => (
            <li key={key}>
              <Link
                className={`kv-featured-brands__link kv-featured-brands__link--${brand.asset}`}
                to={`/products?brand=${key}`}
                aria-label={`Shop ${brand.name}`}
              >
                <img
                  src={`/media/brands/${brand.asset}.svg`}
                  alt={brand.name}
                  width={240}
                  height={120}
                  loading="lazy"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
