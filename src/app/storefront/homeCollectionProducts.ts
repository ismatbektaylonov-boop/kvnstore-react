// Merchandising selection from the six outfit products supplied in the reference.
// Images, visibility and stock are resolved from the API rather than copied here.
export const homeCollectionProducts = [
  { id: "6af89fc2b94f5aa7ac62511f", tone: "light neutral set" },
  { id: "6af89f62b94f5aa7ac625110", tone: "black contrast set" },
  { id: "6af88f06b94f5aa7ac624fb0", tone: "black set" },
  { id: "6af88d0cb94f5aa7ac624f1b", tone: "light grey set" },
  { id: "6af5839fe7557f91e2b1da4c", tone: "black set" },
  { id: "6af5812ce7557f91e2b1d9dd", tone: "grey set" },
] as const;

export const homeCollectionsPath = `/product/cards?ids=${homeCollectionProducts.map((product) => product.id).join(",")}`;
