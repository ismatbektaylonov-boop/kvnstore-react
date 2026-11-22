import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import { api, ApiError } from "../../shared/api";
import { StoreProduct } from "../../shared/contracts";
import { StoreProvider, useStore } from "./state";
import { ProductCarousel } from "./ProductCarousel";
import { FavoriteButton, Favorites } from "./Favorites";
import { ProductShowcase, Community } from "./Discovery";
import { ProductReviews } from "./ProductReviews";
import {
  RecentlyViewed,
  clearRecent,
  readRecent,
  rememberProduct,
} from "./recentlyViewed";

jest.mock("../../shared/api", () => ({
  ...jest.requireActual("../../shared/api"),
  api: jest.fn(),
}));
const request = api as jest.Mock;
const member = {
  _id: "012345678901234567890123",
  memberType: "USER",
  memberStatus: "ACTIVE",
  memberNick: "Shopper",
} as const;
const product: StoreProduct = {
  _id: "112345678901234567890123",
  productName: "Everyday shirt",
  productCollection: "CLOTHE",
  productStatus: "PROCESS",
  productPrice: 30,
  productLeftCount: 5,
  productImages: [],
  productLikes: 2,
  productViews: 3,
  isLiked: false,
};
const review = {
  _id: "review-1",
  rating: 4,
  comment: "A comfortable everyday shirt.",
  memberNick: "Shopper",
  createdAt: "2026-11-01T12:00:00Z",
  updatedAt: "2026-11-01T12:00:00Z",
  verifiedPurchase: false,
  visibility: "published",
  deleted: false,
};
const emptyReviews = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  averageRating: null,
};
let container: HTMLDivElement, root: Root;
let store: ReturnType<typeof useStore>;
function Probe() {
  store = useStore();
  return null;
}
beforeEach(() => {
  request.mockReset();
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  request.mockImplementation((path: string) =>
    path === "/member/detail"
      ? Promise.resolve(member)
      : path === "/cart"
        ? Promise.resolve({
            items: [],
            subtotal: 0,
            currency: "USD",
            checkoutReady: false,
          })
        : Promise.reject(new Error(`Unexpected ${path}`)),
  );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});
async function mount(node: React.ReactNode) {
  // A native React root needs act to flush asynchronous resource updates.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    root.render(
      <MemoryRouter>
        <StoreProvider>
          <Probe />
          {node}
        </StoreProvider>
      </MemoryRouter>,
    );
  });
}
async function click(text: string) {
  const button = Array.from(container.querySelectorAll("button")).find((node) =>
    node.textContent?.includes(text),
  );
  expect(button).toBeTruthy();
  await act(async () => {
    button!.click();
  });
}

test("history is bounded, deduplicated, newest first and safe with invalid or unavailable storage", () => {
  const key = `kvn:recent-products:v2:${member._id}`;
  localStorage.setItem(key, "broken json");
  expect(readRecent(member._id)).toEqual([]);
  const ids = Array.from({ length: 8 }, (_, i) => String(i).padStart(24, "0"));
  ids.forEach((id) => rememberProduct(id, member._id));
  rememberProduct(ids[3], member._id);
  expect(readRecent(member._id)).toEqual([
    ids[3],
    ids[7],
    ids[6],
    ids[5],
    ids[4],
    ids[2],
  ]);
  localStorage.setItem(key, JSON.stringify([null, {}, "bad", ids[0], ids[0]]));
  expect(readRecent(member._id)).toEqual([ids[0]]);
  clearRecent(member._id);
  expect(readRecent(member._id)).toEqual([]);
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  expect(() => {
    rememberProduct(product._id, member._id);
    clearRecent(member._id);
  }).not.toThrow();
  expect(readRecent(member._id)).toEqual([]);
});

test("guests do not record history and each account owns its own history", () => {
  const otherMember = "112345678901234567890124";
  rememberProduct(product._id);
  expect(localStorage.length).toBe(0);
  expect(readRecent()).toEqual([]);
  rememberProduct(product._id, member._id);
  rememberProduct("212345678901234567890123", otherMember);
  expect(readRecent(member._id)).toEqual([product._id]);
  expect(readRecent(otherMember)).toEqual(["212345678901234567890123"]);
  clearRecent(member._id);
  expect(readRecent(member._id)).toEqual([]);
  expect(readRecent(otherMember)).toEqual(["212345678901234567890123"]);
});

