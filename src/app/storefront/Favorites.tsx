import React, { useEffect, useRef } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import { Page, StoreProduct } from "../../shared/contracts";
import { useResource, useStore } from "./state";
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
  Pagination,
  ProductCard,
} from "./ui";

export function FavoriteButton({
  product,
  tabIndex,
}: {
  product: StoreProduct;
  tabIndex?: number;
}) {
  const {
    member,
    likes,
    pendingLikes,
    uncertainLikes,
    likeErrors,
    toggleFavorite,
    retryFavorite,
  } = useStore();
  const location = useLocation();
  const state = likes[product._id] || {
    isLiked: member ? product.isLiked : false,
    productLikes: product.productLikes,
  };
  const label = `${state.isLiked ? "Remove" : "Add"} ${product.productName} ${state.isLiked ? "from" : "to"} favorites`;
  const contents = (
    <>
      {state.isLiked ? (
        <Favorite aria-hidden="true" />
      ) : (
        <FavoriteBorder aria-hidden="true" />
      )}
      <span>{state.productLikes || 0}</span>
    </>
  );
  return (
    <div className="kv-favorite-control">
      {member ? (
        <button
          type="button"
          className="kv-favorite"
          tabIndex={tabIndex}
          aria-label={label}
          aria-pressed={state.isLiked}
          disabled={pendingLikes[product._id] || uncertainLikes[product._id]}
          onClick={() => void toggleFavorite(product._id)}
        >
          {contents}
        </button>
      ) : (
        <Link
          className="kv-favorite"
          tabIndex={tabIndex}
          aria-label={`Sign in to favorite ${product.productName}`}
          to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        >
          {contents}
        </Link>
      )}
      {uncertainLikes[product._id] && (
        <button
          type="button"
          className="kv-text-button"
          tabIndex={tabIndex}
          disabled={pendingLikes[product._id]}
          onClick={() => void retryFavorite(product._id)}
        >
          Check saved state
        </button>
      )}
      {likeErrors[product._id] && (
        <span className="kv-favorite-error" role="alert">
          {likeErrors[product._id]}
        </span>
      )}
    </div>
  );
}
export function Favorites() {
  const { member, likes, favoritesVersion } = useStore();
  const location = useLocation();
  const history = useHistory();
  const page = Math.max(
    1,
    Number(new URLSearchParams(location.search).get("page")) || 1,
  );
  const result = useResource<Page<StoreProduct>>(
    `/product/favorites?page=${page}&limit=12`,
    member?._id,
  );
  const reload = result.reload;
  const previous = useRef(favoritesVersion);
  useEffect(() => {
    if (previous.current !== favoritesVersion) {
      previous.current = favoritesVersion;
      reload();
    }
  }, [favoritesVersion, reload]);
  useEffect(() => {
    if (
      result.data &&
      page > 1 &&
      page > Math.ceil(result.data.total / result.data.limit)
    )
      history.replace(
        `/favorites?page=${Math.max(1, Math.ceil(result.data.total / result.data.limit))}`,
      );
  }, [result.data, page, history]);
  const items =
    result.data?.items.filter((p) => likes[p._id]?.isLiked !== false) || [];
  return (
    <div className="kv-wrap kv-page">
      <PageHeading title="My Favorites">
        Your saved pieces, together.
      </PageHeading>
      {result.loading ? (
        <Loading cards />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : items.length ? (
        <>
          <div className="kv-grid">
            {items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <Pagination
            page={page}
            total={result.data!.total}
            limit={12}
            go={(p) => history.push(`/favorites?page=${p}`)}
          />
        </>
      ) : (
        <Empty title="Save your favorites here.">
          <Link className="kv-button" to="/products">
            Browse products
          </Link>
        </Empty>
      )}
    </div>
  );
}
