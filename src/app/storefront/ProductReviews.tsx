import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Star from "@mui/icons-material/Star";
import { api } from "../../shared/api";
import { OwnReview, ReviewPage } from "../../shared/contracts";
import { useResource, useStore } from "./state";
import { Empty, ErrorBox, Loading, Pagination } from "./ui";

function ReviewEditor({
  productId,
  changed,
}: {
  productId: string;
  changed: () => void;
}) {
  const own = useResource<OwnReview | null>(`/product/${productId}/reviews/me`);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    setRating(own.data?.deleted ? 0 : own.data?.rating || 0);
    setComment(own.data?.deleted ? "" : own.data?.comment || "");
  }, [own.data]);
  const mutate = async (remove = false) => {
    if (lock.current) return;
    if (
      !remove &&
      (!rating || comment.trim().length < 10 || comment.trim().length > 500)
    ) {
      setError("Choose a rating and write a comment of 10–500 characters.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (remove) {
        await api(`/product/${productId}/reviews/me`, { method: "DELETE" });
        if (!alive.current) return;
        own.setData(own.data ? { ...own.data, deleted: true } : null);
      } else {
        const saved = await api<OwnReview>(`/product/${productId}/reviews/me`, {
          method: "PUT",
          body: { rating, comment: comment.trim() },
        });
        if (!alive.current) return;
        own.setData(saved);
      }
      setConfirm(false);
      changed();
    } catch (cause) {
      if (alive.current) setError((cause as Error).message);
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void mutate();
  };
  return (
    <div className="kv-panel kv-review-form">
      <h3>Your review</h3>
      {own.loading ? (
        <Loading />
      ) : own.error ? (
        <ErrorBox message={own.error} retry={own.reload} />
      ) : (
        <>
          {own.data?.visibility === "hidden" && (
            <p role="status">
              Your review is hidden by moderation. Editing or resubmitting it
              keeps it hidden until an administrator restores it.
            </p>
          )}
          {own.data?.deleted && (
            <p role="status">
              Your review has been removed. You can submit a new review below.
            </p>
          )}
          <form className="kv-form" onSubmit={submit}>
            <fieldset className="kv-star-input" disabled={busy}>
              <legend>Rating (required)</legend>
              <div>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label className="kv-star-option" key={value}>
                    <input
                      type="radio"
                      name="review-rating"
                      required
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                    />
                    <span>
                      {value}
                      <span className="kv-sr">
                        {" "}
                        {value === 1 ? "star" : "stars"}
                      </span>
                    </span>
                    <Star fontSize="small" aria-hidden="true" />
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="kv-field">
              Comment
              <textarea
                required
                minLength={10}
                maxLength={500}
                rows={5}
                value={comment}
                disabled={busy}
                aria-describedby="review-count"
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <span className="kv-hint" id="review-count">
              {comment.length}/500 characters · at least 10 after trimming
            </span>
            <ErrorBox message={error} />
            <button className="kv-button" disabled={busy}>
              {busy
                ? "Saving…"
                : own.data && !own.data.deleted
                  ? "Save review"
                  : "Publish review"}
            </button>
          </form>
          {own.data &&
            !own.data.deleted &&
            (confirm ? (
              <div className="kv-confirm">
                <p>Remove your review from the product and its rating?</p>
                <div className="kv-actions">
                  <button
                    type="button"
                    className="kv-button secondary"
                    disabled={busy}
                    onClick={() => void mutate(true)}
                  >
                    Confirm removal
                  </button>
                  <button
                    type="button"
                    className="kv-text-button"
                    disabled={busy}
                    onClick={() => setConfirm(false)}
                  >
                    Keep review
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="kv-text-button"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Remove review
              </button>
            ))}
        </>
      )}
    </div>
  );
}
export function ProductReviews({ productId }: { productId: string }) {
  const { member, checking } = useStore();
  const [page, setPage] = useState(1);
  const result = useResource<ReviewPage>(
    `/product/${productId}/reviews?page=${page}&limit=10`,
  );
  useEffect(() => {
    if (result.data && page > 1 && page > Math.ceil(result.data.total / 10))
      setPage(Math.max(1, Math.ceil(result.data.total / 10)));
  }, [result.data, page]);
  const changed = () => {
    setPage(1);
    result.reload();
  };
  return (
    <section className="kv-reviews" aria-labelledby="product-reviews-title">
      <div className="kv-section-title">
        <h2 id="product-reviews-title">Product Reviews</h2>
        {result.data && (
          <p aria-live="polite">
            {result.data.averageRating === null
              ? "No ratings yet"
              : `${result.data.averageRating.toFixed(1)} / 5`}{" "}
            · {result.data.total}{" "}
            {result.data.total === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>
      <div className="kv-review-layout">
        <div>
          {result.loading ? (
            <Loading />
          ) : result.error ? (
            <ErrorBox message={result.error} retry={result.reload} />
          ) : result.data?.items.length ? (
            <>
              <div className="kv-review-list">
                {result.data.items.map((review) => (
                  <article key={review._id}>
                    <div className="kv-row">
                      <strong>{review.memberNick}</strong>
                      <span aria-label={`${review.rating} out of 5 stars`}>
                        {review.rating} / 5
                      </span>
                    </div>
                    <p className="kv-muted">
                      <time dateTime={review.createdAt}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </time>
                      {review.verifiedPurchase && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="kv-badge accent">
                            Verified purchase
                          </span>
                        </>
                      )}
                    </p>
                    <p className="kv-review-comment">{review.comment}</p>
                  </article>
                ))}
              </div>
              <Pagination
                page={page}
                total={result.data.total}
                limit={10}
                go={setPage}
              />
            </>
          ) : (
            <Empty title="Be the first to share your thoughts.">
              <p>Your experience can help another shopper.</p>
            </Empty>
          )}
        </div>
        <div>
          {checking ? (
            <Loading />
          ) : member ? (
            <ReviewEditor
              key={member._id}
              productId={productId}
              changed={changed}
            />
          ) : (
            <div className="kv-panel">
              <h3>Share your experience</h3>
              <p>Sign in to write a review.</p>
              <Link
                className="kv-button"
                to={`/login?next=${encodeURIComponent(`/products/${productId}`)}`}
              >
                Sign in to review
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
