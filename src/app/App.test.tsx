import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { api, ApiError } from "../shared/api";
import { TextEncoder } from "util";
import { adminDestination, adminUrl } from "../lib/config";

jest.mock("./storefront/HeroCarousel", () => () => (
  <div className="kv-hero-art">
    <img
      src="/media/images/carousel/everyday-cotton.jpg"
      alt="Everyday clothing"
    />
  </div>
));
jest.mock("../shared/api", () => ({
  ...jest.requireActual("../shared/api"),
  api: jest.fn(),
}));
const request = api as jest.Mock;
const originalEnv = { ...process.env };
const member = {
  _id: "012345678901234567890123",
  memberType: "USER",
  memberStatus: "ACTIVE",
  memberNick: "Test shopper",
  memberAddress: "123 Fictional Lane",
};
const product = {
  _id: "112345678901234567890123",
  productName: "Test Shirt",
  productCollection: "CLOTHE",
  productStatus: "PROCESS",
  productPrice: 48,
  productLeftCount: 8,
  productSizes: ["M"],
  productImages: [],
  productLikes: 0,
  productViews: 0,
  isLiked: false,
};
const cart = {
  items: [
    {
      _id: "212345678901234567890123",
      productId: product._id,
      selectedSize: "M",
      quantity: 1,
      product,
      unitPrice: 48,
      lineTotal: 48,
      available: true,
    },
  ],
  subtotal: 48,
  currency: "USD",
  checkoutReady: true,
};
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  process.env.REACT_APP_ENABLE_DEMO_PAYMENTS = "false";
  Object.assign(global, { TextEncoder });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  localStorage.clear();
  sessionStorage.clear();
  request.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  process.env = { ...originalEnv };
});
async function render(path: string) {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
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
function guestRequests(path: string) {
  if (path === "/member/detail")
    return Promise.reject(new ApiError(401, "Login required"));
  if (path.startsWith("/product/cards")) return Promise.resolve([]);
  if (path.startsWith("/member/community")) return Promise.resolve([]);
  if (path.startsWith("/product/all"))
    return Promise.resolve({ items: [], total: 0, page: 1, limit: 4 });
  return Promise.reject(new Error(`Unexpected route ${path}`));
}
test("shows bundled editorial media and honest empty catalog, without payment or VIP claims", async () => {
  request.mockImplementation(guestRequests);
  await render("/");
  expect(container.querySelector("h1")?.textContent?.replace(/\s/g, "")).toBe(
    "Goodstyle.Greateveryday.",
  );
  expect(
    container.querySelector(".kv-hero-art img")?.getAttribute("src"),
  ).toMatch(/^\/media\//);
  expect(container.textContent).toContain("New pieces are on their way.");
  expect(container.textContent).not.toMatch(/VIP|Organic|TLS|CSRF/);
});

test("account shortcuts open protected recent history inside the account layout", async () => {
  localStorage.setItem(
    `kvn:recent-products:v2:${member._id}`,
    JSON.stringify([product._id]),
  );
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart")
      return Promise.resolve({ ...cart, items: [], subtotal: 0 });
    if (path.startsWith("/product/cards")) return Promise.resolve([product]);
    return Promise.reject(new Error(path));
  });
  await render("/account");
  const links = Array.from(
    container.querySelectorAll<HTMLAnchorElement>(".kv-profile-nav a"),
  );
  expect(
    links.map((link) => [link.textContent, link.getAttribute("href")]),
  ).toEqual([
    ["Your Orders", "/orders"],
    ["Favorites", "/favorites"],
    ["Recently Viewed", "/account/recently-viewed"],
  ]);
  await act(async () => links[2].click());
  expect(container.querySelector("h1")?.textContent).toBe("Recently Viewed");
  expect(
    container.querySelector('.kv-profile-nav [aria-current="page"]')
      ?.textContent,
  ).toBe("Recently Viewed");
  expect(
    container.querySelector(".kv-account-recent .kv-product h3")?.textContent,
  ).toBe(product.productName);
  expect(container.querySelector(".kv-account-layout form")).toBeNull();
  expect(request).toHaveBeenCalledWith(
    `/product/cards?ids=${product._id}`,
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

test("recent account history is inaccessible while signed out", async () => {
  localStorage.setItem(
    `kvn:recent-products:v2:${member._id}`,
    JSON.stringify([product._id]),
  );
  request.mockImplementation(guestRequests);
  await render("/account/recently-viewed");
  expect(container.textContent).toContain("Sign in to continue");
  expect(container.querySelector(".kv-account-recent")).toBeNull();
  expect(
    request.mock.calls.some(([path]) => path.startsWith("/product/cards")),
  ).toBe(false);
});

test("home never renders recent history for an authenticated shopper", async () => {
  localStorage.setItem(
    `kvn:recent-products:v2:${member._id}`,
    JSON.stringify([product._id]),
  );
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/cart")
      return Promise.resolve({ ...cart, items: [], subtotal: 0 });
    return guestRequests(path);
  });
  await render("/");
  expect(container.textContent).not.toContain("Recently Viewed");
  expect(
    request.mock.calls.some(
      ([path]) => path === `/product/cards?ids=${product._id}`,
    ),
  ).toBe(false);
});

test.each([
  ["CLOTHE", "Clothing", "clothing.png"],
  ["PANTS", "Trousers", "trousers.png"],
  ["HAT", "Hats", "hats.png"],
  ["SHOES", "Shoes", "shoes.png"],
  ["OTHERS", "Other essentials", "other_essentials.png"],
])(
  "opens the %s catalog from its homepage photo tile",
  async (collection, name, image) => {
    request.mockImplementation(guestRequests);
    await render("/");
    const section = container.querySelector(".kv-categories")!;
    expect(section.querySelectorAll(".kv-category")).toHaveLength(5);
    const link = section.querySelector<HTMLAnchorElement>(
      `a[href="/products?productCollection=${collection}"]`,
    )!;
    expect(link.textContent).toBe(
      collection === "OTHERS" ? "Other Essentials" : name,
    );
    expect(section.querySelectorAll("img")).toHaveLength(5);
    expect(link.querySelector("img")?.getAttribute("src")).toBe(
      `/media/images/categories/${image}`,
    );
    await act(async () => link.click());
    expect(
      container.querySelector(".kv-filter-list .active")?.textContent,
    ).toBe(`${name}↗`);
    expect(
      request.mock.calls.some(
        ([path]) =>
          path.startsWith("/product/all?") &&
          new URLSearchParams(path.split("?")[1]).get("productCollection") ===
            collection,
      ),
    ).toBe(true);
    expect(container.querySelector(".kv-categories")).toBeNull();
  },
);

test.each(["", "/create", "/products", "/orders", "/customers"])(
  "keeps legacy administration%s URLs outside the storefront",
  async (suffix) => {
    request.mockImplementation(guestRequests);
    await render(`/administration${suffix}`);
    expect(container.textContent).toContain(
      "Administration is a separate interface.",
    );
    expect(
      container.querySelector<HTMLAnchorElement>("main a.kv-button")?.href,
    ).toBe(adminDestination(`/administration${suffix}`));
    expect(
      container.querySelector<HTMLAnchorElement>(
        `footer a[href="${adminUrl}"]`,
      ),
    ).toBeTruthy();
    expect(
      request.mock.calls.some(([path]) => path.startsWith("/admin/")),
    ).toBe(false);
    expect(container.querySelector('[name="productName"]')).toBeNull();
  },
);
test("does not trust cached identity on protected routes", async () => {
  localStorage.setItem("memberData", JSON.stringify(member));
  request.mockImplementation(guestRequests);
  await render("/orders");
  expect(container.textContent).toContain("Sign in to continue");
  expect(
    request.mock.calls.some(([path]) => path.startsWith("/order/all")),
  ).toBe(false);
  expect(localStorage.getItem("memberData")).toBeNull();
});
test("registers with only backend fields and never stores response tokens", async () => {
  request.mockImplementation((path: string) =>
    path === "/member/signup"
      ? Promise.resolve({ member, accessToken: "fictional-test-token" })
      : path === "/cart"
        ? Promise.resolve({ ...cart, items: [] })
        : guestRequests(path),
  );
  await render("/signup");
  (container.querySelector('[name="memberNick"]') as HTMLInputElement).value =
    "Fictional shopper";
  (container.querySelector('[name="memberPhone"]') as HTMLInputElement).value =
    "fictional-phone";
  (
    container.querySelector('[name="memberPassword"]') as HTMLInputElement
  ).value = "test-password-123";
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  const submission = request.mock.calls.find(
    ([path]) => path === "/member/signup",
  );
  expect(submission?.[1].body).toEqual({
    memberNick: "Fictional shopper",
    memberPhone: "fictional-phone",
    memberPassword: "test-password-123",
    memberAddress: "",
  });
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(container.textContent).toContain("Personal details");
});
test.each([false, true])(
  "reuses checkout after an ambiguous failure with demo payments enabled=%s",
  async (demo) => {
    process.env.REACT_APP_ENABLE_DEMO_PAYMENTS = String(demo);
    const keys: string[] = [];
    request.mockImplementation((path: string, options: any) => {
      if (path === "/member/detail") return Promise.resolve(member);
      if (path === "/cart") return Promise.resolve(cart);
      if (path === "/cart/checkout") {
        keys.push(options.key);
        if (keys.length === 1)
          return Promise.reject(new ApiError(0, "Connection interrupted"));
        return Promise.resolve({
          _id: "312345678901234567890123",
          orderStatus: "PENDING",
        });
      }
      if (path.startsWith("/order/"))
        return Promise.resolve({
          _id: "312345678901234567890123",
          orderStatus: "PENDING",
          paymentMode: "unpaid",
          expiresAt: new Date(Date.now() + 1800000).toISOString(),
          createdAt: new Date().toISOString(),
          orderItems: [],
          shippingAddress: "123 Fictional Lane",
          orderSubtotal: 48,
          orderShippingFee: 5,
          orderTotal: 53,
        });
      return Promise.reject(new Error(path));
    });
    await render("/checkout");
    await click(demo ? "Continue to demo payment" : "Reserve order");
    expect(container.textContent).toContain("Connection interrupted");
    expect(container.textContent).toContain("Check your previous request");
    await click("Check order result");
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    if (demo) {
      expect(container.textContent).toContain("Demo checkout.");
      expect(container.textContent).toContain("$53.00");
      expect(
        request.mock.calls.some(([path]) => path.endsWith("/demo-pay")),
      ).toBe(false);
    } else {
      expect(container.textContent).toContain("Your order is reserved.");
      expect(container.textContent).toContain("Your reservation is unpaid.");
    }
    expect(container.querySelector('[name="cardNumber"]')).toBeNull();
    expect(sessionStorage.getItem(`kvn:checkout:${member._id}`)).toBeNull();
  },
);

test("does not restore the previous account cart when an add finishes after logout", async () => {
  let completeAdd: (value: unknown) => void = () => {};
  const adding = new Promise((resolve) => {
    completeAdd = resolve;
  });
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === "/member/logout") return Promise.resolve({ logout: true });
    if (path === "/cart")
      return Promise.resolve({
        ...cart,
        items: [],
        subtotal: 0,
        checkoutReady: false,
      });
    if (path === `/product/${product._id}`) return Promise.resolve(product);
    if (path === "/cart/items" && options.method === "PUT") return adding;
    return Promise.reject(new Error(path));
  });
  await render(`/products/${product._id}`);
  await click("Add to cart");
  await click("Sign out");
  await act(async () => {
    completeAdd(cart);
  });
  expect(container.querySelector(".kv-count")?.textContent).toBe("0");
  expect(container.querySelector(".kv-header-actions")?.textContent).toContain(
    "Sign in",
  );
});

