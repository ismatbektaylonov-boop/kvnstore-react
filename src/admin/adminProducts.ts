import { ApiError } from "../shared/api";
import { StoreProduct, collections, sizesOf } from "../shared/contracts";
import { readAdminCollection } from "./adminApi";
import { serverApi } from "../lib/config";

export type AdminProduct = Omit<
  StoreProduct,
  "productLikes" | "productViews" | "isLiked"
>;

// Compatibility for older backends that expose the list only as EJS HTML.
// Read semantic cards as inert data; never insert the response into the document.
// Fail closed if the server markup changes instead of fabricating product data.
export function parseAdminProducts(html: string): AdminProduct[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const cards = Array.from(document.querySelectorAll("article.product-card"));
  if (!cards.length) {
    if (document.querySelector(".empty-catalog")) return [];
    throw new Error(
      "The product workspace could not be read. Open the original product manager or sign in again.",
    );
  }
  return cards.map((card) => {
    const control = card.querySelector<HTMLSelectElement>(
      "select.new-product-status[data-product-id]",
    );
    const id = control?.getAttribute("data-product-id") || "";
    const name =
      card.querySelector(".product-card-heading h2")?.textContent?.trim() || "";
    const visual = card.querySelector(".product-visual");
    const collection = Object.keys(collections).find((value) =>
      visual?.classList.contains(`product-visual--${value.toLowerCase()}`),
    );
    const metadata = card.querySelectorAll(".product-meta strong");
    const price = Number(
      card
        .querySelector(".product-price")
        ?.textContent?.trim()
        .replace(/^\$/, ""),
    );
    const stock = Number(metadata[1]?.textContent?.trim());
    if (
      !/^[a-f\d]{24}$/i.test(id) ||
      !name ||
      !collection ||
      !control ||
      !["PAUSE", "PROCESS", "DELETE"].includes(control.value) ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(stock) ||
      stock < 0 ||
      !metadata[1]
    ) {
      throw new Error(
        "A product record could not be read safely. Please use the original product manager.",
      );
    }
    return {
      _id: id,
      productName: name,
      productCollection: collection,
      productStatus: control.value,
      productPrice: price,
      productLeftCount: stock,
      productSizes: (metadata[0]?.textContent || "")
        .trim()
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value && value !== "Not set"),
      productDesc:
        card.querySelector(".product-description")?.textContent?.trim() || "",
      productImages: Array.from(
        card.querySelectorAll<HTMLImageElement>("img.product-cover-image"),
      )
        .map((image) => image.getAttribute("src") || "")
        .filter(Boolean),
    };
  });
}

export async function loadAdminProducts(
  signal: AbortSignal,
): Promise<AdminProduct[]> {
  return readAdminCollection<AdminProduct, AdminProduct>(
    "/admin/product/all",
    signal,
    (items) =>
      items.map((product) => ({ ...product, productSizes: sizesOf(product) })),
    parseAdminProducts,
  );
}

export async function readAdminHtml(
  path: string,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(`${serverApi}${path}`, {
    credentials: "include",
    headers: { Accept: "text/html" },
    signal,
  });
  if (new URL(response.url).pathname.endsWith("/admin/login"))
    throw new ApiError(
      401,
      "Your administrator session has expired. Sign in again to continue.",
    );
  if (!response.ok) {
    const data = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : null;
    throw new ApiError(
      response.status,
      data?.message || "Unable to load the administration workspace.",
    );
  }
  if (!response.headers.get("content-type")?.includes("text/html"))
    throw new Error(
      "The administration workspace returned an unexpected response.",
    );
  return response.text();
}
