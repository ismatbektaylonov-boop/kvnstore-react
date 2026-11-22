import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import StoreHeader from "./StoreHeader";
import { useStore } from "./state";

jest.mock("./state", () => ({ useStore: jest.fn() }));
const store = useStore as jest.Mock;
let container: HTMLDivElement;
let root: Root;
const signOut = jest.fn();

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  store.mockReturnValue({ member: null, cart: { items: [] } });
  signOut.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function mountHeader(path = "/") {
  // This is React's raw root.render, which requires act, rather than a Testing Library utility.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <StoreHeader signingOut={false} onSignOut={signOut} />
      </MemoryRouter>,
    );
  });
}
function toggle() {
  return container.querySelector<HTMLButtonElement>(".kv-menu-toggle")!;
}

test("marks the current route on a direct visit and after navigation", () => {
  mountHeader("/products/fictional-shirt");
  expect(
    container.querySelector('nav [aria-current="page"]')?.textContent,
  ).toBe("Catalog");
  act(() =>
    container
      .querySelector<HTMLAnchorElement>('nav a[href="/orders"]')!
      .click(),
  );
  expect(
    container.querySelector('nav [aria-current="page"]')?.textContent,
  ).toBe("Orders");
  expect(
    container.querySelector('nav a[href="/"]')?.getAttribute("aria-current"),
  ).toBeNull();
});

test("closes the disclosure with Escape and returns keyboard focus to its trigger", () => {
  mountHeader();
  act(() => toggle().click());
  expect(toggle().getAttribute("aria-expanded")).toBe("true");
  container.querySelector<HTMLAnchorElement>("nav a")!.focus();
  act(() =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    ),
  );
  expect(toggle().getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle());
});

test("closes the mobile disclosure after choosing a route", () => {
  mountHeader();
  act(() => toggle().click());
  act(() =>
    container
      .querySelector<HTMLAnchorElement>('nav a[href="/products"]')!
      .click(),
  );
  expect(toggle().getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle());
  expect(
    container.querySelector('nav [aria-current="page"]')?.textContent,
  ).toBe("Catalog");
});

test("uses current cart quantities and identity, and retains the existing sign-out action", () => {
  store.mockReturnValue({
    member: { memberNick: "Test shopper" },
    cart: { items: [{ quantity: 2 }, { quantity: 3 }] },
  });
  mountHeader("/account");
  expect(container.querySelector('nav [aria-current="page"]')).toBeNull();
  expect(
    container.querySelector(".kv-header-cart")?.getAttribute("aria-label"),
  ).toBe("Shopping bag, 5 items");
  expect(container.querySelector(".kv-member-name")?.textContent).toBe(
    "Test shopper",
  );
  expect(
    container
      .querySelector(".kv-header-account-link")
      ?.getAttribute("aria-current"),
  ).toBe("page");
  act(() => toggle().click());
  act(() =>
    container.querySelector<HTMLButtonElement>(".kv-header-signout")!.click(),
  );
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(toggle().getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle());
  store.mockReturnValue({ member: null, cart: { items: [] } });
  mountHeader("/account");
  expect(
    container.querySelector(".kv-header-cart")?.getAttribute("aria-label"),
  ).toBe("Shopping bag, 0 items");
  expect(container.querySelector(".kv-member-name")).toBeNull();
  expect(
    container.querySelector(".kv-header-signin")?.getAttribute("href"),
  ).toBe("/login");
});
