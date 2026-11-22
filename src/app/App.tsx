import React from "react";
import { Link, Redirect, Route, Switch } from "react-router-dom";
import { StoreProvider } from "./storefront/state";
import { Empty, Layout, PageHeading, Protected } from "./storefront/ui";
import { Favorites } from "./storefront/Favorites";
import { Community } from "./storefront/Discovery";
import { Catalog, Home, ProductDetail } from "./storefront/Catalog";
import { Account, SignIn } from "./storefront/Account";
import { Cart, Checkout, OrderDetail, Orders } from "./storefront/Commerce";
import { DemoPayment } from "./storefront/DemoPayment";
import { adminDestination, demoPaymentsEnabled } from "../lib/config";
import { useLocation } from "react-router-dom";
import "../shared/styles.css";

function AdministrationLink() {
  const location = useLocation();
  return (
    <div className="kv-wrap kv-page">
      <PageHeading title="Administration is a separate interface." />
      <a
        className="kv-button"
        href={`${adminDestination(location.pathname)}${location.search}`}
      >
        Open administration ↗
      </a>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Layout>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/community">
            <Community />
          </Route>
          <Route exact path="/favorites">
            <div className="kv-protected">
              <Protected>
                <Favorites />
              </Protected>
            </div>
          </Route>
          <Route exact path="/products">
            <Catalog />
          </Route>
          <Route exact path="/products/:id">
            <ProductDetail />
          </Route>
          <Route exact path="/login">
            <SignIn key="login" />
          </Route>
          <Route exact path="/signup">
            <SignIn signup key="signup" />
          </Route>
          <Route exact path={["/account", "/account/recently-viewed"]}>
            <div className="kv-protected">
              <Protected>
                <Account />
              </Protected>
            </div>
          </Route>
          <Route exact path="/member-page">
            <Redirect to="/account" />
          </Route>
          <Route exact path="/cart">
            <div className="kv-protected">
              <Protected>
                <Cart />
              </Protected>
            </div>
          </Route>
          <Route exact path="/checkout">
            <div className="kv-protected">
              <Protected>
                <Checkout />
              </Protected>
            </div>
          </Route>
          <Route exact path="/orders">
            <div className="kv-protected">
              <Protected>
                <Orders />
              </Protected>
            </div>
          </Route>
          <Route exact path="/orders/:id/payment">
            <div className="kv-protected">
              <Protected>
                <DemoPayment />
              </Protected>
            </div>
          </Route>
          <Route exact path="/orders/:id">
            <div className="kv-protected">
              <Protected>
                <OrderDetail />
              </Protected>
            </div>
          </Route>
          <Route path="/administration">
            <AdministrationLink />
          </Route>
          <Route exact path="/help">
            <div className="kv-wrap kv-page">
              <PageHeading
                eyebrow="SHOPPING WITH KVN"
                title="A few helpful details."
              />
              <div className="kv-stack kv-guide">
                <section className="kv-panel">
                  <h2>Delivery</h2>
                  <p>
                    All prices are in USD. Delivery is $5 for orders below $100
                    and complimentary from $100.
                  </p>
                </section>
                <section className="kv-panel">
                  <h2>Your cart &amp; sizes</h2>
                  <p>
                    Sign in to save your cart. Choose an available size before
                    adding a piece. Stock is shared across sizes, and each
                    product is limited to 20 pieces per cart.
                  </p>
                </section>
                <section className="kv-panel">
                  <h2>Order reservations</h2>
                  <p>
                    Save your delivery address in your account before placing an
                    order. Your order reserves stock for 30 minutes.{" "}
                    {demoPaymentsEnabled()
                      ? "You can complete a demo payment at checkout. No money is charged; unpaid reservations expire automatically."
                      : "Online payment is currently unavailable; unpaid reservations expire automatically."}
                  </p>
                </section>
                <section className="kv-panel">
                  <h2>Cancellations</h2>
                  <p>
                    You can cancel a pending reservation from its order details.
                    Orders that have moved beyond pending cannot be cancelled
                    through the store.
                  </p>
                  <Link className="kv-text-link" to="/orders">
                    View your orders →
                  </Link>
                </section>
              </div>
            </div>
          </Route>
          <Route>
            <div className="kv-wrap kv-page">
              <Empty title="This page took a different turn.">
                <p>Let’s get you back to the collection.</p>
                <Link className="kv-button" to="/products">
                  Explore the store ↗
                </Link>
              </Empty>
            </div>
          </Route>
        </Switch>
      </Layout>
    </StoreProvider>
  );
}
