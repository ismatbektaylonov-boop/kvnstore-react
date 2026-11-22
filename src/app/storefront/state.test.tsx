import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { api } from "../../shared/api";
import { StoreCart } from "../../shared/contracts";
import { StoreProvider, useStore } from "./state";

jest.mock("../../shared/api", () => ({
  ...jest.requireActual("../../shared/api"),
  api: jest.fn(),
}));
const request = api as jest.Mock;
const member = { _id: "test-member", memberType: "USER" };
const cart: StoreCart = {
  items: [],
  subtotal: 48,
  currency: "USD",
  checkoutReady: false,
};
let container: HTMLDivElement;
let root: Root;
let store: ReturnType<typeof useStore>;
function Probe() {
  store = useStore();
  return <span>{store.cart.subtotal}</span>;
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  request.mockReset();
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));
async function mountStore() {
  // Native React roots need act; this is not a Testing Library render call.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () =>
    root.render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    ),
  );
}

test.each(["success", "failure"])(
  "ignores a late cart read %s after a newer mutation",
  async (outcome) => {
    let resolve: (value: unknown) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const pending = new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    });
    request.mockImplementation((path: string) =>
      path === "/member/detail" ? Promise.resolve(member) : pending,
    );
    await mountStore();
    expect(store.cartReady).toBe(false);
    await act(async () => store.setCart(cart));
    await act(async () => {
      if (outcome === "success") resolve({ ...cart, subtotal: 0 });
      else reject(new Error("Old cart request failed"));
    });
    expect(store.cart.subtotal).toBe(48);
    expect(store.cartReady).toBe(true);
    expect(store.cartError).toBe("");
  },
);

test("uses the newest cart refresh when reads finish out of order", async () => {
  let resolveOld: (value: unknown) => void = () => {};
  const oldRead = new Promise((resolve) => {
    resolveOld = resolve;
  });
  request.mockImplementation((path: string) =>
    path === "/member/detail" ? Promise.resolve(member) : oldRead,
  );
  await mountStore();
  request.mockResolvedValue(cart);
  await act(async () => {
    await store.refreshCart();
  });
  await act(async () => resolveOld({ ...cart, subtotal: 0 }));
  expect(store.cart.subtotal).toBe(48);
  expect(store.cartReady).toBe(true);
});
