import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { api, ApiError } from "../../shared/api";
import { StoreOrder } from "../../shared/contracts";

jest.mock("../../shared/api", () => ({
  ...jest.requireActual("../../shared/api"),
  api: jest.fn(),
}));
const request = api as jest.Mock;
const orderId = "312345678901234567890123";
const endpoint = `/order/${orderId}/demo-pay`;
const originalEnv = { ...process.env };
let order: StoreOrder;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  process.env.REACT_APP_ENABLE_DEMO_PAYMENTS = "true";
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  localStorage.clear();
  sessionStorage.clear();
  order = {
    _id: orderId,
    orderStatus: "PENDING",
    paymentMode: "unpaid",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    shippingAddress: "123 Fictional Lane",
    orderSubtotal: 48,
    orderShippingFee: 5,
    orderTotal: 53,
    orderItems: [
      {
        productId: "product",
        productName: "Test Shirt",
        selectedSize: "M",
        quantity: 1,
        unitPrice: 48,
      },
    ],
  };
  request.mockReset();
  request.mockImplementation((path: string, options: any) => {
    if (path === "/member/detail")
      return Promise.resolve({ _id: "member", memberNick: "Shopper" });
    if (path === "/cart")
      return Promise.resolve({
        items: [],
        subtotal: 0,
        currency: "USD",
        checkoutReady: false,
      });
    if (path.startsWith("/order/all?"))
      return Promise.resolve({
        items: [{ ...order }],
        total: 1,
        page: 1,
        limit: 10,
      });
    if (path === `/order/${orderId}`) return Promise.resolve({ ...order });
    if (path === endpoint) {
      if (options.body.outcome === "declined")
        return Promise.reject(
          new ApiError(
            402,
            "Demo payment declined. Your reservation is still unpaid.",
          ),
        );
      order = {
        ...order,
        orderStatus: "PAID",
        paymentMode: "demo",
        paidAt: new Date().toISOString(),
      };
      return Promise.resolve({ ...order });
    }
    return Promise.reject(new Error(path));
  });
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
async function mount(path = `/orders/${orderId}/payment`) {
  // Native React root, not Testing Library's render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    ),
  );
}
function button(text: string) {
  const node = Array.from(container.querySelectorAll("button")).find((item) =>
    item.textContent?.includes(text),
  );
  expect(node).toBeTruthy();
  return node!;
}
function fillDetails(
  values = {
    cardholderName: "Test Shopper",
    paymentReference: "DEMO-4242",
    expiryNote: "12/30",
    confirmationCode: "123",
  },
) {
  for (const [name, value] of Object.entries(values))
    (container.querySelector(`[name="${name}"]`) as HTMLInputElement).value =
      value;
}
async function click(text: string) {
  await act(async () => button(text).click());
}
test("shows the server total without card fields and approves once even on a double click", async () => {
  await mount();
  expect(container.textContent).toContain("Demo checkout.");
  expect(container.textContent).toContain("$53.00");
  expect(container.querySelector('[name="cardNumber"]')).toBeNull();
  expect(container.querySelector('[name="paymentReference"]')).toBeTruthy();
  fillDetails();
  await act(async () => {
    button("Complete demo payment").click();
    button("Complete demo payment").click();
  });
  expect(request.mock.calls.filter(([path]) => path === endpoint)).toHaveLength(
    1,
  );
  expect(
    request.mock.calls.find(([path]) => path === endpoint)?.[1].body,
  ).toEqual({ outcome: "success" });
  expect(container.textContent).toContain("Your demo payment is complete.");
  expect(container.textContent).toContain("no money was charged");
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
});
test("requires demo details before sending a payment and never sends the form fields", async () => {
  await mount();
  fillDetails({
    cardholderName: "   ",
    paymentReference: "DEMO-4242",
    expiryNote: "12/30",
    confirmationCode: "123",
  });
  await click("Complete demo payment");
  expect(container.textContent).toContain(
    "Fill in all four demo payment details",
  );
  expect(request.mock.calls.some(([path]) => path === endpoint)).toBe(false);
  fillDetails();
  await click("Complete demo payment");
  expect(
    request.mock.calls.find(([path]) => path === endpoint)?.[1].body,
  ).toEqual({ outcome: "success" });
});
test("keeps a declined reservation unpaid and lets the customer retry approval", async () => {
  await mount();
  await click("Simulate decline");
  expect(order.orderStatus).toBe("PENDING");
  expect(container.textContent).toContain("Demo payment declined");
  expect(button("Complete demo payment").disabled).toBe(false);
  fillDetails();
  await click("Complete demo payment");
  expect(order.orderStatus).toBe("PAID");
  expect(container.textContent).toContain("Your demo payment is complete.");
});
test("returns to the unpaid reservation without making a payment request", async () => {
  await mount();
  await click("Return without paying");
  expect(request.mock.calls.some(([path]) => path === endpoint)).toBe(false);
  expect(order.orderStatus).toBe("PENDING");
  expect(container.textContent).toContain("Your reservation is unpaid");
});
test("does not offer payment for an expired reservation", async () => {
  order.expiresAt = new Date(Date.now() - 1000).toISOString();
  await mount();
  expect(container.textContent).toContain("This reservation has expired");
  expect(container.textContent).not.toContain("Complete demo payment");
});
test("reconciles an ambiguous payment response before allowing another attempt", async () => {
  const normal = request.getMockImplementation()!;
  request.mockImplementation((path: string, options: any) => {
    if (path !== endpoint) return normal(path, options);
    order = { ...order, orderStatus: "PAID", paymentMode: "demo" };
    return Promise.reject(new ApiError(0, "Connection interrupted"));
  });
  await mount();
  fillDetails();
  await click("Complete demo payment");
  expect(container.textContent).toContain(
    "This order already has a demo payment",
  );
  expect(container.textContent).not.toContain("Complete demo payment");
});
test.each(["disabled", "production"])(
  "blocks demo checkout when %s",
  async (mode) => {
    if (mode === "disabled")
      process.env.REACT_APP_ENABLE_DEMO_PAYMENTS = "false";
    else (process.env as any).NODE_ENV = "production";
    await mount();
    expect(container.textContent).toContain("Demo checkout is unavailable");
    expect(
      request.mock.calls.some(([path]) => path.startsWith("/order/")),
    ).toBe(false);
  },
);

