# Stitch design inventory

Project: [KVN Store — Frontend](https://stitch.withgoogle.com/projects/9161330918000596241).

These **12 current native artifacts** were returned with usable screen IDs and their HTML was retrieved and inspected. Combined workflow boards include separate form/tab/state panels, rather than one artifact per route. Earlier drafts and timed-out, unresolvable batches are superseded and are not counted here. Screens use the reusable Ocean Blue components, desktop/mobile adaptation, and separate loading, empty, success, validation, authentication, conflict, and failure specimens.

| Current artifact                                        | Layout                          | Stitch screen ID                   |
| ------------------------------------------------------- | ------------------------------- | ---------------------------------- |
| 01 Home — KVN Store                                     | Desktop                         | `dbd0dce56d8a4898b208cd1c5d6f3f95` |
| 02 Catalog — KVN Store                                  | Desktop                         | `979e79d7791b4fe9addcabbaf6506b2b` |
| 03 Product Detail — KVN Store                           | Desktop                         | `d401695144514ee8a94ca6ff5c9653b2` |
| Administration Workspace — Desktop & Mobile — KVN Store | Desktop + 390px mobile specimen | `c538ee0ee7d34e88ac02fbfdbf397ff4` |
| Customer Account Workspace — KVN Store                  | Desktop                         | `8122be42ecea48809da8f9a0c227c84a` |
| Purchasing Workspace — KVN Store                        | Desktop                         | `4a949f2077064e33978d9c8c82140eca` |
| M01 Home — KVN Store                                    | Mobile 390px                    | `ad1aaeb7065e479c80b5d95133c18823` |
| M02 Catalog — KVN Store                                 | Mobile 390px                    | `beaed78f3f63438c8df1e45f61ed8d14` |
| M03 Product Detail — KVN Store                          | Mobile 390px                    | `3da484bae76b45c9b0230bec0f26f538` |
| M04 Customer Auth & Profile — KVN Store                 | Mobile 390px                    | `a65bb363b5914369a7fd3b977aaff202` |
| M05 Cart & Checkout — KVN Store                         | Mobile 390px                    | `5ea6e9cb2fc6470184a81883953ada30` |
| M06 Orders & Reservation — KVN Store                    | Mobile 390px                    | `bd670cfbb3ef4d68889b84ab1439e378` |

## Workflow coverage

- Home, collections, newest products, public shopper rankings.
- Catalog search, single collection/size filtering, supported sorting, pagination.
- Product gallery, global stock, valid sizes, quantity, like toggle, authenticated cart action.
- Customer login/registration, profile/address/description/password editing, avatar upload.
- Cart quantities/removal/clear, unavailable lines; checkout saved address and authoritative totals; unpaid reservation confirmation and expiry.
- Own order history/status filtering, snapshots, pending-only cancellation, optional nonproduction demo payment specimen.
- Separate administrator login, products list/create/edit/status/upload, order fulfillment, customer status management; desktop and 390px mobile drawer/cards/form adaptation.

The account board contains sign-in, registration, and profile panels. The purchasing board contains cart, checkout, reservation confirmation, history/details, and edge states. The administration board contains sign-in, product list/create/edit, fulfillment, customers, edge states, and the mobile adaptation. The JSON inventory provides exact HTML/screenshot resource names for retrieval through Stitch MCP.

## Inspection and corrections

The repository implementation was supplied as [a self-contained sanitized brief](stitch-backend-brief.md), with fictional samples only. Generated HTML and representative desktop/mobile screenshots were retrieved through Stitch MCP. Unsupported rewards tiers, return/recovery/restock features, shipping promises, per-size inventory, invalid numeric apparel sizes, and customer-facing diagnostics were corrected. Final account/admin footers were explicitly replaced; sample financial totals and size enums were corrected. The application uses backend data, not fictional design records.

Admin templates expose fewer fields than their database models. Customer directory designs show only nickname, phone, status, and identifier. Admin order designs omit payment mode/expiry/payment/refund details absent from the HTML response. Richer own-order JSON belongs to the customer workflow. These distinctions are also documented in the API map.

## MCP limitations encountered

Project listing succeeded, and project creation, screen generation, edits, individual screen reads and HTML/image downloads worked. Large generation batches returned the exact error `timed out awaiting tools/call after 300s`. The screen-list endpoint returned `{}` despite individually retrievable artifacts. Native screen IDs from successful smaller calls were used instead; unresolvable timed-out batches are not claimed as verified output. Source resource references in the JSON inventory remain the reliable retrieval map for this project.

## Optional suggestions returned by Stitch

These are recorded for review, not additional unfinished implementation requirements; the current workflow boards already cover the requested workflows.

- Generate the Cart and Checkout screens with 30-minute reservation timers
- Generate the Customer Orders and Account screens
- Generate the Admin product and order management screens
- Create the mobile Cart & Checkout flow (M04 Cart & M05 Checkout)
- Design the mobile Order History & Detail screen (M06 Orders)
- Design the mobile Customer Profile & Address Management screen (M07 Account)
- Add interactive tab switching logic between Sign In and Register in M04
- Preview empty cart and empty order states on mobile
- Refine order cancellation feedback modal for M06
- Load full HTML source for Screen 06 & 07
- Load full HTML source for Admin screens 10 & 11
- Export full screen inventory summary
- Inspect the loaded HTML of 06 Persistent Cart
- Inspect the loaded HTML of 07 Checkout Review
- Make targeted edits to any of the loaded screens
- Inspect the mobile customer account workflow
- Review the checkout review and 30-minute reservation flow
- Simulate an in-place edit on the profile save button state
- Inspect API schema annotations for backend handoff
- Add interactive tab switching behavior between panels
- Generate the matching mobile variant for this purchasing flow
- Review mobile cart & checkout screens for matching logic
- Inspect admin workspace against role authorization specs
- Export updated Ocean Blue design tokens
- Inspect M05 Cart disabled vs active reserve order states
- Verify M04 Profile password and avatar validation styling
- Review M02 Catalog shoe size scale (36-47) and single collection filter
- Would you like to zoom into any specific admin workflow or expand the drawer state?
- Shall we generate separate standalone screens for each administrative panel?
- Inspect the updated Customer Directory table and mobile drawer specimen
- Export the revised EJS frontend templates and CSS assets
- Verify API error specimen banners against backend contracts
- Inspect the revised footer on mobile views
- Export HTML code for production templates
- Review customer checkout edge case states

## Subsequent integration update — 2026-11-10

The backend now negotiates authenticated JSON for admin login/logout and all three collections, while preserving HTML pages. The former HTML response gaps were resolved: the React UI now reads actual customer profile fields and order payment/expiry/refund metadata. The original Stitch constraints above document the design-generation baseline, rather than missing current JSON capability. All new fields reuse the existing Ocean Blue components.
