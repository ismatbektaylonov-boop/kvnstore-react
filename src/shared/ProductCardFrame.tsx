import React from "react";

/** Shared card anatomy; each interface supplies its own actions and state. */
export function ProductCardFrame({
  image,
  children,
}: {
  image: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="kv-product">
      {image}
      <div className="kv-product-copy">{children}</div>
    </article>
  );
}
