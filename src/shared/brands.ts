export const brands = {
  NIKE: { name: "Nike", asset: "nike" },
  ADIDAS: { name: "adidas", asset: "adidas" },
  NEW_BALANCE: { name: "New Balance", asset: "new-balance" },
  ZARA: { name: "Zara", asset: "zara" },
} as const;
export type ProductBrand = keyof typeof brands;
export function brandName(value: string): string {
  return Object.prototype.hasOwnProperty.call(brands, value)
    ? brands[value as ProductBrand].name
    : "";
}
