# Payment navigation fix — 2026-11-10 (Asia/Seoul)

A live read-only diagnosis found the shopper's saved cart empty and an existing unpaid pending order. The storefront bundle already had demo payments enabled. Checkout had correctly moved the cart into an order, so the cart's Review order control was no longer available; payment remained inside the order details.

Orders now provides a prominent **Pay $… (demo)** action for each unexpired pending reservation. Order details place the same primary action before cancellation controls. Empty cart and checkout views link to **View orders and payments**. Existing paid, expired, disabled-demo and production cases omit the payment action. No actual order or inventory record was changed by this fix.

Regression coverage adds direct history-to-payment navigation, all four hidden-action cases, and empty-cart-to-unpaid-order recovery. The actual React/backend integration journey now resumes payment through the new Orders action after declining and returning unpaid. Validation passed: 12 frontend suites / 62 tests, typecheck, lint, both builds, interface boundaries, and `yarn verify:integration`.

# Demo payment end-to-end verification — 2026-11-10 (Asia/Seoul)

The backend-owned integration harness now mounts the actual React components in an isolated React DOM environment and sends their real requests through the shared client to a disposable Express/MongoDB backend. This adds rendered UI integration coverage to the existing API/client checks; it does not claim native Chrome verification.

The complete journey passed: saved cart → checkout → Coco-style demo form → decline → return unpaid → reopen payment → required-field validation → double-click approval producing one payment request/order → server-confirmed `PAID`/`demo` → the same order in React admin → all three fulfillment transitions → delivered status in the customer's rendered history and order details. The test verifies the $53 server total, a single stock decrement, and that only simulated outcomes are transmitted. Form values never reach requests, localStorage, or sessionStorage.

The new helper is `kvnstore/scripts/verify-react-payment.cjs`, called automatically by the existing `yarn verify:integration` launcher. It compiles the active frontend sources, uses their actual providers/hooks/router/forms and admin controls, and restores all temporary DOM globals on completion. It does not install packages or add runtime server code to either frontend.

Native Chrome reached the protected test checkout, but the browser was actively in use and switched away during sign-in. Its temporary test tab was closed without changing the user's other tabs. The temporary browser backend/storefront/admin servers and their database/uploads were stopped and removed. The normal backend at localhost:4003 and storefront at localhost:3000 remain running with demo payments enabled.

# Demo checkout follow-up — 2026-11-10 (Asia/Seoul)

The existing backend demo endpoint and payment screen were reused. The configured backend already enables demo payments in development; `.env.local` now enables the corresponding storefront flag. `yarn start` was restarted on port 3000 to load it. Checkout now offers **Continue to demo payment**, reserves the server cart with the same stable checkout operation key, then opens `/orders/:id/payment` only when the returned order is still `PENDING`. Replayed paid or advanced orders open their details. Existing pending orders retain their payment link, and help text describes the enabled demo flow. Server prices/totals, ownership, expiry, CSRF, decline/retry, duplicate approval handling, and production guards are retained. No real money or card details are collected.

Validation: 12 frontend suites / 56 tests, typecheck, storefront build, admin build, interface boundaries, and the disposable actual-client integration harness passed. The retry regression now covers both enabled and disabled demo checkout and confirms that opening payment does not automatically submit payment. Native browser verification was not completed: Chrome changed to a user-driven Zoom task during setup, so automation stopped without further browser actions. The disposable prefilled test order/backend was not used for a user purchase.

The earlier Coco implementation was found in `src/app/components/payment/PaymentDetailsForm.tsx` and the inactive orders screen. Its four-field demo form was adapted into the active payment page with existing Ocean Blue controls. The obsolete customer-declared `PAID` update and saved payment metadata were not reused. The active form sends only `{outcome:"success"}` to the existing server-authorized demo endpoint. Tests verify required fields, no form values in API requests or browser storage, duplicate-click protection, decline/retry, and ambiguous-result reconciliation.

# Integration audit — 2026-11-10 (Asia/Seoul)

This audit supersedes older browser claims below for the current pass.

The active entry points are `src/index.tsx` → `src/app/App.tsx` → `src/app/storefront` for customers and `src/index.tsx` → `src/admin/App.tsx` for administration, selected at build time by `scripts/interface.cjs`. Legacy `src/app/components/auth` and older services are inactive. The backend remains the existing Express/TypeScript/MongoDB application; `/admin/*` retains EJS plus negotiated JSON for React. No runtime backend/business-rule changes were needed.

