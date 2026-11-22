import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { demoPaymentsEnabled } from "../../lib/config";
import { api, ApiError } from "../../shared/api";
import { money, StoreOrder } from "../../shared/contracts";
import { useResource, useStore } from "./state";
import { Empty, ErrorBox, Loading, PageHeading } from "./ui";

export function DemoPayment() {
  if (!demoPaymentsEnabled())
    return (
      <div className="kv-wrap kv-page">
        <Empty title="Demo checkout is unavailable.">
          <Link className="kv-button" to="/orders">
            View your orders
          </Link>
        </Empty>
      </div>
    );
  return <PaymentSimulator />;
}

function PaymentSimulator() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const result = useResource<StoreOrder>(`/order/${id}`);
  const { notify } = useStore();
  const [busy, setBusy] = useState("");
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const order = result.data;
  const expires = order
    ? order.expiresAt
      ? Date.parse(order.expiresAt)
      : Date.parse(order.createdAt) + 30 * 60 * 1000
    : 0;
  const payable = order?.orderStatus === "PENDING" && expires > now;
  const complete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const details = new FormData(event.currentTarget);
    const fields = [
      "cardholderName",
      "paymentReference",
      "expiryNote",
      "confirmationCode",
    ];
    if (fields.some((name) => !String(details.get(name) || "").trim())) {
      setDetailsError("Fill in all four demo payment details.");
      return;
    }
    setDetailsError("");
    // Coco-style details are local simulation inputs. Never send or persist them.
    void pay("success");
  };
  const pay = async (outcome: "success" | "declined") => {
    if (!payable || inFlight.current) return;
    inFlight.current = true;
    setBusy(outcome);
    setError("");
    try {
      // Only a simulated outcome is sent. Ownership, total and status are checked by the backend.
      const paid = await api<StoreOrder>(`/order/${id}/demo-pay`, {
        method: "POST",
        body: { outcome },
      });
      if (paid.orderStatus !== "PAID" || paid.paymentMode !== "demo")
        throw new Error(
          "The demo payment could not be confirmed. Check your order status.",
        );
      notify("Demo payment approved. No money was charged.");
      history.replace(`/orders/${id}?demo=approved`);
    } catch (cause) {
      setError((cause as Error).message);
      // Reconcile ambiguous results before offering another attempt.
      if (!(cause instanceof ApiError && cause.status === 402)) result.reload();
    } finally {
      inFlight.current = false;
      setBusy("");
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading eyebrow="PAYMENT SIMULATOR" title="Demo checkout.">
        Try the payment flow with your reserved order.
      </PageHeading>
      <div className="kv-demo-note" role="note">
        <strong>Demo only — no money is charged.</strong>
        <p>
          Use fictional details below. Never enter a real card number or
          security code.
        </p>
      </div>
      <ErrorBox message={error} />
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorBox message={result.error} retry={result.reload} />
      ) : (
        order && (
          <div className="kv-commerce-layout">
            <section className="kv-panel kv-stack">
              <h2>Complete your order</h2>
              {payable ? (
                <>
                  <p>
                    Enter demo payment details to confirm your order. The
                    reference, expiry note, and confirmation code are never sent
                    or saved.
                  </p>
                  <p className="kv-muted">
                    Reservation expires in{" "}
                    {Math.max(0, Math.ceil((expires - now) / 60000))} minutes.
                  </p>
                  <form className="kv-form" onSubmit={complete}>
                    <ErrorBox message={detailsError} />
                    <label className="kv-field">
                      Account name (demo)
                      <input
                        name="cardholderName"
                        required
                        maxLength={120}
                        autoComplete="off"
                        placeholder="Test Shopper"
                        disabled={!!busy}
                      />
                    </label>
                    <label className="kv-field">
                      Payment reference (demo)
                      <input
                        name="paymentReference"
                        required
                        maxLength={32}
                        autoComplete="off"
                        placeholder="DEMO-4242"
                        disabled={!!busy}
                      />
                    </label>
                    <div className="kv-form-grid">
                      <label className="kv-field">
                        Expiry note (demo)
                        <input
                          name="expiryNote"
                          required
                          maxLength={16}
                          autoComplete="off"
                          placeholder="12/30"
                          disabled={!!busy}
                        />
                      </label>
                      <label className="kv-field">
                        Confirmation code (demo)
                        <input
                          name="confirmationCode"
                          type="password"
                          required
                          maxLength={16}
                          autoComplete="off"
                          placeholder="123"
                          disabled={!!busy}
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="kv-button full"
                      disabled={!!busy}
                    >
                      {busy === "success"
                        ? "Completing demo payment…"
                        : `Complete demo payment · ${money(order.orderTotal)}`}
                    </button>
                  </form>
                  <button
                    className="kv-button secondary full"
                    disabled={!!busy}
                    onClick={() => void pay("declined")}
                  >
                    {busy === "declined"
                      ? "Declining demo…"
                      : "Simulate decline"}
                  </button>
                  <button
                    className="kv-text-button"
                    disabled={!!busy}
                    onClick={() => history.push(`/orders/${id}`)}
                  >
                    Return without paying
                  </button>
                </>
              ) : (
                <>
                  <p>
                    {order.orderStatus === "PENDING"
                      ? "This reservation has expired. It can no longer be paid."
                      : order.paymentMode === "demo"
                        ? "This order already has a demo payment."
                        : "This order is no longer awaiting payment."}
                  </p>
                  <Link className="kv-button" to={`/orders/${id}`}>
                    View order status
                  </Link>
                </>
              )}
            </section>
            <aside className="kv-panel kv-summary">
              <h2>Your reserved order</h2>
              <p className="kv-eyebrow">Order {id.slice(-8).toUpperCase()}</p>
              {order.orderItems.map((item, index) => (
                <p key={index}>
                  {item.productName} · Size {item.selectedSize} · Quantity{" "}
                  {item.quantity}
                </p>
              ))}
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
                  <dt>
                    Demo total <small>USD</small>
                  </dt>
                  <dd>{money(order.orderTotal)}</dd>
                </div>
              </dl>
              <p className="kv-muted">Delivery to</p>
              <p className="kv-address">{order.shippingAddress}</p>
            </aside>
          </div>
        )
      )}
    </div>
  );
}