test("opens payment directly from the unpaid order in history", async () => {
  await mount("/orders");
  const payLink = container.querySelector<HTMLAnchorElement>(
    `a[href="/orders/${orderId}/payment"]`,
  );
  expect(payLink?.textContent).toContain("Pay $53.00 (demo)");
  await act(async () => payLink!.click());
  expect(container.textContent).toContain("Demo checkout.");
  expect(container.querySelector('[name="paymentReference"]')).toBeTruthy();
  expect(request.mock.calls.some(([path]) => path === endpoint)).toBe(false);
});
test.each(["paid", "expired", "disabled", "production"])(
  "hides the history payment action when %s",
  async (mode) => {
    if (mode === "paid")
      order = { ...order, orderStatus: "PAID", paymentMode: "demo" };
    if (mode === "expired")
      order.expiresAt = new Date(Date.now() - 1000).toISOString();
    if (mode === "disabled")
      process.env.REACT_APP_ENABLE_DEMO_PAYMENTS = "false";
    if (mode === "production") (process.env as any).NODE_ENV = "production";
    await mount("/orders");
    expect(
      container.querySelector(`a[href="/orders/${orderId}/payment"]`),
    ).toBeNull();
    expect(
      container.querySelector(`a[href="/orders/${orderId}"]`),
    ).toBeTruthy();
  },
);
test("guides an empty cart back to its existing unpaid order", async () => {
  await mount("/cart");
  expect(container.textContent).toContain("Your cart is waiting.");
  const orders = Array.from(
    container.querySelectorAll<HTMLAnchorElement>("a"),
  ).find((node) => node.textContent?.includes("View orders and payments"));
  expect(orders).toBeTruthy();
  await act(async () => orders!.click());
  expect(
    container.querySelector(`a[href="/orders/${orderId}/payment"]`)
      ?.textContent,
  ).toContain("Pay $53.00 (demo)");
});
