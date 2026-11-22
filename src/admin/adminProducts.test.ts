import { parseAdminProducts } from "./adminProducts";
const html = `<article class="product-card"><div class="product-visual product-visual--clothe"><img class="product-cover-image" src="/uploads/products/fictional.png"></div><div class="product-card-heading"><h2>Fictional &amp; Shirt</h2><span class="product-price">$48</span></div><div class="product-meta"><span>Sizes<strong>M, L</strong></span><span>In stock<strong>10</strong></span></div><p class="product-description">A test description.</p><select class="new-product-status" data-product-id="012345678901234567890123"><option value="PAUSE" selected>Paused</option></select></article>`;
test("reads the existing HTML card contract without executing or injecting scripts", () => {
  (window as any).injected = undefined;
  const products = parseAdminProducts(
    html + "<script>window.injected=true</script>",
  );
  expect(products).toEqual([
    {
      _id: "012345678901234567890123",
      productName: "Fictional & Shirt",
      productCollection: "CLOTHE",
      productStatus: "PAUSE",
      productPrice: 48,
      productLeftCount: 10,
      productSizes: ["M", "L"],
      productDesc: "A test description.",
      productImages: ["/uploads/products/fictional.png"],
    },
  ]);
  expect((window as any).injected).toBeUndefined();
});
test("distinguishes an empty catalog from login or incompatible HTML", () => {
  expect(
    parseAdminProducts('<section class="empty-catalog"></section>'),
  ).toEqual([]);
  expect(() => parseAdminProducts("<form>Login</form>")).toThrow(
    "could not be read",
  );
  expect(() =>
    parseAdminProducts(
      html.replace("In stock<strong>10", "In stock<strong>invalid"),
    ),
  ).toThrow("could not be read safely");
});