test("waits for the saved cart before adding and preserves its existing quantity", async () => {
  let loadCart: (value: unknown) => void = () => {};
  const loadingCart = new Promise((resolve) => {
    loadCart = resolve;
  });
  const savedCart = {
    ...cart,
    items: [{ ...cart.items[0], quantity: 3, lineTotal: 144 }],
    subtotal: 144,
  };
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === `/product/${product._id}`) return Promise.resolve(product);
    if (path === "/cart") return loadingCart;
    if (path === "/cart/items" && options.method === "PUT")
      return Promise.resolve({
        ...savedCart,
        items: [{ ...savedCart.items[0], quantity: 4, lineTotal: 192 }],
        subtotal: 192,
      });
    return Promise.reject(new Error(path));
  });
  await render(`/products/${product._id}`);
  const loadingButton = Array.from(container.querySelectorAll("button")).find(
    (node) => node.textContent?.includes("Loading your cart"),
  );
  expect(loadingButton?.disabled).toBe(true);
  await click("Loading your cart");
  expect(request.mock.calls.some(([path]) => path === "/cart/items")).toBe(
    false,
  );
  await act(async () => loadCart(savedCart));
  await click("Add to cart");
  expect(
    request.mock.calls.find(([path]) => path === "/cart/items")?.[1].body,
  ).toEqual({ productId: product._id, selectedSize: "M", quantity: 4 });
  expect(container.querySelector(".kv-count")?.textContent).toBe("4");
});

