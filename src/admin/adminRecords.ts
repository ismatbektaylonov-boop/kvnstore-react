import { orderStatuses, StoreOrder } from "../shared/contracts";
import { readAdminCollection } from "./adminApi";

export interface AdminCustomer {
  _id: string;
  memberNick: string;
  memberPhone: string;
  memberStatus: "ACTIVE" | "BLOCK" | "DELETE";
  memberImage?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberPoints?: number;
  createdAt?: string;
}
export interface AdminOrderRecord {
  _id: string;
  orderStatus: StoreOrder["orderStatus"];
  dateLabel: string;
  memberNick: string;
  memberPhone: string;
  shippingAddress: string;
  orderSubtotal: number;
  orderShippingFee: number;
  orderTotal: number;
  paymentMode?: "unpaid" | "demo";
  expiresAt?: string;
  paidAt?: string;
  refundedAmount?: number;
  items: {
    productName: string;
    productImage?: string;
    selection: string;
    quantity: number;
    lineTotal: number;
    unitPrice?: number;
  }[];
}
interface AdminOrderJson extends StoreOrder {
  memberId: { _id: string; memberNick: string; memberPhone: string } | null;
  orderItems: (StoreOrder["orderItems"][number] & { selectedColor?: string })[];
}
export function normalizeAdminOrders(
  orders: AdminOrderJson[],
): AdminOrderRecord[] {
  return orders.map((order) => ({
    _id: order._id,
    orderStatus: order.orderStatus,
    dateLabel: new Date(order.createdAt).toLocaleString(),
    memberNick: order.memberId?.memberNick || "Deleted member",
    memberPhone: order.memberId?.memberPhone || "Unavailable",
    shippingAddress: order.shippingAddress,
    orderSubtotal: order.orderSubtotal,
    orderShippingFee: order.orderShippingFee,
    orderTotal: order.orderTotal,
    paymentMode: order.paymentMode,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    refundedAmount: order.refundedAmount,
    items: order.orderItems.map((item) => ({
      productName: item.productName,
      productImage: item.productImage,
      selection: [item.selectedColor, item.selectedSize]
        .filter(Boolean)
        .join(" · "),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: (Math.round(item.unitPrice * 100) * item.quantity) / 100,
    })),
  }));
}
export function loadAdminOrders(
  path: string,
  signal: AbortSignal,
): Promise<AdminOrderRecord[]> {
  return readAdminCollection<AdminOrderJson, AdminOrderRecord>(
    path,
    signal,
    normalizeAdminOrders,
    parseAdminOrders,
  );
}
export function loadAdminCustomers(
  path: string,
  signal: AbortSignal,
): Promise<AdminCustomer[]> {
  return readAdminCollection<AdminCustomer, AdminCustomer>(
    path,
    signal,
    (items) => items,
    parseAdminCustomers,
  );
}
const fail = (): never => {
  throw new Error(
    "The administration records could not be read safely. Please use the original manager.",
  );
};
const text = (node: Element | null | undefined) =>
  node?.textContent?.trim() || "";
const dollars = (node: Element | null | undefined) => {
  const label = text(node);
  if (!/\$\d+(?:\.\d{1,2})?$/.test(label)) return fail();
  return Number(label.slice(label.lastIndexOf("$") + 1));
};

export function parseAdminCustomers(html: string): AdminCustomer[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(document.querySelectorAll(".users-table tbody tr"));
  if (!rows.length) {
    if (document.querySelector(".empty-users")) return [];
    return fail();
  }
  return rows.map((row) => {
    const select = row.querySelector<HTMLSelectElement>("select.member-status");
    const id = select?.id || "";
    const name = text(row.querySelector('[data-label="Username"] strong'));
    // EJS adds a display '+' before the stored phone; remove only that prefix.
    const displayedPhone = text(row.querySelector('[data-label="Phone"]'));
    if (
      !/^[a-f\d]{24}$/i.test(id) ||
      !name ||
      !select ||
      !["ACTIVE", "BLOCK", "DELETE"].includes(select.value) ||
      !displayedPhone.startsWith("+")
    )
      return fail();
    return {
      _id: id,
      memberNick: name,
      memberPhone: displayedPhone.slice(1),
      memberStatus: select.value as AdminCustomer["memberStatus"],
    };
  });
}
export function parseAdminOrders(html: string): AdminOrderRecord[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const cards = Array.from(
    document.querySelectorAll("article.order-card[data-order-id]"),
  );
  if (!cards.length) {
    if (document.querySelector(".empty-orders")) return [];
    return fail();
  }
  return cards.map((card) => {
    const id = card.getAttribute("data-order-id") || "";
    const status = text(card.querySelector("header .status"));
    const spans = card.querySelectorAll("footer>div>span");
    const items = Array.from(
      card.querySelectorAll(".order-items .order-item"),
    ).map((item) => {
      const label = text(item.querySelector("span"));
      const parts = label.split("·").map((value) => value.trim());
      const match = parts.pop()?.match(/^Qty (\d+)$/);
      const quantity = Number(match?.[1]);
      const name = text(item.querySelector("strong"));
      if (!Number.isInteger(quantity) || quantity < 1 || !name) return fail();
      return {
        productName: name,
        productImage:
          item.querySelector("img")?.getAttribute("src") || undefined,
        selection: parts.join(" · "),
        quantity,
        lineTotal: dollars(item.querySelector("b")),
      };
    });
    if (
      !/^[a-f\d]{24}$/i.test(id) ||
      !orderStatuses.includes(status as StoreOrder["orderStatus"]) ||
      !items.length ||
      !spans[1]
    )
      return fail();
    return {
      _id: id,
      orderStatus: status as StoreOrder["orderStatus"],
      dateLabel: text(card.querySelector("time")),
      memberNick: text(card.querySelector(".customer strong")),
      memberPhone: text(card.querySelector(".customer span")),
      shippingAddress: text(card.querySelector(".customer address")),
      orderSubtotal: dollars(spans[0]),
      orderShippingFee: dollars(spans[1]),
      orderTotal: dollars(card.querySelector("footer>div>strong")),
      items,
    };
  });
}
