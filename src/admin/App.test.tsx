import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import AdminApp from "./App";
import { api, ApiError } from "../shared/api";
import { adminLogin } from "./adminApi";
import { storefrontUrl } from "../lib/config";

jest.mock("../shared/api", () => ({
  ...jest.requireActual("../shared/api"),
  api: jest.fn(),
}));
jest.mock("./adminApi", () => ({
  ...jest.requireActual("./adminApi"),
  adminLogin: jest.fn(),
}));
const request = api as jest.Mock;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  jest.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});
async function mount(path: string) {
  // Native React root, not Testing Library's render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <AdminApp />
      </MemoryRouter>,
    ),
  );
}
test("shows administrator login independently of customer authentication and rejects a shopper", async () => {
  request.mockRejectedValue(new ApiError(401, "Admin login required"));
  (adminLogin as jest.Mock).mockRejectedValue(
    new ApiError(403, "Admin access required"),
  );
  await mount("/administration/create");
  expect(container.textContent).toContain("Administrator sign in");
  (container.querySelector('[name="memberNick"]') as HTMLInputElement).value =
    "Fictional shopper";
  (
    container.querySelector('[name="memberPassword"]') as HTMLInputElement
  ).value = "test-only-password";
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(adminLogin).toHaveBeenCalledWith(
    "Fictional shopper",
    "test-only-password",
  );
  expect(container.textContent).toContain("Admin access required");
  expect(container.querySelector('[name="productName"]')).toBeNull();
  expect(request.mock.calls.every(([path]) => path === "/admin/check")).toBe(
    true,
  );
});
test("renders a separate admin workspace without storefront navigation or cart requests", async () => {
  request.mockResolvedValue({
    member: {
      _id: "admin",
      memberNick: "Administrator",
      memberType: "ADMIN",
      memberStatus: "ACTIVE",
    },
  });
  await mount("/administration");
  expect(container.textContent).toContain("Your store workspace.");
  expect(container.textContent).not.toContain("My account");
  expect(container.querySelector(".kv-count")).toBeNull();
  expect(
    container.querySelector<HTMLAnchorElement>(`a[href="${storefrontUrl}"]`),
  ).toBeTruthy();
  expect(request.mock.calls.every(([path]) => path === "/admin/check")).toBe(
    true,
  );
});

test("guards reviews with the admin session and never requests moderation for a customer", async () => {
  request.mockResolvedValue({
    member: { _id: "shopper", memberType: "USER", memberStatus: "ACTIVE" },
  });
  await mount("/administration/reviews");
  expect(container.textContent).toContain("Administrator access is required.");
  expect(request.mock.calls.every(([path]) => path === "/admin/check")).toBe(
    true,
  );
});

test("filters reviews and hides/restores visible reviews while keeping removed reviews immutable", async () => {
  const review = {
    _id: "test-review",
    productId: "product",
    productName: "Test shirt",
    memberNick: "Reviewer",
    rating: 4,
    comment: "Comfortable everyday clothing.",
    createdAt: "2026-11-01T12:00:00Z",
    visibility: "published",
    deleted: false,
  };
  let visibility = "published";
  request.mockImplementation((path: string, options: any) => {
    if (path === "/admin/check")
      return Promise.resolve({
        member: { memberType: "ADMIN", memberStatus: "ACTIVE" },
      });
    if (options?.method === "POST") {
      visibility = options.body.visibility;
      return Promise.resolve({});
    }
    return Promise.resolve({
      items: [
        { ...review, visibility },
        { ...review, _id: "removed", deleted: true },
      ],
      total: 2,
      limit: 20,
    });
  });
  await mount("/administration/reviews");
  const action = () =>
    Array.from(container.querySelectorAll("button")).find(
      (button) =>
        button.textContent ===
        (visibility === "published" ? "Hide" : "Restore"),
    )!;
  await act(async () => action().click());
  expect(visibility).toBe("hidden");
  expect(container.textContent).toContain("Restore");
  await act(async () => action().click());
  expect(visibility).toBe("published");
  const removed = container.querySelectorAll("article")[1];
  expect(removed.querySelector("button")).toBeNull();
  const select = container.querySelector("select")!;
  await act(async () => {
    select.value = "hidden";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(
    request.mock.calls.some(([path]) => path.includes("visibility=hidden")),
  ).toBe(true);
});