Local public configuration now explicitly shares `REACT_APP_API_URL=http://localhost:4003`, links customers to `REACT_APP_ADMIN_URL=http://localhost:3002/administration`, and links administration back to `REACT_APP_STOREFRONT_URL=http://localhost:3000`. The fallback and `.env.example` agree. EJS remains at `http://localhost:4003/admin`, including `/admin/user/all`. The configured backend's existing allowlist already includes both exact React origins, verified with successful credentialed POST preflight responses; other allowed origins and private backend settings were preserved.

The normal backend returned readiness 200 and `{items:[],total:0,page:1,limit:9}` from `/product/all?includeMeta=true`. There is no published inventory to display. No fictional merchandise fallback was found in the active apps: empty responses render the existing empty states. Marketing media is separate from uploaded product images. Actual inventory must be created/published as `PROCESS` in administration. All test merchandise belongs to disposable databases and uploads.

The backend-owned integration harness was extended to check an initially empty catalog, CORS for both React origins, exact public product ID/image/price/size/stock agreement, publicly visible price/stock edits, hidden details (404) and catalog exclusion after pause/archive, literal search, meaningful two-product sorting/filtering/pagination, and denial of every protected management read/mutation after the independent admin session is removed while the shopper remains signed in. Existing signup/login/logout, profile/avatar, likes, saved-cart persistence, stable checkout replay and server totals, demo decline/approval, and fulfillment coverage remains in place. Browser mode now defaults to the requested ports 4003/3000/3002; optional `KVN_BROWSER_*` overrides are printed in its startup instructions.

Current checks passed:

| Command | Result |
| --- | --- |
| Backend `npm test` | 27 tests passed; backend build passed |
| `yarn typecheck` | Passed |
| `CI=true yarn test --watchAll=false --runInBand` | 12 suites, 54 tests passed |
| `CI=true yarn build` | Passed |
| `CI=true yarn build:admin` | Passed |
| `yarn verify:boundaries` | Both interfaces passed |
| `yarn verify:integration` | Expanded disposable actual-client workflow passed |

The disposable browser backend and demo storefront were stopped; its temporary database, uploads and image fixtures were removed. The normal backend was restored with `npm run start:dev`, storefront with `yarn start`, and separate admin remains running with `yarn start:admin`. HTTP checks confirmed readiness and all three ports. Anonymous `/admin/user/all` redirects to the original `/admin/login` as expected.

Current browser verification is **incomplete**. Native Chrome rendered the separate React admin on port 3002, confirmed JSON-backed administrator login/session restoration, displayed the original EJS link, and accepted the product metadata and published status in the actual creation form. The native file chooser then became unreliable, followed by persistent ScreenCaptureKit errors (`-3811`, CUA `-10005`) even after reconnect/reset. The browser host also reports unavailable. Publication through the browser, storefront reload/edit/pause checks, and the browser shopping/fulfillment journey were therefore not completed in this pass. The automated actual-client integration checks passed; they are not a substitute for claiming that browser journey passed. Older browser records below describe previous work only.

## Earlier verification records