test("keeps additions blocked after a cart load failure until a successful retry", async () => {
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === `/product/${product._id}`) return Promise.resolve(product);
    if (path === "/cart")
      return Promise.reject(new ApiError(0, "Saved cart could not be loaded"));
    if (path === "/cart/items" && options.method === "PUT")
      return Promise.resolve(cart);
    return Promise.reject(new Error(path));
  });
  await render(`/products/${product._id}`);
  expect(container.textContent).toContain("Saved cart could not be loaded");
  const blocked = Array.from(container.querySelectorAll("button")).find(
    (node) => node.textContent?.includes("Cart unavailable"),
  );
  expect(blocked?.disabled).toBe(true);
  await click("Cart unavailable");
  expect(request.mock.calls.some(([path]) => path === "/cart/items")).toBe(
    false,
  );
  request.mockImplementation((path: string) => {
    if (path === "/cart") return Promise.resolve(cart);
    if (path === "/cart/items") return Promise.resolve(cart);
    return Promise.reject(new Error(path));
  });
  await click("Try again");
  await click("Add to cart");
  expect(
    request.mock.calls.find(([path]) => path === "/cart/items")?.[1].body,
  ).toEqual({ productId: product._id, selectedSize: "M", quantity: 2 });
});

test("checks stock across all saved sizes before adding a selected size", async () => {
  request.mockImplementation((path: string) => {
    if (path === "/member/detail") return Promise.resolve(member);
    if (path === `/product/${product._id}`)
      return Promise.resolve({ ...product, productSizes: ["M", "L"] });
    if (path === "/cart")
      return Promise.resolve({
        ...cart,
        items: [
          { ...cart.items[0], quantity: 3 },
          {
            ...cart.items[0],
            _id: "other-size",
            selectedSize: "L",
            quantity: 5,
          },
        ],
      });
    return Promise.reject(new Error(path));
  });
  await render(`/products/${product._id}`);
  await click("Add to cart");
  expect(container.textContent).toContain("Choose a size");
  const size = container.querySelector<HTMLButtonElement>(
    ".kv-size-options button",
  );
  await act(async () => size!.click());
  await click("Add to cart");
  expect(container.textContent).toContain("exceeds available stock");
  expect(request.mock.calls.some(([path]) => path === "/cart/items")).toBe(
    false,
  );
});

