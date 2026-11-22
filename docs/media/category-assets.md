# Supplied homepage category images

The five product cutouts supplied by the user are installed in `public/media/images/categories/` and mapped by `src/app/storefront/categoryImages.ts`. The previous ten category JPEGs have been removed from the project.

The original PNG files retain their pixels and transparency:

| Catalog collection | File                 | Supplied subject            |
| ------------------ | -------------------- | --------------------------- |
| CLOTHE             | clothing.png         | Gray Nike hoodie            |
| PANTS              | trousers.png         | Navy Nike cargo joggers     |
| HAT                | hats.png             | Navy Nike cap               |
| SHOES              | shoes.png            | Navy and white Nike sneaker |
| OTHERS             | other_essentials.png | Navy Beats headphones       |

All five PNGs are 1122 × 1402 with alpha transparency. Each is an editorial illustration for category navigation; the images do not create product records or claim current inventory. CSS adjusts display scale for their differing transparent margins without changing the files. Source checksums and byte sizes are recorded in `category-sources.json`. The cards link to the existing catalog filters, with keyboard focus and a responsive square-card layout.
