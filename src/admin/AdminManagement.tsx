import React, { useCallback, useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { serverApi, storefrontUrl } from "../lib/config";
import { api } from "../shared/api";
import {
  AdminCustomer,
  AdminOrderRecord,
  loadAdminCustomers,
  loadAdminOrders,
} from "./adminRecords";
import { money, orderStatuses } from "../shared/contracts";
import { useAdmin } from "./state";
import { Empty, ErrorBox, Loading, PageHeading, Picture } from "../shared/ui";

function useAdminRecords<T>(
  path: string,
  load: (path: string, signal: AbortSignal) => Promise<T[]>,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    load(path, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause.message || "Unable to load records. Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, load, version]);
  return { data, loading, error, reload };
}
export function AdminNavigation() {
  return (
    <nav className="kv-admin-nav" aria-label="Administration">
      <Link to="/administration">Workspace</Link>
      <Link to="/administration/products">Products</Link>
      <Link to="/administration/orders">Orders</Link>
      <Link to="/administration/customers">Customers</Link>
      <Link to="/administration/reviews">Reviews</Link>
      <a href={storefrontUrl}>Storefront</a>
    </nav>
  );
}
export function AdminOrders() {
  const location = useLocation();
  const history = useHistory();
  const status = new URLSearchParams(location.search).get("orderStatus") || "";
  const result = useAdminRecords<AdminOrderRecord>(
    `/admin/order/all${status ? `?orderStatus=${encodeURIComponent(status)}` : ""}`,
    loadAdminOrders,
  );
  const [pending, setPending] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useAdmin();
  const transitions: Partial<
    Record<AdminOrderRecord["orderStatus"], AdminOrderRecord["orderStatus"]>
  > = { PAID: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };
  const advance = async (order: AdminOrderRecord) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/order/${order._id}/status`, {
        method: "POST",
        body: { orderStatus: transitions[order.orderStatus] },
      });
      setPending("");
      notify("Order status updated.");
      result.reload();
    } catch (cause) {
      setError((cause as Error).message);
      result.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading
        eyebrow="STORE FULFILLMENT"
        title="Every order, moving forward."
      >
        Prepare paid orders and keep their status up to date.
      </PageHeading>
      <AdminNavigation />
      <div className="kv-row kv-admin-toolbar">
        <label className="kv-field kv-status-filter">
          Order status
          <select
            value={status}
            onChange={(event) => {
              setPending("");
              history.push(
                `/administration/orders${event.target.value ? `?orderStatus=${event.target.value}` : ""}`,
              );
            }}
          >
            <option value="">All orders</option>
            {orderStatuses.map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <a className="kv-text-link" href={`${serverApi}/admin/order/all`}>
          Original order manager ↗
        </a>
      </div>
      <ErrorBox message={error} />
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <>
          <ErrorBox message={result.error} retry={result.reload} />
          <Link className="kv-button secondary" to="/administration">
            Administrator sign in →
          </Link>
        </>
      ) : !result.data.length ? (
        <Empty title="No orders here.">
          <p>Orders matching this status will appear here.</p>
        </Empty>
      ) : (
        <div className="kv-stack">
          {result.data.map((order) => (
            <article className="kv-panel" key={order._id}>
              <div className="kv-row">
                <div>
                  <p className="kv-eyebrow">
                    ORDER {order._id.slice(-8).toUpperCase()}
                  </p>
                  <h2>{order.memberNick}</h2>
                  <p className="kv-muted">{order.dateLabel}</p>
                </div>
                <span className="kv-badge accent">
                  {order.orderStatus.toLowerCase()}
                </span>
              </div>
              <p>{order.memberPhone}</p>
              <p className="kv-address">{order.shippingAddress}</p>
              {order.paymentMode && (
                <div className="kv-order-payment">
                  <span className="kv-badge">
                    {order.paymentMode === "demo"
                      ? "Demo payment — no charge"
                      : "Unpaid"}
                  </span>
                  {order.paidAt && (
                    <p className="kv-muted">
                      Paid {new Date(order.paidAt).toLocaleString()}
                    </p>
                  )}
                  {order.orderStatus === "PENDING" && order.expiresAt && (
                    <p className="kv-muted">
                      Reservation expires{" "}
                      {new Date(order.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              <details className="kv-admin-order-details">
                <summary>View {order.items.length} order lines</summary>
                {order.items.map((item, index) => (
                  <div className="kv-review-line" key={index}>
                    <Picture path={item.productImage} alt={item.productName} />
                    <div>
                      <strong>{item.productName}</strong>
                      <p>
                        {item.selection} · Quantity {item.quantity}
                      </p>
                      {item.unitPrice !== undefined && (
                        <p className="kv-muted">{money(item.unitPrice)} each</p>
                      )}
                    </div>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
              </details>
              <dl className="kv-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(order.orderSubtotal)}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>{money(order.orderShippingFee)}</dd>
                </div>
                <div className="total">
                  <dt>Total USD</dt>
                  <dd>{money(order.orderTotal)}</dd>
                </div>
                {!!order.refundedAmount && (
                  <div>
                    <dt>Refunded amount</dt>
                    <dd>{money(order.refundedAmount)}</dd>
                  </div>
                )}
              </dl>
              {transitions[order.orderStatus] &&
                (pending === order._id ? (
                  <div className="kv-confirm">
                    <p>
                      Move this order to{" "}
                      {transitions[order.orderStatus]?.toLowerCase()}?
                    </p>
                    <button
                      className="kv-button"
                      disabled={busy}
                      onClick={() => void advance(order)}
                    >
                      {busy ? "Updating…" : "Confirm status change"}
                    </button>
                    <button
                      className="kv-text-button"
                      disabled={busy}
                      onClick={() => setPending("")}
                    >
                      Keep current status
                    </button>
                  </div>
                ) : (
                  <button
                    className="kv-button secondary"
                    disabled={busy}
                    onClick={() => setPending(order._id)}
                  >
                    Mark {transitions[order.orderStatus]?.toLowerCase()} →
                  </button>
                ))}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
export function AdminCustomers() {
  const result = useAdminRecords<AdminCustomer>(
    "/admin/user/all",
    loadAdminCustomers,
  );
  const { notify } = useAdmin();
  const [pending, setPending] = useState<{
    member: AdminCustomer;
    status: AdminCustomer["memberStatus"];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/admin/user/edit", {
        method: "POST",
        body: { _id: pending.member._id, memberStatus: pending.status },
      });
      setPending(null);
      notify("Customer status updated.");
      result.reload();
    } catch (cause) {
      setError((cause as Error).message);
      result.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading eyebrow="STORE COMMUNITY" title="Your customers, together.">
        Review accounts and manage access status.
      </PageHeading>
      <AdminNavigation />
      <a className="kv-text-link" href={`${serverApi}/admin/user/all`}>
        Original customer manager ↗
      </a>
      <ErrorBox message={error} />
      {pending && (
        <div className="kv-panel kv-confirm">
          <h2>Update {pending.member.memberNick}</h2>
          <p>
            Change account status from{" "}
            {pending.member.memberStatus.toLowerCase()} to{" "}
            {pending.status.toLowerCase()}?{" "}
            {pending.status !== "ACTIVE"
              ? "This prevents the customer from signing in."
              : ""}
          </p>
          <button
            className="kv-button"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save account status"}
          </button>
          <button
            className="kv-text-button"
            disabled={busy}
            onClick={() => setPending(null)}
          >
            Keep current status
          </button>
        </div>
      )}
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <>
          <ErrorBox message={result.error} retry={result.reload} />
          <Link className="kv-button secondary" to="/administration">
            Administrator sign in →
          </Link>
        </>
      ) : !result.data.length ? (
        <Empty title="Your community starts here.">
          <p>Customer accounts will appear here after registration.</p>
        </Empty>
      ) : (
        <div className="kv-table-frame">
          <table className="kv-table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Phone</th>
                <th scope="col">Account status</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((member) => (
                <tr key={member._id}>
                  <td data-label="Customer">
                    <div className="kv-customer-name">
                      {member.createdAt && (
                        <Picture
                          path={member.memberImage}
                          alt=""
                          avatar
                          className="kv-avatar"
                        />
                      )}
                      <strong>{member.memberNick}</strong>
                    </div>
                    {member.createdAt && (
                      <details className="kv-customer-details">
                        <summary>Profile details</summary>
                        <p className="kv-muted">
                          Joined{" "}
                          {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                        {member.memberAddress ? (
                          <p className="kv-address">{member.memberAddress}</p>
                        ) : (
                          <p className="kv-muted">No delivery address saved.</p>
                        )}
                        {member.memberDesc && <p>{member.memberDesc}</p>}
                        {member.memberPoints !== undefined && (
                          <p>{member.memberPoints} points</p>
                        )}
                      </details>
                    )}
                  </td>
                  <td data-label="Phone">{member.memberPhone}</td>
                  <td data-label="Account status">
                    <select
                      aria-label={`Status for ${member.memberNick}`}
                      value={
                        pending?.member._id === member._id
                          ? pending.status
                          : member.memberStatus
                      }
                      disabled={busy}
                      onChange={(event) => {
                        const status = event.target
                          .value as AdminCustomer["memberStatus"];
                        setPending(
                          status === member.memberStatus
                            ? null
                            : { member, status },
                        );
                      }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="BLOCK">Blocked</option>
                      <option value="DELETE">Deleted</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
