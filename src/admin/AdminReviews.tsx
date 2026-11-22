import React, { useEffect, useRef, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { AdminReview, Page, StoreMember } from "../shared/contracts";
import { useResource } from "../shared/useResource";
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
  Pagination,
} from "../shared/ui";
import { adminRequest } from "./adminApi";
import { AdminNavigation } from "./AdminManagement";

export function AdminReviewRoute() {
  const session = useResource<{ member: StoreMember }>("/admin/check");
  if (session.loading) return <Loading />;
  if (
    !session.data ||
    session.data.member.memberType !== "ADMIN" ||
    session.data.member.memberStatus !== "ACTIVE"
  )
    return (
      <div className="kv-wrap kv-page">
        <ErrorBox
          message={session.error || "Administrator access is required."}
          retry={session.reload}
        />
        <Link className="kv-button" to="/administration">
          Administrator sign in
        </Link>
      </div>
    );
  return <AdminReviews />;
}
export function AdminReviews() {
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const visibility = query.get("visibility") || "";
  const page = Math.max(1, Number(query.get("page")) || 1);
  const result = useResource<Page<AdminReview>>(
    `/admin/reviews?page=${page}&limit=20${visibility ? `&visibility=${encodeURIComponent(visibility)}` : ""}`,
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const go = (nextPage: number, filter = visibility) =>
    history.push(
      `/administration/reviews?page=${nextPage}${filter ? `&visibility=${filter}` : ""}`,
    );
  useEffect(() => {
    if (result.data && page > 1 && page > Math.ceil(result.data.total / 20)) {
      const params = new URLSearchParams(location.search);
      params.set(
        "page",
        String(Math.max(1, Math.ceil(result.data.total / 20))),
      );
      history.replace(`/administration/reviews?${params}`);
    }
  }, [result.data, page, history, location.search]);
  const moderate = async (review: AdminReview) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(review._id);
    setError("");
    try {
      await adminRequest(`/admin/reviews/${review._id}/visibility`, {
        method: "POST",
        body: {
          visibility:
            review.visibility === "published" ? "hidden" : "published",
        },
      });
      result.reload();
    } catch (cause) {
      setError((cause as Error).message);
      result.reload();
    } finally {
      lock.current = false;
      setBusy("");
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading title="Reviews">
        Publish or hide customer feedback. Removed reviews cannot be restored.
      </PageHeading>
      <AdminNavigation />
      <label className="kv-field kv-status-filter">
        Visibility
        <select
          value={visibility}
          onChange={(event) => go(1, event.target.value)}
        >
          <option value="">All reviews</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>
      <ErrorBox message={error} />
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : result.data?.items.length ? (
        <>
          <div className="kv-stack">
            {result.data.items.map((review) => (
              <article className="kv-panel" key={review._id}>
                <div className="kv-row">
                  <h2>{review.productName}</h2>
                  <span className="kv-badge accent">
                    {review.deleted ? "Removed by shopper" : review.visibility}
                  </span>
                </div>
                <p>
                  <strong>{review.memberNick}</strong> · {review.rating} / 5 ·{" "}
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                </p>
                <p className="kv-review-comment">{review.comment}</p>
                {!review.deleted && (
                  <button
                    className="kv-button secondary"
                    disabled={!!busy}
                    onClick={() => void moderate(review)}
                  >
                    {busy === review._id
                      ? "Updating…"
                      : review.visibility === "published"
                        ? "Hide"
                        : "Restore"}
                  </button>
                )}
              </article>
            ))}
          </div>
          <Pagination
            page={page}
            total={result.data.total}
            limit={20}
            go={go}
          />
        </>
      ) : (
        <Empty title="No reviews match this filter." />
      )}
    </div>
  );
}
