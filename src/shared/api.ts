import { serverApi } from "../lib/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
let csrf: Promise<string> | undefined;
export function clearCsrf() {
  csrf = undefined;
}
async function csrfToken(): Promise<string> {
  if (!csrf) {
    csrf = fetch(`${serverApi}/auth/csrf`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      if (!response.ok)
        throw new ApiError(
          response.status,
          "Unable to prepare a secure request. Please try again.",
        );
      const data = await response.json();
      if (typeof data.csrfToken !== "string")
        throw new Error("Invalid security response");
      return data.csrfToken;
    });
    csrf.catch(() => {
      csrf = undefined;
    });
  }
  return csrf;
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    key?: string;
    signal?: AbortSignal;
    suppressUnauthorized?: boolean;
  } = {},
): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") headers["X-CSRF-Token"] = await csrfToken();
  if (options.key) headers["Idempotency-Key"] = options.key;
  const multipart = options.body instanceof FormData;
  if (options.body !== undefined && !multipart)
    headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${serverApi}${path}`, {
      method,
      credentials: "include",
      headers,
      body:
        options.body === undefined
          ? undefined
          : multipart
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(
      0,
      "We couldn’t reach the store. Check your connection and try again.",
    );
  }
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(
      response.status,
      "The store returned an unexpected response. Please try again.",
    );
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 403 && /CSRF/i.test(data.message || "")) {
      clearCsrf();
      throw new ApiError(
        403,
        "Your secure session needs to be refreshed. Please try again.",
      );
    }
    if (
      response.status === 401 &&
      !path.startsWith("/admin/") &&
      !options.suppressUnauthorized &&
      !options.signal?.aborted
    )
      window.dispatchEvent(new Event("kvn:unauthorized"));
    throw new ApiError(
      response.status,
      data.message || "The request failed. Please try again.",
    );
  }
  return data as T;
}
export function mediaUrl(value?: string, avatar = false) {
  const fallback = avatar
    ? "/media/icons/default-user.svg"
    : "/media/icons/product-unavailable.svg";
  if (!value) return fallback;
  const normalized = value
    .replace(/\\/g, "/")
    .match(/(?:^|\/)uploads\/(products|members)\/([^/]+)$/);
  return normalized
    ? `${serverApi}/uploads/${normalized[1]}/${encodeURIComponent(normalized[2])}`
    : fallback;
}
export function pendingCheckout(memberId: string) {
  return sessionStorage.getItem(`kvn:checkout:${memberId}`);
}
export function checkoutKey(memberId: string) {
  // Retain a single operation key after ambiguous network failures and refreshes.
  const saved = pendingCheckout(memberId);
  if (saved) return saved;
  const browserCrypto = window.crypto as Crypto & { randomUUID?: () => string };
  const key =
    browserCrypto?.randomUUID?.() ||
    `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(`kvn:checkout:${memberId}`, key);
  return key;
}
export function finishCheckout(memberId?: string) {
  if (memberId) sessionStorage.removeItem(`kvn:checkout:${memberId}`);
}