test("signed-out visitors never render or fetch recent products, including legacy guest history", async () => {
  localStorage.setItem("kvn:recent-products:v1", JSON.stringify([product._id]));
  rememberProduct(product._id, member._id);
  request.mockRejectedValue(new ApiError(401, "Login required"));
  await mount(<RecentlyViewed account />);
  expect(container.querySelector(".kv-account-recent")).toBeNull();
  expect(
    request.mock.calls.some(([path]) => path.startsWith("/product/cards")),
  ).toBe(false);
});

test("recent lookup omits the current product, aborts old requests and clears visible history", async () => {
  const other = "212345678901234567890123";
  rememberProduct(other, member._id);
  rememberProduct(product._id, member._id);
  let oldSignal: AbortSignal | undefined;
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [], subtotal: 0 });
    if (path.startsWith("/product/cards")) {
      oldSignal = options.signal;
      return Promise.resolve([{ ...product, _id: other }]);
    }
    return Promise.reject(new Error(path));
  });
  await mount(<RecentlyViewed currentId={product._id} />);
  expect(
    request.mock.calls.find(([path]) => path.startsWith("/product/cards"))?.[0],
  ).toBe(`/product/cards?ids=${other}`);
  expect(container.textContent).toContain("Recently Viewed");
  await click("Clear history");
  expect(readRecent(member._id)).toEqual([]);
  expect(oldSignal?.aborted).toBe(true);
  expect(container.textContent).not.toContain("Recently Viewed");
});

test("logout immediately hides history and aborts an in-flight recent lookup", async () => {
  rememberProduct(product._id, member._id);
  let finish: (value: StoreProduct[]) => void = () => {};
  let signal: AbortSignal | undefined;
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [], subtotal: 0 });
    if (path === "/member/logout") return Promise.resolve({});
    if (path.startsWith("/product/cards")) {
      signal = options.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    }
    return Promise.reject(new Error(path));
  });
  await mount(<RecentlyViewed account />);
  expect(container.querySelector(".kv-account-recent")).not.toBeNull();
  await act(async () => store.logout());
  expect(signal?.aborted).toBe(true);
  expect(container.querySelector(".kv-account-recent")).toBeNull();
  await act(async () => finish([product]));
  expect(container.textContent).not.toContain(product.productName);
});

test("account history supports an empty state, retry and clearing history", async () => {
  rememberProduct(product._id, member._id);
  let fail = true;
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [], subtotal: 0 });
    if (path.startsWith("/product/cards"))
      return fail
        ? Promise.reject(new Error("Could not load history"))
        : Promise.resolve([product]);
    return Promise.reject(new Error(path));
  });
  await mount(<RecentlyViewed account />);
  expect(container.textContent).toContain("Could not load history");
  fail = false;
  await click("Try again");
  expect(container.textContent).toContain(product.productName);
  await click("Clear history");
  expect(container.textContent).toContain("No recently viewed products yet.");
  expect(
    container.querySelector('.kv-button[href="/products"]'),
  ).not.toBeNull();
});

test("carousel hides controls when cards fit and disables the appropriate end with reduced motion", async () => {
  let offset = 0;
  const width = jest
    .spyOn(HTMLElement.prototype, "clientWidth", "get")
    .mockReturnValue(400);
  const extent = jest
    .spyOn(HTMLElement.prototype, "scrollWidth", "get")
    .mockReturnValue(400);
  jest
    .spyOn(HTMLElement.prototype, "scrollLeft", "get")
    .mockImplementation(() => offset);
  const scroll = jest.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollBy", {
    configurable: true,
    value: scroll,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({ matches: true }),
  });
  await mount(
    <ProductCarousel
      title="New Arrivals"
      products={[product]}
      viewAll="/products"
    />,
  );
  expect(
    container.querySelector('[aria-label="Next New Arrivals"]'),
  ).toBeNull();
  extent.mockReturnValue(1200);
  await act(async () => {
    window.dispatchEvent(new Event("resize"));
  });
  const previous = container.querySelector<HTMLButtonElement>(
    '[aria-label="Previous New Arrivals"]',
  )!;
  const next = container.querySelector<HTMLButtonElement>(
    '[aria-label="Next New Arrivals"]',
  )!;
  expect(previous.disabled).toBe(true);
  expect(next.disabled).toBe(false);
  await act(async () => next.click());
  expect(scroll).toHaveBeenCalledWith({ left: 400, behavior: "auto" });
  offset = 800;
  await act(async () => {
    container
      .querySelector(".kv-product-track")!
      .dispatchEvent(new Event("scroll"));
  });
  expect(next.disabled).toBe(true);
  expect(previous.disabled).toBe(false);
  width.mockRestore();
});

