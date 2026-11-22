import { api, ApiError, clearCsrf, mediaUrl } from "./api";
const response = (data: unknown, status = 200, type = "application/json") => ({
  ok: status < 400,
  status,
  headers: { get: () => type },
  json: async () => data,
});
beforeEach(() => {
  clearCsrf();
  global.fetch = jest.fn() as any;
});
test("gets CSRF once and includes cookies, request body, and idempotency key", async () => {
  const mocked = global.fetch as jest.Mock;
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "fictional-csrf" }))
    .mockResolvedValue(response({ ok: true }));
  await api("/cart/checkout", {
    method: "POST",
    body: {},
    key: "fictional-operation-123",
  });
  expect(mocked.mock.calls[0][0]).toMatch(/\/auth\/csrf$/);
  expect(mocked.mock.calls[1][1]).toMatchObject({
    credentials: "include",
    method: "POST",
    body: "{}",
    headers: {
      "X-CSRF-Token": "fictional-csrf",
      "Idempotency-Key": "fictional-operation-123",
    },
  });
  await api("/cart", { method: "DELETE" });
  expect(mocked).toHaveBeenCalledTimes(3);
});
test("retains server error messages and refuses to parse HTML as an API response", async () => {
  const mocked = global.fetch as jest.Mock;
  mocked.mockResolvedValueOnce(
    response({ message: "Only pending orders can be cancelled" }, 409),
  );
  await expect(api("/order/example")).rejects.toEqual(
    new ApiError(409, "Only pending orders can be cancelled"),
  );
  mocked.mockResolvedValueOnce(response({}, 200, "text/html"));
  await expect(api("/admin/product/all")).rejects.toThrow(
    "unexpected response",
  );
});
test("resolves only backend upload paths and uses safe image fallbacks", () => {
  expect(mediaUrl("C:\\old\\uploads\\products\\example.png")).toMatch(
    /\/uploads\/products\/example.png$/,
  );
  expect(mediaUrl("https://untrusted.example/tracker")).toBe(
    "/media/icons/product-unavailable.svg",
  );
  expect(mediaUrl(undefined, true)).toBe("/media/icons/default-user.svg");
});
