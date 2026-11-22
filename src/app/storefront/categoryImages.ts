export interface CategoryImage {
  src: string;
  width: number;
  height: number;
  srcSet?: string;
}

// Use the supplied originals without changing their pixels or transparency.
export const categoryImages: Record<
  "CLOTHE" | "PANTS" | "HAT" | "SHOES" | "OTHERS",
  CategoryImage
> = {
  CLOTHE: {
    src: "/media/images/categories/clothing.png",
    width: 1122,
    height: 1402,
  },
  PANTS: {
    src: "/media/images/categories/trousers.png",
    width: 1122,
    height: 1402,
  },
  HAT: {
    src: "/media/images/categories/hats.png",
    width: 1122,
    height: 1402,
  },
  SHOES: {
    src: "/media/images/categories/shoes.png",
    width: 1122,
    height: 1402,
  },
  OTHERS: {
    src: "/media/images/categories/other_essentials.png",
    width: 1122,
    height: 1402,
  },
};
