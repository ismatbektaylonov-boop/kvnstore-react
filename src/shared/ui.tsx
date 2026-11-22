import React from "react";
import { mediaUrl } from "./api";

export function Picture({
  path,
  alt,
  avatar = false,
  ...props
}: {
  path?: string;
  alt: string;
  avatar?: boolean;
  className?: string;
}) {
  const fallback = avatar
    ? "/media/icons/default-user.svg"
    : "/media/icons/product-unavailable.svg";
  return (
    <img
      {...props}
      src={mediaUrl(path, avatar)}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallback;
      }}
    />
  );
}
export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  if (!message) return null;
  return (
    <div className="kv-error" role="alert">
      <span>{message}</span>
      {retry && (
        <button type="button" className="kv-button secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Loading({ cards = false }: { cards?: boolean }) {
  return (
    <div role="status" aria-label="Loading" className={cards ? "kv-grid" : ""}>
      {Array.from({ length: cards ? 6 : 1 }, (_, index) => (
        <div key={index} className={`kv-skeleton ${cards ? "card" : ""}`}>
          <span className="kv-sr">Loading…</span>
        </div>
      ))}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="kv-empty">
      <span aria-hidden="true" className="kv-empty-mark">
        ◇
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="kv-heading">
      {eyebrow && <p className="kv-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p className="kv-muted">{children}</p>}
    </header>
  );
}
export function Pagination({
  page,
  total,
  limit,
  go,
}: {
  page: number;
  total: number;
  limit: number;
  go: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav className="kv-pagination" aria-label="Pagination">
      <button
        className="kv-button secondary"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        ← Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="kv-button secondary"
        disabled={page >= pages}
        onClick={() => go(page + 1)}
      >
        Next →
      </button>
    </nav>
  );
}
