import React, { useEffect } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "react-router-dom";
import { storefrontUrl, serverApi } from "../lib/config";
import { Empty } from "../shared/ui";
import { AdminReviewRoute } from "./AdminReviews";
import { Administration } from "./Admin";
import { AdminCatalog } from "./AdminCatalog";
import { AdminCustomers, AdminOrders } from "./AdminManagement";
import { AdminProvider } from "./state";
import "../shared/styles.css";

export default function AdminApp() {
  const location = useLocation();
  useEffect(() => {
    document.title = "KVN Store Administration";
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return (
    <AdminProvider>
      <div className="kv-app">
        <a className="kv-skip" href="#main-content">
          Skip to content
        </a>
        <header className="kv-header">
          <div className="kv-wrap kv-header-inner">
            <Link className="kv-brand" to="/administration">
              KVN Administration
            </Link>
            <a href={storefrontUrl}>Customer storefront ↗</a>
            <a href={`${serverApi}/admin`}>Original EJS administration ↗</a>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Switch>
            <Route exact path="/">
              <Redirect to="/administration" />
            </Route>
            <Route exact path="/administration">
              <Administration />
            </Route>
            <Route exact path="/administration/create">
              <Administration create />
            </Route>
            <Route exact path="/administration/reviews">
              <AdminReviewRoute />
            </Route>
            <Route exact path="/administration/products">
              <AdminCatalog />
            </Route>
            <Route exact path="/administration/orders">
              <AdminOrders />
            </Route>
            <Route exact path="/administration/customers">
              <AdminCustomers />
            </Route>
            <Route>
              <div className="kv-wrap kv-page">
                <Empty title="Administration page not found.">
                  <Link to="/administration">Open workspace</Link>
                </Empty>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </AdminProvider>
  );
}
