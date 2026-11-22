import React, { FormEvent, useState } from "react";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";
import { api } from "../../shared/api";
import { StoreMember } from "../../shared/contracts";
import { useStore } from "./state";
import { ErrorBox, PageHeading, Picture } from "./ui";
import { MEDIA } from "../../lib/media";
import { adminUrl } from "../../lib/config";
import { RecentlyViewed } from "./recentlyViewed";

import { validImage, validPassword } from "../../shared/validation";
export function SignIn({ signup = false }: { signup?: boolean }) {
  const { setMember, notify, member } = useStore();
  const history = useHistory();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rawNext =
    new URLSearchParams(location.search).get("next") || "/account";
  const next =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : "/account";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("memberPassword") || "");
    if (signup && !validPassword(password)) {
      setError(
        "Use at least 8 characters and at most 72 UTF-8 bytes for your password.",
      );
      return;
    }
    const body: Record<string, string> = {
      memberNick: String(data.get("memberNick")).trim(),
      memberPassword: password,
    };
    if (signup) {
      body.memberPhone = String(data.get("memberPhone")).trim();
      body.memberAddress = String(data.get("memberAddress") || "").trim();
    }
    setBusy(true);
    try {
      const value = await api<{ member: StoreMember }>(
        signup ? "/member/signup" : "/member/login",
        { method: "POST", body },
      );
      setMember(value.member);
      notify(signup ? "Your account is ready." : "Welcome back.");
      history.replace(next);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="kv-wrap kv-page kv-auth">
      <div className="kv-auth-art">
        <img
          src={MEDIA.images.neutralEdit.src}
          alt="Contemporary wardrobe essentials"
        />
        <div>
          <p className="kv-eyebrow">YOUR EVERYDAY, CONSIDERED.</p>
          <h2>A little more you.</h2>
        </div>
      </div>
      <div className="kv-auth-form">
        <PageHeading
          eyebrow="WELCOME TO KVN STORE"
          title={signup ? "Make yourself at home." : "Good to see you again."}
        >
          {signup
            ? "One account for your cart, your details, and your orders."
            : "Sign in to pick up where you left off."}
        </PageHeading>
        {member ? (
          <>
            <p>You’re signed in as {member.memberNick}.</p>
            <Link className="kv-button" to={next}>
              Continue →
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="kv-form">
            <ErrorBox message={error} />
            <label className="kv-field">
              Nickname
              <input
                required
                name="memberNick"
                autoComplete="username"
                maxLength={500}
                autoFocus
              />
            </label>
            {signup && (
              <label className="kv-field">
                Phone number
                <input
                  required
                  name="memberPhone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={500}
                />
              </label>
            )}
            <label className="kv-field">
              Password
              <input
                required
                name="memberPassword"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 8 : 1}
                maxLength={500}
              />
              {signup && (
                <span className="kv-hint">
                  At least 8 characters; up to 72 UTF-8 bytes.
                </span>
              )}
            </label>
            {signup && (
              <label className="kv-field">
                Delivery address{" "}
                <span className="kv-muted">(optional for now)</span>
                <textarea
                  name="memberAddress"
                  maxLength={500}
                  autoComplete="street-address"
                  rows={3}
                />
                <span className="kv-hint">
                  You’ll need a saved delivery address before placing an order.
                </span>
              </label>
            )}
            <button type="submit" className="kv-button full" disabled={busy}>
              {busy ? "Please wait…" : signup ? "Create account" : "Sign in"} ↗
            </button>
          </form>
        )}
        <p className="kv-auth-switch">
          {signup ? "Already part of the store?" : "New here?"}{" "}
          <Link
            to={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}
          >
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </section>
  );
}
export function Account() {
  const { member, setMember, notify } = useStore();
  const location = useLocation();
  const viewingHistory = location.pathname === "/account/recently-viewed";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const returnTo =
    new URLSearchParams(location.search).get("returnTo") === "/checkout"
      ? "/checkout"
      : "";
  if (!member) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const password = String(data.get("memberPassword") || "");
    if (password && !validPassword(password)) {
      setError(
        "Your new password needs at least 8 characters and at most 72 UTF-8 bytes.",
      );
      return;
    }
    if (!password) data.delete("memberPassword");
    const image = data.get("memberImage") as File;
    if (!image?.size) data.delete("memberImage");
    else {
      const problem = validImage(image);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setBusy(true);
    try {
      setMember(
        await api<StoreMember>("/member/update", {
          method: "POST",
          body: data,
        }),
      );
      notify("Your profile has been updated.");
      const passwordField = formElement.elements.namedItem(
        "memberPassword",
      ) as HTMLInputElement;
      if (passwordField) passwordField.value = "";
      const imageField = formElement.elements.namedItem(
        "memberImage",
      ) as HTMLInputElement;
      if (imageField) imageField.value = "";
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="kv-wrap kv-page">
      <PageHeading
        eyebrow="YOUR ACCOUNT"
        title={
          viewingHistory ? "Recently Viewed" : "Your details, all together."
        }
      >
        {viewingHistory
          ? "Pick up where you left off with products you’ve viewed."
          : "Keep your profile and delivery address up to date."}
      </PageHeading>
      <div className="kv-account-layout">
        <aside className="kv-panel kv-profile-card">
          <Picture
            path={member.memberImage}
            avatar
            alt={`${member.memberNick}'s profile`}
            className="kv-avatar large"
          />
          <h2>{member.memberNick}</h2>
          <span className="kv-badge">
            {member.memberType === "ADMIN" ? "Administrator" : "Store member"}
          </span>
          <p>{member.memberPoints || 0} points</p>
          <nav className="kv-profile-nav" aria-label="Account shortcuts">
            {[
              { label: "Your Orders", to: "/orders" },
              { label: "Favorites", to: "/favorites" },
              { label: "Recently Viewed", to: "/account/recently-viewed" },
            ].map(({ label, to }) => (
              <NavLink
                className="kv-text-link"
                activeClassName="is-active"
                to={to}
                key={to}
              >
                {label}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M4 12h16m-6-6 6 6-6 6" />
                </svg>
              </NavLink>
            ))}
          </nav>
          {member.memberType === "ADMIN" && (
            <a className="kv-text-link" href={adminUrl}>
              Administration →
            </a>
          )}
        </aside>
        {viewingHistory ? (
          <RecentlyViewed account />
        ) : (
          <form
            key={
              member._id +
              member.memberNick +
              member.memberImage +
              member.memberAddress
            }
            className="kv-panel kv-form"
            onSubmit={submit}
          >
            <h2>Personal details</h2>
            <ErrorBox message={error} />
            <div className="kv-form-grid">
              <label className="kv-field">
                Nickname
                <input
                  name="memberNick"
                  required
                  maxLength={500}
                  autoComplete="username"
                  defaultValue={member.memberNick}
                />
              </label>
              <label className="kv-field">
                Phone number
                <input
                  name="memberPhone"
                  type="tel"
                  required
                  maxLength={500}
                  autoComplete="tel"
                  defaultValue={member.memberPhone}
                />
              </label>
            </div>
            <label className="kv-field">
              Delivery address
              <textarea
                name="memberAddress"
                maxLength={500}
                defaultValue={member.memberAddress}
                autoComplete="street-address"
                rows={3}
              />
              <span className="kv-hint">
                Required to place an order. The order uses your saved address.
              </span>
            </label>
            <label className="kv-field">
              About you
              <textarea
                name="memberDesc"
                maxLength={2000}
                defaultValue={member.memberDesc}
                rows={3}
              />
            </label>
            <label className="kv-field">
              Profile photo
              <input
                type="file"
                name="memberImage"
                accept="image/jpeg,image/png,image/webp"
              />
              <span className="kv-hint">
                One JPEG, PNG, or WebP. Up to 5 MiB and 32 million pixels.
              </span>
            </label>
            <h2>Update password</h2>
            <label className="kv-field">
              New password <span className="kv-muted">(optional)</span>
              <input
                type="password"
                name="memberPassword"
                autoComplete="new-password"
                maxLength={500}
              />
              <span className="kv-hint">
                Leave blank to keep your password. New passwords need 8+
                characters and at most 72 UTF-8 bytes.
              </span>
            </label>
            <button className="kv-button" disabled={busy}>
              {busy ? "Saving…" : "Save details"} ↗
            </button>
            {returnTo && (
              <Link className="kv-text-link" to={returnTo}>
                Return to checkout →
              </Link>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
