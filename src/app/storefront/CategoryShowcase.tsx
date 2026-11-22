import React from "react";
import { Link } from "react-router-dom";
import { collections } from "../../shared/contracts";
import { categoryImages } from "./categoryImages";
import "./CategoryShowcase.css";

const categories = [
  { collection: "CLOTHE", image: "clothing" },
  { collection: "PANTS", image: "trousers" },
  { collection: "HAT", image: "hats" },
  { collection: "SHOES", image: "shoes" },
  { collection: "OTHERS", image: "essentials" },
] as const;

function CategoryArrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 18 18 6M6 6h12v12" />
    </svg>
  );
}

export function CategoryShowcase() {
  return (
    <section
      className="kv-wrap kv-section kv-categories"
      aria-labelledby="home-categories-title"
    >
      <div className="kv-categories__heading">
        <div>
          <p className="kv-categories__eyebrow">Find your direction</p>
          <h2 id="home-categories-title">A collection for every day.</h2>
        </div>
        <Link className="kv-categories__all" to="/products">
          Shop all pieces <CategoryArrow />
        </Link>
      </div>
      <ul className="kv-categories__grid">
        {categories.map(({ collection, image }) => {
          const media = categoryImages[collection];
          return (
            <li key={collection}>
              <Link
                className={`kv-category kv-category--${image}`}
                to={`/products?productCollection=${collection}`}
              >
                <div className="kv-category__photo">
                  {media ? (
                    <img
                      src={media.src}
                      srcSet={media.srcSet}
                      sizes="(max-width: 760px) 50vw, (max-width: 1000px) 33vw, (max-width: 1376px) 20vw, 244px"
                      width={media.width}
                      height={media.height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="kv-category__caption">
                  <h3>
                    {collection === "OTHERS"
                      ? "Other Essentials"
                      : collections[collection]}
                  </h3>
                  <CategoryArrow />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
