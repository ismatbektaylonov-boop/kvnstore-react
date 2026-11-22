export interface StoreMember {
  _id: string;
  memberType: "USER" | "ADMIN";
  memberStatus: "ACTIVE" | "BLOCK" | "DELETE";
  memberNick: string;
  memberPhone?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints?: number;
}
export interface StoreProduct {
  _id: string;
  productBrand?: string;
  productName: string;
  productCollection: string;
  productStatus: string;
  productPrice: number;
  productLeftCount: number;
  productSizes?: string[];
  productSize?: string;
  productShoeSize?: string;
  productDesc?: string;
  productImages: string[];
  productLikes: number;
  productViews: number;
  isLiked: boolean;
}
export interface StoreCart {
  items: {
    _id: string;
    productId: string;
    selectedSize: string;
    quantity: number;
    product: StoreProduct | null;
    unitPrice: number | null;
    lineTotal: number | null;
    available: boolean;
  }[];
  subtotal: number;
  currency: string;
  checkoutReady: boolean;
}
export const orderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export interface StoreOrder {
  _id: string;
  orderStatus: (typeof orderStatuses)[number];
  paymentMode: "unpaid" | "demo";
  expiresAt?: string;
  paidAt?: string;
  cancelReason?: "customer" | "expired";
  createdAt: string;
  orderSubtotal: number;
  orderShippingFee: number;
  orderTotal: number;
  refundedAmount?: number;
  shippingAddress: string;
  orderItems: {
    productId: string;
    productName: string;
    productImage?: string;
    selectedSize: string;
    quantity: number;
    unitPrice: number;
  }[];
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export const collections: Record<string, string> = {
  CLOTHE: "Clothing",
  PANTS: "Trousers",
  HAT: "Hats",
  SHOES: "Shoes",
  OTHERS: "Other essentials",
};
export const clothingSizes = ["S", "M", "L", "XL", "XXL", "XXXL", "ONESIZE"];
export const shoeSizes = Array.from({ length: 12 }, (_, index) =>
  String(index + 36),
);
export const sizesOf = (
  product: Pick<
    StoreProduct,
    "productSizes" | "productCollection" | "productShoeSize" | "productSize"
  >,
) =>
  product.productSizes?.length
    ? product.productSizes
    : ([
        product.productCollection === "SHOES"
          ? product.productShoeSize
          : product.productSize,
      ].filter(Boolean) as string[]);
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

export interface CommunityMember {
  key: string;
  memberNick: string;
  memberImage?: string;
  rank: number;
}
export interface ProductReview {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  memberNick: string;
  memberImage?: string;
  verifiedPurchase: boolean;
}
export interface OwnReview extends ProductReview {
  visibility: "published" | "hidden";
  deleted: boolean;
}
export interface ReviewPage extends Page<ProductReview> {
  averageRating: number | null;
}
export interface AdminReview extends OwnReview {
  productId: string;
  productName: string;
}
