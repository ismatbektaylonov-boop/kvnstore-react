import React, { useEffect, useState } from "react";
import { demoPaymentsEnabled } from "../../lib/config";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import {
  api,
  ApiError,
  checkoutKey,
  finishCheckout,
  pendingCheckout,
} from "../../shared/api";
import {
  money,
  orderStatuses,
  Page,
  StoreCart,
  StoreOrder,
} from "../../shared/contracts";
import { useResource, useStore } from "./state";
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
  Pagination,
  Picture,
} from "./ui";

function Totals({
  subtotal,
  shipping,
  total,
}: {
  subtotal: number;
  shipping: number;
  total: number;
}) {
  return (
    <dl className="kv-totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{money(subtotal)}</dd>
      </div>
      <div>
        <dt>Delivery</dt>
        <dd>{shipping === 0 ? "Complimentary" : money(shipping)}</dd>
      </div>
      <div className="total">
        <dt>
          Total <small>USD</small>
        </dt>
        <dd>{money(total)}</dd>
      </div>
    </dl>
  );
}
export function Cart() {
  const { member, cart, cartReady, cartError, refreshCart, setCart, notify } =
    useStore();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);
  const unresolved = !!(member && pendingCheckout(member._id));
  const mutate = async (path: string, method: string, body?: unknown) => {
    if (busy || !cartReady) return;
    setBusy(path);
    setError("");
    try {
      setCart(await api<StoreCart>(path, { method, body }));
      notify(method === "DELETE" ? "Cart updated." : "Quantity updated.");
    } catch (cause) {
      setError((cause as Error).message);
      void refreshCart();
    } finally {
      setBusy("");
    }
  };
  const shipping = cart.subtotal >= 100 ? 0 : 5;
  return (
    <div className="kv-wrap kv-page">
      <PageHeading eyebrow="YOUR CART" title="A few good choices.">
        Review your pieces before placing an order.
      </PageHeading>
      <ErrorBox
        message={error || cartError}
        retry={cartError ? refreshCart : undefined}
      />
      {unresolved && (
        <div className="kv-panel">
          <h2>Check your last order request.</h2>
          <p>
            We saved your request so you can safely check its result before
            changing your cart.
          </p>
          <Link className="kv-button" to="/checkout">
            Check order result →
          </Link>
        </div>
      )}
      {!cartReady ? (
        cartError ? null : (
          <Loading />
        )
      ) : !cart.items.length ? (
        <Empty title="Your cart is waiting.">
          <p>Find a piece that makes every day feel a little more you.</p>
          <Link className="kv-button" to="/products">
            Explore the collection ↗
          </Link>
          <p>Already checked out? Your unpaid reservation is in Orders.</p>
          <Link className="kv-text-link" to="/orders">
            View orders and payments →
          </Link>
        </Empty>
      ) : (
        <div className="kv-commerce-layout">
          <div>
            <div className="kv-row kv-cart-heading">
              <h2>
                {cart.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                pieces
              </h2>
              <button
                disabled={!!busy || unresolved}
                className="kv-text-button"
                onClick={() => void mutate("/cart", "DELETE")}
              >
                Clear cart
              </button>
            </div>
            {cart.items.map((item) => (
              <article
                className={`kv-cart-line ${!item.available ? "unavailable" : ""}`}
                key={item._id}
              >
                <Link to={`/products/${item.productId}`}>
                  <Picture
                    path={item.product?.productImages[0]}
                    alt={item.product?.productName || "Unavailable product"}
                  />
                </Link>
                <div>
                  <Link to={`/products/${item.productId}`}>
                    <h3>
                      {item.product?.productName || "Product unavailable"}
                    </h3>
                  </Link>
                  <p className="kv-muted">
                    Size{" "}
                    {item.selectedSize === "ONESIZE"
                      ? "One size"
                      : item.selectedSize}
                  </p>
                  <p>
                    {item.unitPrice === null
                      ? "Price unavailable"
                      : money(item.unitPrice)}
                  </p>
                  {!item.available && (
                    <p role="alert" className="kv-line-warning">
                      Unavailable at this quantity or size. Adjust or remove to
                      continue.
                    </p>
                  )}
                  <div className="kv-row">
                    <label className="kv-field kv-quantity">
                      Quantity
                      <select
                        aria-label={`Quantity for ${item.product?.productName || "unavailable item"}, size ${item.selectedSize}`}
                        value={item.quantity}
                        disabled={!!busy || unresolved || !item.product}
                        onChange={(event) =>
                          void mutate("/cart/items", "PUT", {
                            productId: item.productId,
                            selectedSize: item.selectedSize,
                            quantity: Number(event.target.value),
                          })
                        }
                      >
                        {Array.from({ length: 20 }, (_, index) => (
                          <option value={index + 1} key={index}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!!busy || unresolved}
                      className="kv-text-button"
                      onClick={() =>
                        void mutate(`/cart/items/${item._id}`, "DELETE")
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <strong className="kv-line-total">
                  {item.lineTotal === null ? "—" : money(item.lineTotal)}
                </strong>
              </article>
            ))}
          </div>
          <aside className="kv-panel kv-summary">
            <h2>Order summary</h2>
            <Totals
              subtotal={cart.subtotal}
              shipping={shipping}
              total={cart.subtotal + shipping}
            />
            <p className="kv-muted">
              Final prices and availability are checked when your order is
              placed.
            </p>
            {cart.checkoutReady && !unresolved ? (
              <Link className="kv-button full" to="/checkout">
                Review order →
              </Link>
            ) : (
              <button className="kv-button full" disabled>
                Review order
              </button>
            )}
            <Link className="kv-text-link" to="/products">
              Continue exploring
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
export function Checkout() {
  const { member, cart, cartReady, cartError, refreshCart, notify } =
    useStore();
  const history = useHistory();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resuming, setResuming] = useState(
    () => !!(member && pendingCheckout(member._id)),
  );
  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);
  const place = async () => {
    if (!member || busy || (!resuming && !cartReady)) return;
    setBusy(true);
    setError("");
    try {
      const order = await api<StoreOrder>("/cart/checkout", {
        method: "POST",
        body: {},
        key: checkoutKey(member._id),
      });
      finishCheckout(member._id);
      setResuming(false);
      void refreshCart();
      notify(
        order.orderStatus === "PENDING"
          ? "Your order has been reserved."
          : "Your previous order has been found.",
      );
      history.replace(
        demoPaymentsEnabled() && order.orderStatus === "PENDING"
          ? `/orders/${order._id}/payment`
          : `/orders/${order._id}?reserved=true`,
      );
    } catch (cause) {
      if (cause instanceof ApiError && [400, 409].includes(cause.status)) {
        finishCheckout(member._id);
        setResuming(false);
      } else setResuming(true);
      setError((cause as Error).message);
      void refreshCart();
    } finally {
      setBusy(false);
    }
  };
  const shipping = cart.subtotal >= 100 ? 0 : 5;
  return (
    <div className="kv-wrap kv-page">
      <PageHeading eyebrow="REVIEW & RESERVE" title="Ready when you are.">
        One last look at the pieces coming your way.
      </PageHeading>
      <ErrorBox
        message={error || cartError}
        retry={cartError ? refreshCart : undefined}
      />
      {resuming ? (
        <div className="kv-panel">
          <h2>Check your previous request</h2>
          <p>
            We’ll look up the saved request and return its order, or complete
            that same request once.
          </p>
          <button className="kv-button" disabled={busy} onClick={place}>
            {busy ? "Checking…" : "Check order result"}
          </button>
          <Link className="kv-text-link" to="/orders">
            View order history
          </Link>
        </div>
      ) : !cartReady ? (
        cartError ? null : (
          <Loading />
        )
      ) : !cart.items.length ? (
        <Empty title="Your cart is empty.">
          <Link className="kv-button" to="/products">
            Explore the collection
          </Link>
          <p>Already checked out? Open your order to finish payment.</p>
          <Link className="kv-text-link" to="/orders">
            View orders and payments →
          </Link>
        </Empty>
      ) : (
        <div className="kv-commerce-layout">
          <div className="kv-stack">
            <section className="kv-panel">
              <div className="kv-row">
                <h2>01 &nbsp; Delivery address</h2>
                <Link to="/account?returnTo=/checkout">Edit →</Link>
              </div>
              {member?.memberAddress?.trim() ? (
                <>
                  <p>{member.memberNick}</p>
                  <p className="kv-address">{member.memberAddress}</p>
                  <p>{member.memberPhone}</p>
                </>
              ) : (
                <>
                  <p role="alert">
                    Add a delivery address to your profile before placing an
                    order.
                  </p>
                  <Link
                    className="kv-button secondary"
                    to="/account?returnTo=/checkout"
                  >
                    Add your address →
                  </Link>
                </>
              )}
            </section>
            <section className="kv-panel">
              <h2>02 &nbsp; Your pieces</h2>
              {cart.items.map((item) => (
                <div className="kv-review-line" key={item._id}>
                  <Picture
                    path={item.product?.productImages[0]}
                    alt={item.product?.productName || "Unavailable item"}
                  />
                  <div>
                    <strong>
                      {item.product?.productName || "Unavailable item"}
                    </strong>
                    <p>
                      Size {item.selectedSize} · Quantity {item.quantity}
                    </p>
                    {!item.available && (
                      <p className="kv-line-warning">
                        Unavailable — return to cart to adjust.
                      </p>
                    )}
                  </div>
                  <strong>
                    {item.lineTotal === null ? "—" : money(item.lineTotal)}
                  </strong>
                </div>
              ))}
              <Link className="kv-text-link" to="/cart">
                Edit your cart →
              </Link>
            </section>
            <section className="kv-panel kv-tint">
              <h2>03 &nbsp; Reservation & payment</h2>
              <p>
                Your order reserves stock for 30 minutes. Unpaid reservations
                are then cancelled automatically.
              </p>
              <p>
                {demoPaymentsEnabled()
                  ? "Continue to demo payment to complete your order. Your pieces stay reserved while you pay. No money is charged."
                  : "Online payment is currently unavailable. Placing an order creates an unpaid reservation."}
              </p>
            </section>
          </div>
          <aside className="kv-panel kv-summary">
            <h2>Order summary</h2>
            <Totals
              subtotal={cart.subtotal}
              shipping={shipping}
              total={cart.subtotal + shipping}
            />
            <p className="kv-muted">
              Prices and availability are confirmed by the store when you
              reserve.
            </p>
            <button
              className="kv-button full"
              disabled={
                busy || !cart.checkoutReady || !member?.memberAddress?.trim()
              }
              onClick={place}
            >
              {busy
                ? "Reserving your order…"
                : demoPaymentsEnabled()
                  ? "Continue to demo payment"
                  : "Reserve order"}{" "}
              ↗
            </button>
            <p className="kv-hint">No payment is collected.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
export function Orders() {
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search);
  const page = Math.max(1, Number(query.get("page")) || 1);
  const status = query.get("orderStatus") || "";
  const result = useResource<Page<StoreOrder>>(
    `/order/all?includeMeta=true&page=${page}&limit=10${status ? `&orderStatus=${encodeURIComponent(status)}` : ""}`,
  );
  return (
    <div className="kv-wrap kv-page">
      <PageHeading eyebrow="YOUR ORDERS" title="Every piece has a story.">
        Your reservations and purchases, in one place.
      </PageHeading>
      <label className="kv-field kv-status-filter">
        Order status
        <select
          value={status}
          onChange={(event) =>
            history.push(
              `/orders${event.target.value ? `?orderStatus=${event.target.value}` : ""}`,
            )
          }
        >
          <option value="">All orders</option>
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </label>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : result.data?.items.length ? (
        <>
          <div className="kv-stack">
            {result.data.items.map((order) => (
              <article className="kv-order-card kv-panel" key={order._id}>
                <div>
                  <span className="kv-eyebrow">
                    ORDER {order._id.slice(-8).toUpperCase()}
                  </span>
                  <h2>{new Date(order.createdAt).toLocaleDateString()}</h2>
                  <p>
                    {order.orderItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )}{" "}
                    pieces · {money(order.orderTotal)}
                  </p>
                </div>
                <div className="kv-order-preview">
                  {order.orderItems.slice(0, 3).map((item, index) => (
                    <Picture
                      key={index}
                      path={item.productImage}
                      alt={item.productName}
                    />
                  ))}
                </div>
                <div className="kv-order-actions">
                  <span className="kv-badge">
                    {order.orderStatus.toLowerCase()}
                  </span>
                  {demoPaymentsEnabled() &&
                    order.orderStatus === "PENDING" &&
                    order.expiresAt &&
                    Date.parse(order.expiresAt) > Date.now() && (
                      <Link
                        className="kv-button"
                        to={`/orders/${order._id}/payment`}
                      >
                        Pay {money(order.orderTotal)} (demo) →
                      </Link>
                    )}
                  <Link className="kv-text-link" to={`/orders/${order._id}`}>
                    View order ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            page={page}
            total={result.data.total}
            limit={10}
            go={(value) =>
              history.push(
                `/orders?page=${value}${status ? `&orderStatus=${status}` : ""}`,
              )
            }
          />
        </>
      ) : (
        <Empty title="No orders here yet.">
          <p>
            {status
              ? "Try another status or start exploring."
              : "Your next favorite is waiting in the collection."}
          </p>
          <Link className="kv-button" to="/products">
            Explore the collection ↗
          </Link>
        </Empty>
      )}
    </div>
  );
}
export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const result = useResource<StoreOrder>(`/order/${id}`);
  const { notify } = useStore();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const order = result.data;
  const expiry = order?.expiresAt ? new Date(order.expiresAt).getTime() : 0;
  const remaining = Math.max(0, Math.ceil((expiry - now) / 1000));
  useEffect(() => {
    if (order?.orderStatus !== "PENDING" || !expiry || remaining > 0) return;
    const timer = window.setTimeout(result.reload, 15000);
    return () => clearTimeout(timer);
  }, [order?.orderStatus, expiry, remaining, result.reload]);
  const cancel = async () => {
    if (busy) return;
    setBusy("cancel");
    setError("");
    try {
      result.setData(
        await api<StoreOrder>("/order/update", {
          method: "POST",
          body: { orderId: id, orderStatus: "CANCELLED" },
        }),
      );
      setConfirm(false);
      notify("Your reservation has been cancelled.");
    } catch (cause) {
      setError((cause as Error).message);
      result.reload();
    } finally {
      setBusy("");
    }
  };
  const demo = demoPaymentsEnabled();
  return (
    <div className="kv-wrap kv-page">
      <Link className="kv-text-link" to="/orders">
        ← All orders
      </Link>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : (
        order && (
          <>
            <PageHeading
              eyebrow={`ORDER ${order._id.slice(-8).toUpperCase()}`}
              title={
                order.orderStatus === "PAID" &&
                order.paymentMode === "demo" &&
                new URLSearchParams(location.search).get("demo") === "approved"
                  ? "Your demo payment is complete."
                  : order.orderStatus === "CANCELLED"
                    ? "Reservation cancelled."
                    : new URLSearchParams(location.search).has("reserved") &&
                        order.orderStatus === "PENDING"
                      ? "Your order is reserved."
                      : "Your order, at a glance."
              }
            >
              {new Date(order.createdAt).toLocaleString()}
            </PageHeading>
            <div className="kv-commerce-layout">
              <div className="kv-stack">
                <section className="kv-panel">
                  <div className="kv-row">
                    <h2>Order status</h2>
                    <span className="kv-badge accent">
                      {order.orderStatus.toLowerCase()}
                    </span>
                  </div>
                  {order.orderStatus === "PENDING" && (
                    <>
                      <h3>
                        {remaining > 0
                          ? `Reservation expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                          : "Reservation time has ended"}
                      </h3>
                      <p>
                        {demo
                          ? "Your reservation is unpaid. Open demo checkout to try a simulated payment. Unpaid reservations expire after 30 minutes."
                          : "Your reservation is unpaid. Online payment is currently unavailable. Unpaid reservations are cancelled automatically after 30 minutes."}
                      </p>
                      {remaining === 0 && (
                        <button
                          className="kv-button secondary"
                          onClick={result.reload}
                        >
                          Refresh status
                        </button>
                      )}
                    </>
                  )}
                  {order.orderStatus === "CANCELLED" && (
                    <p>
                      {order.cancelReason === "expired"
                        ? "This unpaid reservation expired."
                        : "You cancelled this reservation."}{" "}
                      Reserved stock has been released.
                    </p>
                  )}
                  {order.paymentMode === "demo" && (
                    <p className="kv-demo-note">
                      Demo payment — no money was charged.
                    </p>
                  )}
                  {order.orderStatus === "SHIPPED" && (
                    <p>Your order is marked as shipped.</p>
                  )}
                  {order.orderStatus === "DELIVERED" && (
                    <p>Your order is marked as delivered.</p>
                  )}
                </section>
                <section className="kv-panel">
                  <h2>Your pieces</h2>
                  {order.orderItems.map((item, index) => (
                    <div className="kv-review-line" key={index}>
                      <Picture
                        path={item.productImage}
                        alt={item.productName}
                      />
                      <div>
                        <strong>{item.productName}</strong>
                        <p>
                          Size {item.selectedSize} · Quantity {item.quantity}
                        </p>
                        <p className="kv-muted">{money(item.unitPrice)} each</p>
                      </div>
                      <strong>
                        {money(
                          (Math.round(item.unitPrice * 100) * item.quantity) /
                            100,
                        )}
                      </strong>
                    </div>
                  ))}
                </section>
                <section className="kv-panel">
                  <h2>Delivery address</h2>
                  <p className="kv-address">{order.shippingAddress}</p>
                </section>
              </div>
              <aside className="kv-panel kv-summary">
                <h2>Order total</h2>
                <Totals
                  subtotal={order.orderSubtotal}
                  shipping={order.orderShippingFee}
                  total={order.orderTotal}
                />
                {!!order.refundedAmount && (
                  <p>Refunded amount: {money(order.refundedAmount)}</p>
                )}
                <ErrorBox message={error} />
                {order.orderStatus === "PENDING" && (
                  <>
                    {demo && remaining > 0 && (
                      <div className="kv-demo-note">
                        <strong>Awaiting payment</strong>
                        <p>Complete your demo payment. No money is charged.</p>
                        <Link
                          className="kv-button full"
                          to={`/orders/${id}/payment`}
                        >
                          Pay {money(order.orderTotal)} (demo) →
                        </Link>
                      </div>
                    )}
                    {confirm ? (
                      <div
                        className="kv-confirm"
                        role="group"
                        aria-label="Confirm cancellation"
                      >
                        <p>Cancel this reservation and release the stock?</p>
                        <button
                          className="kv-button full"
                          disabled={!!busy}
                          onClick={() => void cancel()}
                        >
                          {busy === "cancel"
                            ? "Cancelling…"
                            : "Yes, cancel reservation"}
                        </button>
                        <button
                          className="kv-text-button"
                          disabled={!!busy}
                          onClick={() => setConfirm(false)}
                        >
                          Keep reservation
                        </button>
                      </div>
                    ) : (
                      <button
                        className="kv-button secondary full"
                        disabled={!!busy}
                        onClick={() => setConfirm(true)}
                      >
                        Cancel reservation
                      </button>
                    )}
                  </>
                )}
                <Link className="kv-text-link" to="/products">
                  Back to the collection ↗
                </Link>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
