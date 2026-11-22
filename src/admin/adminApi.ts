import { serverApi } from "../lib/config";
import { api, ApiError, clearCsrf } from "../shared/api";
import { StoreMember } from "../shared/contracts";

async function adminFetch(
  path: string,
  options: RequestInit,
): Promise<Response> {
  try {
    return await fetch(`${serverApi}${path}`, {
      ...options,
      credentials: "include",
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "We couldn’t reach the store. Please try again.");
  }
}
async function jsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const csrf = response.status === 403 && /CSRF/i.test(data.message || "");
    if (csrf) clearCsrf();
    throw new ApiError(
      response.status,
      csrf
        ? "Your secure session needs to be refreshed. Please try again."
        : data.message ||
          "The administration request failed. Please try again.",
    );
  }
  return data;
}

// Updated backends provide JSON. Keep the existing inert readers as a narrow
// compatibility path for a server that has not yet been restarted/upgraded.
export async function readAdminCollection<Raw, Item>(
  path: string,
  signal: AbortSignal,
  normalize: (items: Raw[]) => Item[],
  legacy: (html: string) => Item[],
): Promise<Item[]> {
  const response = await adminFetch(path, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (response.headers.get("content-type")?.includes("application/json")) {
    const data = await jsonResponse(response);
    if (!Array.isArray(data.items))
      throw new ApiError(
        502,
        "The administration workspace returned an unexpected response.",
      );
    return normalize(data.items);
  }
  if (
    response.redirected &&
    new URL(response.url).pathname.endsWith("/admin/login")
  )
    throw new ApiError(
      401,
      "Your administrator session has expired. Sign in again to continue.",
    );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    throw new ApiError(
      response.status,
      "Unable to load the administration workspace. Please try again.",
    );
  return legacy(await response.text());
}

async function sessionRequest(
  path: "/admin/login" | "/admin/logout",
  body: unknown,
) {
  const { csrfToken } = await api<{ csrfToken: string }>("/auth/csrf");
  const response = await adminFetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(body),
  });
  if (response.headers.get("content-type")?.includes("application/json"))
    return jsonResponse(response);
  const expected = path === "/admin/login" ? "/admin/product/all" : "/admin";
  if (
    !response.ok ||
    !response.redirected ||
    new URL(response.url).pathname !== expected
  )
    throw new ApiError(
      response.status,
      "The administrator session could not be confirmed. Please try again.",
    );
  if (path === "/admin/login")
    return api<{ member: StoreMember }>("/admin/check");
  return { logout: true };
}
export async function adminLogin(
  memberNick: string,
  memberPassword: string,
): Promise<StoreMember> {
  const data = await sessionRequest("/admin/login", {
    memberNick,
    memberPassword,
  });
  if (
    data.member?.memberType !== "ADMIN" ||
    data.member?.memberStatus !== "ACTIVE"
  )
    throw new ApiError(403, "Administrator access is required.");
  clearCsrf();
  return data.member;
}
export async function adminLogout(): Promise<void> {
  const data = await sessionRequest("/admin/logout", {});
  if (data.logout !== true)
    throw new ApiError(
      502,
      "Sign out could not be confirmed. Please try again.",
    );
  clearCsrf();
}

// Shares credentialed JSON requests and session-bound CSRF with the existing admin actions.
export const adminRequest = api;