| Check                                            | Result                                                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn typecheck`                                 | Passed                                                                                                                                                      |
| `yarn lint`                                      | Passed with zero warnings in active frontend files                                                                                                          |
| `CI=true yarn test --watchAll=false --runInBand` | Passed: 12 suites, 54 tests                                                                                                                                 |
| `CI=true yarn build`                             | Passed; production output in `build/`                                                                                                                       |
| `CI=true yarn build:admin`                       | Passed; separate production output in `build-admin/`                                                                                                        |
| `yarn verify:boundaries`                         | Passed: storefront excludes Admin code; Admin excludes customer screens/state; neither includes server implementation dependencies                          |
| Backend `npm test` from `../kvnstore`            | Passed: 27 tests                                                                                                                                            |
| `node scripts/verify-backend-integration.cjs`    | Passed against a fresh temporary backend/database                                                                                                           |
| Live backend admin response                      | New `Vary: Accept` and `Cache-Control: no-store` headers present; unauthenticated JSON requests correctly return 401                                        |
| Live cross-origin POST preflight                 | HTTP 204; exact localhost frontend origin, credentials, Content-Type, CSRF, and Idempotency-Key allowed                                                     |
| Native Chrome desktop                            | Catalog loaded without CORS errors; expected empty catalog state                                                                                            |
| Native Chrome mobile, 390px                      | Catalog layout, navigation menu, and account sign-in guard inspected successfully                                                                           |
| Native Chrome authenticated shopping flow        | Passed against an isolated backend: product publication, saved address, persistent cart addition, reservation, demo payment and all fulfillment transitions |

## Demo checkout

The new `/orders/:id/payment` screen shows the backend order total and offers approval, decline/retry and return without paying. No card or bank fields exist. Seven frontend regressions cover totals, double-click suppression, decline/retry, returning unpaid, expiry, ambiguous response reconciliation and disabled/production guards. The backend regression verifies decline preserves unpaid status and reserved stock, rejects client totals/invalid outcomes/other customers, and records approval once with a stable timestamp. The full isolated integration runner also executes decline followed by approval and fulfillment.

Native Chrome verified the prepared $101 fixture: sign-in guard → demo checkout → decline message → return to a still-unpaid pending order → reopen checkout → approval → server-confirmed PAID/demo completion with no-charge messaging. The temporary tab, servers, database and fixtures were removed. The existing development backend demo flag was enabled and its frontend restarted with `yarn start:demo`; the fresh watcher cleared its stale type-checker overlay. No store records were added to the existing database. Both production builds and interface boundaries passed; real payments remain outside this implementation. See [demo setup](demo-payments.md).

## Architecture separation

See [the architecture inspection and implementation](architecture.md). The original EJS Admin remains in the backend without view/controller changes. The existing React Admin was moved from the customer route tree to `src/admin`, with its own build-time entry, layout and provider. `src/shared` contains browser-only transport, response contracts, display components and form feedback. The storefront's Admin links default to EJS. Legacy customer `/administration/*` URLs link to the separate interface. The isolated server/database lifecycle moved into `kvnstore/scripts/verify-frontend-integration.cjs`; the frontend script only launches it.

The backend already owned authentication, authorization, validation and business rules; no duplicate runtime backend was found in the customer project. Its older inactive services are HTTP clients and were retained. The cart race fix, checkout retry behavior and all earlier unrelated UI functionality remain covered.

New frontend regressions cover the separate React Admin session entry/workspace, rejected customer credentials, all five legacy Admin links, configurable interface destinations, and rejection of credentials/query values in public API URLs. Backend regressions exercise anonymous and customer-authenticated requests to every protected admin read and mutation, plus credentialed CORS preflight from port 3002. Existing tests still check blocked administrator sessions, CSRF/session rotation, EJS forms and the complete stock/order workflow.

Native Chrome checks after separation used an isolated backend and two separate React development servers. EJS administrator sign-in opened the original product list and creation form. React Admin rendered its own workspace without customer navigation/cart and recognized the same backend administrator session. Administrator logout restored its login screen. The customer storefront separately signed in and saved a delivery address; the catalog rendered its expected empty state. A legacy storefront orders-management URL linked to the protected EJS page, which redirected the signed-in customer to Admin login. React Admin rejected that customer's credentials. Both temporary tabs were closed and the test servers/database/images removed. The existing main development storefront was also reloaded successfully after refreshing the TypeScript watcher configuration cache.

The explicit local backend CORS list was extended with only `http://localhost:3002`, retaining all existing origins and secret settings; defaults and `.env.example` also include the separate Admin origin. Production HTTPS/cross-site cookie behavior and real payment processing were not exercised. Full product/cart/order/demo fulfillment behavior was rerun through the actual shared frontend client against the isolated backend after the move; the complete browser shopping flow described below predates the separation.

## Shopping flow and cart race

The active storefront now waits for the saved server cart before enabling additions, quantity edits or a new reservation. A failed cart load keeps those actions blocked and offers a retry. Each cart read has a revision; a newer refresh or mutation invalidates older reads, including their error responses. This prevents an early Add to cart from replacing a saved quantity and prevents late reads from restoring stale cart data.

Six new regressions cover a deferred initial cart with three saved pieces becoming four after addition, cart-load failure/retry, size selection and stock across saved sizes, late successful/failed reads after a mutation, and out-of-order refreshes. Existing logout protection and checkout retry tests still pass.

The integration runner now explicitly checks two uploaded product images, publication as `PROCESS`, sizes M/L, price and stock, shopper sign-out/sign-in, address saving and persistence, cart quantities across another sign-in, stock reservation and `PAID` metadata. Both shopper and administrator reads verify every fulfillment transition.

Before the interface separation, the same journey was completed through native Chrome using a development frontend at `127.0.0.1:3001` and a disposable backend/database at `127.0.0.1:4015`:

1. Signed into Administration and published Fictional Coastal Shirt with two PNG fixtures, sizes M/L, a $48 price, stock of 10 and status `PROCESS`.
2. Signed in as the fictional shopper, saved `123 Fictional Lane, Test City`, selected M, and added one piece. Reloaded the product page and added another; the cart correctly showed quantity 2 and a $96 subtotal.
3. Reviewed the saved address, reserved the order for $101 ($96 plus $5 delivery), and verified an empty cart and unpaid `PENDING` order.
4. Used the development-only demo payment control and verified `PAID` with the explicit no-charge message.
5. Confirmed `PROCESSING`, `SHIPPED` and `DELIVERED` in Administration, then opened customer history and details to verify delivery, size M, quantity 2, address and the $101 total.

The browser test servers were stopped and their temporary database, uploads and image fixtures removed. The main development store was not modified. Reproduce with the runner's `--browser` option documented in the README.

## Integration work completed

The backend now negotiates administrator responses: JSON list requests return `{items}`, JSON login returns `{member}`, and JSON logout returns `{logout:true}`. Original HTML pages/forms and their redirects remain available. Existing active ADMIN-session authorization, CSRF checks, session rotation, field filtering, and mutation rules are retained. Admin responses are non-cacheable and vary on Accept.

The React frontend prefers JSON, and no longer depends on EJS structure when connected to the updated backend. An inert HTML reader remains only for older-server compatibility. Customer profile fields and order payment/expiry dates, recorded refund amounts, and exact unit prices are available from JSON. The existing Ocean Blue controls display those actual fields without introducing payment/refund operations.

The running development environment's explicit CORS allowlist omitted `http://localhost:3000`. That exact origin was added while preserving existing origins, environment settings, and credentials. The watcher picked up the change. No secret values or environment-file contents were printed or sent to Stitch.

Native browser inspection also found a development error overlay for the Crypto.randomUUID type. The optional browser capability now has an explicit compatible type, and the overlay disappeared after hot reload.

## Meaningful coverage

Frontend tests cover server-authoritative authentication, registration fields, token-storage avoidance, checkout retries, saved-cart loading/failure/retry and quantity preservation, stale cart response ordering, late cart responses after logout, CSRF/cookie handling, image paths, JSON administration reads without HTML parsing, older-server HTML compatibility, malformed/unauthorized responses, JSON login/logout and rotated CSRF, legacy login verification, media behavior and delivery calculations.

The end-to-end check executes actual frontend request code and admin loaders against compiled backend code and an isolated MongoDB replica set. It checks JSON administrator authentication, products/customers/orders, rich profile/payment metadata, legacy HTML compatibility, full product edits/uploads, customer blocking/reactivation, signup/profile/avatar, likes, cart, checkout/replay/server totals, order reads, demo payment, fulfillment, and logout. It replaces DOMParser with a throwing implementation to prove updated admin collection loads do not use HTML parsing. Fixtures and temporary database are removed afterward.

Backend regressions check JSON/HTML negotiation, unauthorized shoppers, blocked administrators, private-field exclusion, media normalization, cache/representation headers, session regeneration and CSRF rotation, plus the existing stock/order/upload/security workflows.

## Browser scope and remaining limits

The browser-host extension still reports unavailable, but native Chrome automation worked on this pass. Desktop catalog, 390px mobile catalog/menu, and signed-out account protection were inspected. The temporary verification tab was closed and the desktop viewport restored.

Authenticated administration, product publication, checkout, demo payment and fulfillment were exercised through native Chrome against the isolated test environment as described above, as well as through the automated integration runner. The main development catalog was not populated by these checks. No real payment was collected.

Production payment, refund mutations, recovery, reviews, coupons, wishlists, tracking, tax calculation and product image replacement remain outside the implemented backend. Business rules were not weakened to fabricate those features. No deployment or push was performed.

The original Stitch generation still consists of the 12 verified artifacts in `stitch-screens.json`. Its earlier HTML-only admin constraints are historical; the later negotiated JSON integration resolves those particular response gaps.
