import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import { api } from "../../shared/api";
import { StoreProduct } from "../../shared/contracts";
import { HomeCollections } from "./HomeCollections";
import {
  homeCollectionProducts,
  homeCollectionsPath,
} from "./homeCollectionProducts";

jest.mock("../../shared/api", () => ({
  ...jest.requireActual("../../shared/api"),
  api: jest.fn(),
}));
const request = api as jest.Mock;
const products: StoreProduct[] = homeCollectionProducts.map((item, index) => ({
  _id: item.id,
  productName: `Collection set ${index + 1}`,
  productCollection: "CLOTHE",
  productStatus: "PROCESS",
  productPrice: 270,
  productLeftCount: index,
  productImages: [`/uploads/products/set-${index}.png`],
  productLikes: 0,
  productViews: 0,
  isLiked: false,
}));
let container: HTMLDivElement, root: Root;
let reduced = true;
let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue(products);
  reduced = true;
  frames = new Map();
  nextFrame = 0;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches: reduced,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
  jest.spyOn(document, "hidden", "get").mockReturnValue(false);
  jest
    .spyOn(HTMLElement.prototype, "offsetWidth", "get")
    .mockImplementation(function (this: HTMLElement) {
      return this.classList.contains("kv-collections-group") ? 2020 : 0;
    });
  jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1280);
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});
async function mount() {
  // Native React root requires act; this is not a Testing Library render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () =>
    root.render(
      <MemoryRouter>
        <HomeCollections />
      </MemoryRouter>,
    ),
  );
}
function frame(now: number) {
  const [id, callback] = frames.entries().next().value as [
    number,
    FrameRequestCallback,
  ];
  frames.delete(id);
  act(() => callback(now));
}

test("loads exactly the curated six active cards and shows only images, live stock and detail actions", async () => {
  await mount();
  expect(request).toHaveBeenCalledWith(
    homeCollectionsPath,
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  const cards = container.querySelectorAll("article");
  expect(cards).toHaveLength(6);
  cards.forEach((card, index) => {
    expect(card.textContent).toBe(`${index} in stock`);
    expect(card.querySelectorAll("img")).toHaveLength(1);
    expect(card.querySelector("a")?.getAttribute("href")).toBe(
      `/products/${products[index]._id}`,
    );
    expect(card.querySelector("h3")).toBeNull();
    expect(card.textContent).not.toContain("$270");
  });
  expect(
    container.querySelector('[aria-label="Pause collection scrolling"]'),
  ).toBeNull();
  expect(frames.size).toBe(0);
});

test("uses a non-tabbable visual copy for seamless movement and stops on pause and keyboard focus", async () => {
  reduced = false;
  await mount();
  const groups = container.querySelectorAll(".kv-collections-group");
  expect(groups).toHaveLength(2);
  expect(groups[1].getAttribute("aria-hidden")).toBe("true");
  expect(
    Array.from(groups[1].querySelectorAll("a")).every(
      (link) => link.tabIndex === -1,
    ),
  ).toBe(true);
  const viewport = container.querySelector<HTMLElement>(
    ".kv-collections-viewport",
  )!;
  frame(0);
  frame(1000);
  expect(viewport.scrollLeft).toBeGreaterThan(0);
  viewport.scrollLeft = 2019.8;
  frame(1050);
  expect(viewport.scrollLeft).toBeLessThan(3);
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>(
        '[aria-label="Pause collection scrolling"]',
      )!
      .click(),
  );
  expect(frames.size).toBe(0);
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>(
        '[aria-label="Resume collection scrolling"]',
      )!
      .click(),
  );
  expect(frames.size).toBe(1);
  await act(async () => Simulate.focus(viewport));
  expect(frames.size).toBe(0);
  await act(async () =>
    Simulate.blur(viewport, { relatedTarget: document.body }),
  );
  expect(frames.size).toBe(1);
});

test("skips missing products and keeps a short selection static when it fits", async () => {
  reduced = false;
  jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
  request.mockResolvedValue(products.slice(0, 1));
  await mount();
  expect(container.querySelectorAll("article")).toHaveLength(1);
  expect(container.querySelector(".kv-collections-motion")).toBeNull();
  expect(frames.size).toBe(0);
});

test("lets a failed collections request retry without a page reload", async () => {
  request.mockRejectedValueOnce(
    new Error("Collection products could not be loaded."),
  );
  await mount();
  expect(container.textContent).toContain(
    "Collection products could not be loaded.",
  );
  await act(async () =>
    container.querySelector<HTMLButtonElement>("button")!.click(),
  );
  expect(container.querySelectorAll("article")).toHaveLength(6);
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

test("shows the existing empty state when the selected products are no longer public", async () => {
  request.mockResolvedValue([]);
  await mount();
  expect(container.textContent).toContain("Collections are being refreshed.");
  expect(container.querySelector("article")).toBeNull();
  expect(container.querySelector("a")?.getAttribute("href")).toBe("/products");
});