test("favorite buttons synchronize, block repeated taps and discard a previous account response", async () => {
  let finish: (value: unknown) => void = () => {};
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  request.mockImplementation((path: string) =>
    path === "/member/detail"
      ? Promise.resolve(member)
      : path === "/cart"
        ? Promise.resolve({ items: [] })
        : pending,
  );
  await mount(
    <>
      <FavoriteButton product={product} />
      <FavoriteButton product={product} />
    </>,
  );
  const buttons = container.querySelectorAll<HTMLButtonElement>(".kv-favorite");
  await act(async () => {
    buttons[0].click();
    buttons[1].click();
  });
  expect(
    request.mock.calls.filter(([path]) => path.endsWith("/like")),
  ).toHaveLength(1);
  expect(buttons[1].disabled).toBe(true);
  await act(async () => finish({ isLiked: true, productLikes: 3 }));
  expect(
    Array.from(buttons).every(
      (button) =>
        button.getAttribute("aria-pressed") === "true" &&
        button.textContent === "3",
    ),
  ).toBe(true);
  let late: (value: unknown) => void = () => {};
  request.mockImplementation((path: string) =>
    path.endsWith("/like")
      ? new Promise((resolve) => {
          late = resolve;
        })
      : Promise.resolve({ items: [] }),
  );
  await act(async () => buttons[0].click());
  await act(async () =>
    store.setMember({ ...member, _id: "different-account" }),
  );
  await act(async () => late({ isLiked: true, productLikes: 9 }));
  expect(store.likes).toEqual({});
  expect(store.pendingLikes).toEqual({});
});

test("failed favorite toggle reconciles through a read and leaves an error, without replay", async () => {
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [] });
    if (path.endsWith("/like"))
      return Promise.reject(new ApiError(0, "Connection lost"));
    return Promise.resolve([{ ...product, isLiked: true, productLikes: 3 }]);
  });
  await mount(<FavoriteButton product={product} />);
  await act(async () =>
    container.querySelector<HTMLButtonElement>(".kv-favorite")!.click(),
  );
  expect(
    container.querySelector(".kv-favorite")?.getAttribute("aria-pressed"),
  ).toBe("true");
  expect(container.textContent).toContain("Connection lost");
  expect(
    request.mock.calls.filter(([path]) => path.endsWith("/like")),
  ).toHaveLength(1);
});

test("favorites removal refetches the page and shows the browse action when empty", async () => {
  let liked = true;
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [] });
    if (path.startsWith("/product/favorites"))
      return Promise.resolve({
        items: liked ? [{ ...product, isLiked: true }] : [],
        total: liked ? 1 : 0,
        page: 1,
        limit: 12,
      });
    liked = false;
    return Promise.resolve({ isLiked: false, productLikes: 1 });
  });
  await mount(<Favorites />);
  await act(async () =>
    container.querySelector<HTMLButtonElement>(".kv-favorite")!.click(),
  );
  expect(container.textContent).toContain("Browse products");
  expect(container.querySelector(".kv-product")).toBeNull();
});

test("Most Viewed uses positive view counts and never labels demo activity Best Sellers", async () => {
  request.mockImplementation((path: string) =>
    path === "/member/detail"
      ? Promise.reject(new ApiError(401, "Guest"))
      : Promise.resolve({
          items: [
            product,
            {
              ...product,
              _id: "zero",
              productName: "Never viewed",
              productViews: 0,
            },
          ],
          total: 2,
        }),
  );
  await mount(<ProductShowcase viewed />);
  expect(container.textContent).toContain("Most Viewed");
  expect(container.textContent).not.toContain("Best Sellers");
  expect(container.textContent).not.toContain("Never viewed");
  expect(container.textContent).not.toContain("View all");
});

test("Community shows public member names and rank with a catalog action", async () => {
  request.mockImplementation((path: string) =>
    path === "/member/detail"
      ? Promise.reject(new ApiError(401, "Guest"))
      : Promise.resolve([
          { key: "public-key", memberNick: "Community shopper", rank: 1 },
        ]),
  );
  await mount(<Community />);
  expect(container.textContent).toContain("Community shopper");
  expect(container.textContent).toContain("Rank 1");
  expect(container.querySelector('a[href="/products"]')).toBeTruthy();
});

