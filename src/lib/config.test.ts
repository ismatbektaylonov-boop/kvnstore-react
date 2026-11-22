export {};
const originalEnv = { ...process.env };
afterEach(() => {
  process.env = { ...originalEnv };
  jest.resetModules();
});
test("uses environment URLs and maps old storefront admin routes to the retained EJS pages", () => {
  process.env.REACT_APP_API_URL = "https://api.example.test/";
  process.env.REACT_APP_ADMIN_URL = "https://api.example.test/admin/";
  jest.resetModules();
  const config = require("./config");
  expect(config.serverApi).toBe("https://api.example.test");
  expect(config.adminDestination("/administration/orders")).toBe(
    "https://api.example.test/admin/order/all",
  );
  expect(config.adminDestination("/administration/customers")).toBe(
    "https://api.example.test/admin/user/all",
  );
});
test("can link the storefront to a separately hosted React Admin", () => {
  process.env.REACT_APP_ADMIN_URL = "https://admin.example.test/administration";
  jest.resetModules();
  expect(require("./config").adminDestination("/administration/products")).toBe(
    "https://admin.example.test/administration/products",
  );
});
test.each([
  "https://user:password@api.example.test",
  "https://api.example.test?secret=fake",
  "javascript:alert(1)",
])(
  "rejects a public API URL containing credentials, query or a non-HTTP scheme: %s",
  (value) => {
    process.env.REACT_APP_API_URL = value;
    jest.resetModules();
    expect(() => require("./config")).toThrow("must be an HTTP(S) URL");
  },
);