test.each([
  ["NIKE", "Nike"],
  ["ADIDAS", "adidas"],
  ["NEW_BALANCE", "New Balance"],
  ["ZARA", "Zara"],
])(
  "opens the %s brand catalog from the homepage-only strip above the footer",
  async (brand, name) => {
    request.mockImplementation(guestRequests);
    await render("/");
    const section = container.querySelector(".kv-featured-brands")!;
    expect(container.querySelector("main")?.lastElementChild).toBe(section);
    expect(section.querySelectorAll("a")).toHaveLength(4);
    const link = section.querySelector<HTMLAnchorElement>(
      `a[href="/products?brand=${brand}"]`,
    )!;
    expect(link.getAttribute("aria-label")).toBe(`Shop ${name}`);
    await act(async () => link.click());
    expect(container.querySelector("h1")?.textContent).toBe(
      `${name} collection`,
    );
    expect(
      request.mock.calls.some(
        ([path]) =>
          path.startsWith("/product/all?") &&
          new URLSearchParams(path.split("?")[1]).get("brand") === brand,
      ),
    ).toBe(true);
    expect(container.querySelector(".kv-featured-brands")).toBeNull();
  },
);

test("retains brand when catalog pagination, sorting and size change, and clears it with all filters", async () => {
  request.mockImplementation((path: string) => {
    if (path === "/member/detail")
      return Promise.reject(new ApiError(401, "Guest"));
    const query = new URLSearchParams(path.split("?")[1]);
    return Promise.resolve({
      items: [product],
      total: 30,
      page: Number(query.get("page") || 1),
      limit: 9,
    });
  });
  await render("/products?brand=NIKE&productCollection=SHOES&size=42&page=2");
  await click("Next");
  let query = new URLSearchParams(
    request.mock.calls
      .filter(([path]) => path.startsWith("/product/all?"))
      .pop()?.[0]
      .split("?")[1],
  );
  expect(query.get("brand")).toBe("NIKE");
  expect(query.get("page")).toBe("3");
  expect(query.get("size")).toBe("42");
  const select = container.querySelector<HTMLSelectElement>(
    'select[aria-label="Sort products"]',
  )!;
  await act(async () => {
    select.value = "productPrice:asc";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  query = new URLSearchParams(
    request.mock.calls
      .filter(([path]) => path.startsWith("/product/all?"))
      .pop()?.[0]
      .split("?")[1],
  );
  expect(query.get("brand")).toBe("NIKE");
  expect(query.get("page")).toBe("1");
  expect(query.get("order")).toBe("productPrice");
  expect(query.get("size")).toBe("42");
  const brandSelect = Array.from(container.querySelectorAll("select")).find(
    (node) => node.closest("label")?.textContent?.startsWith("Brand"),
  )!;
  await act(async () => {
    brandSelect.value = "ZARA";
    brandSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.querySelector("h1")?.textContent).toBe("Zara collection");
  await click("Clear all filters");
  expect(container.querySelector("h1")?.textContent).toBe(
    "Find your everyday.",
  );
});