test("guests read plain-text reviews and receive a safe sign-in return link", async () => {
  request.mockImplementation((path: string) =>
    path === "/member/detail"
      ? Promise.reject(new ApiError(401, "Guest"))
      : Promise.resolve({
          ...emptyReviews,
          items: [{ ...review, comment: "<script>literal comment</script>" }],
          total: 1,
          averageRating: 4,
        }),
  );
  await mount(<ProductReviews productId={product._id} />);
  expect(container.querySelector(".kv-review-comment")?.textContent).toBe(
    "<script>literal comment</script>",
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.textContent).not.toContain("Verified purchase");
  expect(
    container.querySelector('a[href^="/login?next="]')?.getAttribute("href"),
  ).toBe(`/login?next=${encodeURIComponent(`/products/${product._id}`)}`);
});

test("reviews validate trimmed comments, publish, edit and confirm removal while refreshing totals", async () => {
  let own: typeof review | null = null;
  let savedRating = 0;
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [] });
    if (path.endsWith("/me")) {
      if (options?.method === "PUT") {
        own = { ...review, ...options.body };
        savedRating = options.body.rating;
      }
      if (options?.method === "DELETE") {
        own = null;
        savedRating = 0;
        return Promise.resolve({ removed: true });
      }
      return Promise.resolve(own);
    }
    return Promise.resolve({
      ...emptyReviews,
      items: own ? [own] : [],
      total: own ? 1 : 0,
      averageRating: own ? savedRating : null,
    });
  });
  await mount(<ProductReviews productId={product._id} />);
  const comment = container.querySelector<HTMLTextAreaElement>("textarea")!;
  const form = container.querySelector("form")!;
  await act(async () => {
    Simulate.change(comment, { target: { value: "          " } } as any);
    Simulate.submit(form);
  });
  expect(container.textContent).toContain("Choose a rating");
  await act(async () => {
    Simulate.change(container.querySelectorAll('input[type="radio"]')[4]);
    Simulate.change(comment, {
      target: { value: "  Great everyday clothing.  " },
    } as any);
  });
  await act(async () => Simulate.submit(form));
  expect(container.textContent).toContain("5.0 / 5");
  expect(container.textContent).toContain("Save review");
  expect(
    request.mock.calls.find(([, options]) => options?.method === "PUT")?.[1]
      .body,
  ).toEqual({ rating: 5, comment: "Great everyday clothing." });
  await act(async () =>
    Simulate.change(comment, {
      target: { value: "Updated after wearing it again." },
    } as any),
  );
  await click("Save review");
  expect(container.textContent).toContain("Updated after wearing it again.");
  await click("Remove review");
  expect(
    request.mock.calls.some(([, options]) => options?.method === "DELETE"),
  ).toBe(false);
  await click("Confirm removal");
  expect(container.textContent).toContain("No ratings yet");
  expect(container.textContent).toContain("Publish review");
});

test("hidden own reviews explain moderation and a failed save preserves the entered comment", async () => {
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [] });
    if (options?.method === "PUT")
      return Promise.reject(new Error("Please retry the review"));
    if (path.endsWith("/me"))
      return Promise.resolve({ ...review, visibility: "hidden" });
    return Promise.resolve(emptyReviews);
  });
  await mount(<ProductReviews productId={product._id} />);
  expect(container.textContent).toContain("hidden by moderation");
  const textarea = container.querySelector<HTMLTextAreaElement>("textarea")!;
  await act(async () =>
    Simulate.change(textarea, {
      target: { value: "Keep this draft after a failure." },
    } as any),
  );
  await click("Save review");
  expect(textarea.value).toBe("Keep this draft after a failure.");
  expect(container.textContent).toContain("Please retry the review");
});

test("an uncertain favorite stays disabled until a read confirms it, without another toggle", async () => {
  let readable = false;
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart") return Promise.resolve({ items: [] });
    if (path.endsWith("/like"))
      return Promise.reject(new ApiError(0, "Write response lost"));
    return readable
      ? Promise.resolve([{ ...product, isLiked: true, productLikes: 3 }])
      : Promise.reject(new ApiError(0, "Read unavailable"));
  });
  await mount(<FavoriteButton product={product} />);
  const heart = container.querySelector<HTMLButtonElement>(".kv-favorite")!;
  await act(async () => heart.click());
  expect(heart.disabled).toBe(true);
  expect(container.textContent).toContain("Check saved state");
  await act(async () => heart.click());
  expect(
    request.mock.calls.filter(([path]) => path.endsWith("/like")),
  ).toHaveLength(1);
  readable = true;
  await click("Check saved state");
  expect(heart.disabled).toBe(false);
  expect(heart.getAttribute("aria-pressed")).toBe("true");
  expect(container.textContent).not.toContain("Check saved state");
  expect(
    request.mock.calls.filter(([path]) => path.endsWith("/like")),
  ).toHaveLength(1);
});
