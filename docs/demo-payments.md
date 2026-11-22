# Demo payments

In local development, review your cart and select **Continue to demo payment**. Checkout reserves the saved cart using a stable operation key, then opens payment for that order. Existing unpaid reservations offer **Pay $… (demo)** directly on **Orders** and in their order details. Empty cart and checkout pages link back to orders so shoppers can resume payment after reserving a cart. The simulator at `/orders/:id/payment` offers:

- **Complete demo payment**: the backend records `PAID`, `paymentMode: demo` and `paidAt`, then shows the completed demo payment.
- **Simulate decline**: the reservation stays `PENDING`/`unpaid`, its stock stays reserved, and approval can be retried before expiry.
- **Return without paying**: returns to order details without a payment request or cancelling the reservation.

The screen adapts the older Coco demo form into the active Ocean Blue checkout: account name, payment reference, expiry note, and confirmation code. Example fictional values are `Test Shopper`, `DEMO-4242`, `12/30`, and `123`. All four values are required locally, discarded when leaving the payment screen, and never sent to the backend or saved in browser storage. Do not enter real payment details. The screen shows server-calculated USD totals and saved order details. No money is charged. Duplicate approval does not reserve stock again. Expired/cancelled orders cannot be paid. Authentication, CSRF, totals and order ownership remain enforced by `kvnstore`.

## Existing local store

The local frontend `.env.local` enables `REACT_APP_ENABLE_DEMO_PAYMENTS=true`, and the configured backend has `ENABLE_DEMO_PAYMENTS=true` outside production. Run `yarn start` normally after restarting to load the environment change. To enable the same flow explicitly on another development setup:

```sh
yarn start:demo
```

Alternatively, use `REACT_APP_ENABLE_DEMO_PAYMENTS=true yarn start`. Both frontend and backend disable demo payments in production regardless of these flags. This mode uses your configured development database. Use this mode only when you intend to place demo orders in your configured development database. The integration audit uses the disposable mode below instead.

## Disposable prefilled demo

To try a prefilled order without adding records to the development store, in `kvnstore`:

```sh
npm run build
npm run demo
```

Stop the regular backend and storefront first so ports 4003 and 3000 are free. This starts a temporary backend/database on `localhost:4003`, creates a fictional product and shopper, reserves a $101 order (two $48 pieces plus $5 delivery), and prints its checkout URL. In another terminal, from `kvnstore-react`:

```sh
BROWSER=none yarn start:demo
```

Open the printed checkout URL. Sign in as `Fictional shopper` with the disposable password `test-only-password`. Try decline, return without paying, reopen checkout, then approve. EJS Admin remains at `http://localhost:4003/admin/login`; its fixture nickname is `Fictional administrator` with the same disposable password. Paid demo orders can follow the normal processing → shipped → delivered workflow.

Stop both terminals with Ctrl-C to remove the temporary database and images. Restart the fixture for a fresh 30-minute reservation. This requires the cached MongoDB binary and installed dependencies in both projects, as documented in the READMEs. The existing `yarn verify:integration --browser` workflow still starts an empty manual-test store; `npm run demo` adds the prefilled order.

## API

`POST /order/:id/demo-pay` accepts `{ "outcome": "success" }` or `{ "outcome": "declined" }`. An empty body retains the original approval behavior. Extra fields, including client totals, are rejected. Approval returns the server order. Decline returns HTTP 402 and leaves the order unchanged. Invalid outcomes return 400; another customer's order returns 404; an expired/cancelled/already-advanced order returns 409. Repeating approval on an already demo-paid order returns that order without changing its payment timestamp.

Declines are simulated responses rather than a persisted provider transaction history. Real payment processing and refunds remain unimplemented.

## Automated end-to-end verification

Run `yarn verify:integration` after building the backend. In addition to API checks, the backend-owned harness renders the actual checkout/payment/admin/customer components in React DOM against a disposable database. It verifies decline/return/retry, the four-field form, single approval after a double click, server totals/stock, admin fulfillment and customer delivery history. No normal store records are changed.
