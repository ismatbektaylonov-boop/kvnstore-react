import { adminLogin, adminLogout, readAdminCollection } from "./adminApi";
import { api, ApiError, clearCsrf } from "../shared/api";
const response = (
  data: unknown,
  status = 200,
  type = "application/json",
  extra: Partial<Response> = {},
) => ({
  ok: status < 400,
  status,
  headers: { get: () => type },
  json: async () => data,
  text: async () => String(data),
  ...extra,
});
const admin = {
  _id: "012345678901234567890123",
  memberNick: "Fictional administrator",
  memberType: "ADMIN",
  memberStatus: "ACTIVE",
};
beforeEach(() => {
  clearCsrf();
  global.fetch = jest.fn() as any;
});
test("prefers authenticated JSON data and does not invoke the legacy HTML parser", async () => {
  const legacy = jest.fn();
  const normalize = jest.fn((items) => items);
  (fetch as jest.Mock).mockResolvedValue(
    response({ items: [{ _id: "record" }] }),
  );
  const result = await readAdminCollection(
    "/admin/product/all",
    new AbortController().signal,
    normalize,
    legacy,
  );
  expect(result).toEqual([{ _id: "record" }]);
  expect(legacy).not.toHaveBeenCalled();
  expect((fetch as jest.Mock).mock.calls[0][1]).toMatchObject({
    credentials: "include",
    headers: { Accept: "application/json" },
  });
});
test("retains a narrow HTML compatibility path for older servers", async () => {
  const legacy = jest.fn(() => [{ _id: "legacy" }]);
  (fetch as jest.Mock).mockResolvedValue(
    response("<article>legacy</article>", 200, "text/html"),
  );
  expect(
    await readAdminCollection(
      "/admin/product/all",
      new AbortController().signal,
      (items) => items,
      legacy,
    ),
  ).toEqual([{ _id: "legacy" }]);
  expect(legacy).toHaveBeenCalledWith("<article>legacy</article>");
});
test("does not disguise unauthorized or malformed JSON as an empty list", async () => {
  const legacy = jest.fn();
  const mocked = fetch as jest.Mock;
  mocked
    .mockResolvedValueOnce(response({ message: "Admin login required" }, 401))
    .mockResolvedValueOnce(response({ items: null }));
  await expect(
    readAdminCollection(
      "/admin/user/all",
      new AbortController().signal,
      (items) => items,
      legacy,
    ),
  ).rejects.toEqual(new ApiError(401, "Admin login required"));
  await expect(
    readAdminCollection(
      "/admin/user/all",
      new AbortController().signal,
      (items) => items,
      legacy,
    ),
  ).rejects.toThrow("unexpected response");
  expect(legacy).not.toHaveBeenCalled();
});
test("uses JSON admin authentication and refreshes CSRF after session rotation", async () => {
  const mocked = fetch as jest.Mock;
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "old-session" }))
    .mockResolvedValueOnce(response({}));
  await api("/cart", { method: "DELETE" });
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "login-session" }))
    .mockResolvedValueOnce(response({ member: admin }));
  expect(
    await adminLogin("Fictional administrator", "test-only-password"),
  ).toEqual(admin);
  expect(mocked.mock.calls[3][1]).toMatchObject({
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json", "X-CSRF-Token": "login-session" },
    body: JSON.stringify({
      memberNick: "Fictional administrator",
      memberPassword: "test-only-password",
    }),
  });
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "rotated-session" }))
    .mockResolvedValueOnce(response({}));
  await api("/cart", { method: "DELETE" });
  expect(mocked.mock.calls[5][1].headers["X-CSRF-Token"]).toBe(
    "rotated-session",
  );
});
test("confirms legacy redirect login through the authenticated check endpoint", async () => {
  const mocked = fetch as jest.Mock;
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "test-csrf" }))
    .mockResolvedValueOnce(
      response("", 200, "text/html", {
        redirected: true,
        url: "http://localhost:4003/admin/product/all",
      }),
    )
    .mockResolvedValueOnce(response({ member: admin }));
  expect(
    await adminLogin("Fictional administrator", "test-only-password"),
  ).toEqual(admin);
  expect(mocked.mock.calls[2][0]).toMatch(/\/admin\/check$/);
});
test("accepts confirmed JSON logout and rejects a login-page redirect as authentication", async () => {
  const mocked = fetch as jest.Mock;
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "test-csrf" }))
    .mockResolvedValueOnce(response({ logout: true }));
  await expect(adminLogout()).resolves.toBeUndefined();
  mocked
    .mockResolvedValueOnce(response({ csrfToken: "new-csrf" }))
    .mockResolvedValueOnce(
      response("", 200, "text/html", {
        redirected: true,
        url: "http://localhost:4003/admin/login",
      }),
    );
  await expect(
    adminLogin("Fictional administrator", "test-only-password"),
  ).rejects.toThrow("could not be confirmed");
});
