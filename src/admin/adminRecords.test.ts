import { parseAdminCustomers, parseAdminOrders } from "./adminRecords";
const customer = `<table class="users-table"><tbody><tr><td data-label="Username"><strong>Fictional shopper</strong></td><td data-label="Phone">++fictional-phone</td><td><select class="member-status" id="012345678901234567890123"><option value="ACTIVE" selected>Active</option></select></td></tr></tbody></table>`;
const order = `<article class="order-card" data-order-id="112345678901234567890123"><header><time>09 November 2026</time><span class="status">PAID</span></header><section class="customer"><div><strong>Fictional shopper</strong><span>fictional-phone</span></div><address>123 Fictional Lane</address></section><div class="order-items"><div class="order-item"><img src="/uploads/products/fixture.png"><div><strong>Fictional Shirt</strong><span>M · Qty 2</span></div><b>$96.00</b></div></div><footer><div><span>Subtotal $96.00</span><span>Delivery $5.00</span><strong>Total $101.00</strong></div></footer></article>`;
test("reads only exposed customer fields, preserving the stored phone prefix", () => {
  expect(parseAdminCustomers(customer)).toEqual([
    {
      _id: "012345678901234567890123",
      memberNick: "Fictional shopper",
      memberPhone: "+fictional-phone",
      memberStatus: "ACTIVE",
    },
  ]);
  expect(
    parseAdminCustomers('<section class="empty-users"></section>'),
  ).toEqual([]);
});
test("reads real order snapshots, quantities, selection labels and server totals", () => {
  const parsed = parseAdminOrders(order)[0];
  expect(parsed.orderStatus).toBe("PAID");
  expect(parsed.orderTotal).toBe(101);
  expect(parsed.orderShippingFee).toBe(5);
  expect(parsed.items[0]).toEqual({
    productName: "Fictional Shirt",
    productImage: "/uploads/products/fixture.png",
    selection: "M",
    quantity: 2,
    lineTotal: 96,
  });
  expect(parseAdminOrders('<section class="empty-orders"></section>')).toEqual(
    [],
  );
});
test("fails safely on incompatible HTML, invalid status, or missing item quantity", () => {
  expect(() => parseAdminCustomers("<form>Sign in</form>")).toThrow(
    "could not be read safely",
  );
  expect(() => parseAdminOrders(order.replace("PAID", "UNKNOWN"))).toThrow(
    "could not be read safely",
  );
  expect(() =>
    parseAdminOrders(order.replace("Qty 2", "Quantity missing")),
  ).toThrow("could not be read safely");
});
