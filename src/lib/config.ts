function publicUrl(value: string, name: string): string {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must be an HTTP(S) URL without credentials, query or fragment`,
    );
  }
  return url.toString().replace(/\/+$/, "");
}

export const serverApi = publicUrl(
  process.env.REACT_APP_API_URL || "http://localhost:4003",
  "REACT_APP_API_URL",
);
export const storefrontUrl = publicUrl(
  process.env.REACT_APP_STOREFRONT_URL || "http://localhost:3000",
  "REACT_APP_STOREFRONT_URL",
);
export const demoPaymentsEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.REACT_APP_ENABLE_DEMO_PAYMENTS === "true";
// Both React interfaces share the API; the original EJS admin remains at /admin.
export const adminUrl = publicUrl(
  process.env.REACT_APP_ADMIN_URL || "http://localhost:3002/administration",
  "REACT_APP_ADMIN_URL",
);
export function adminDestination(path: string): string {
  const suffix = path.replace(/^\/administration/, "");
  if (!new URL(adminUrl).pathname.endsWith("/admin"))
    return `${adminUrl}${suffix}`;
  const pages: Record<string, string> = {
    "/create": "/product/all",
    "/products": "/product/all",
    "/orders": "/order/all",
    "/customers": "/user/all",
  };
  return `${adminUrl}${pages[suffix] || ""}`;
}

export const Messages = {
  error1: "Something went wrong!",
  error2: "Please login first!",
  error3: "Please fulfil all the required fields!",
  error4: "Message is empty!",
  error5: "Only images in jpeg, jpg, png formats are allowed!",
};
