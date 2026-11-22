import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { FREE_DELIVERY_THRESHOLD } from "../../lib/pricing";
import { useStore } from "./state";
import GooeyNav from "../components/navigation/GooeyNav";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Catalog", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Favorites", href: "/favorites" },
];

interface StoreHeaderProps {
  signingOut: boolean;
  onSignOut: () => void;
}

export default function StoreHeader({
  signingOut,
  onSignOut,
}: StoreHeaderProps) {
  const { member, cart } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const activeIndex = navigationItems.findIndex(({ href }) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname === href || location.pathname.startsWith(`${href}/`),
  );
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menuOpen]);

  useEffect(() => {
    const mobile = window.matchMedia?.("(max-width: 1200px)");
    if (!mobile) return;
    const resize = () => {
      setMenuOpen(false);
      if (mobile.matches && panel.current?.contains(document.activeElement)) {
        toggle.current?.focus();
      }
    };
    mobile.addEventListener("change", resize);
    return () => mobile.removeEventListener("change", resize);
  }, []);

  const closeAfterNavigation = (event: React.MouseEvent<HTMLDivElement>) => {
    if (menuOpen && (event.target as Element).closest("a")) {
      setMenuOpen(false);
      toggle.current?.focus();
    }
  };

  return (
    <>
      <div className="kv-announcement">
        Free delivery on orders ${FREE_DELIVERY_THRESHOLD}+
      </div>
      <header className="kv-header" ref={header}>
        <div className="kv-wrap kv-header-inner">
          <Link className="kv-brand" to="/" aria-label="KVN Store home">
            <img
              className="kv-brand-mark"
              src="/media/icons/kvn-logo.svg"
              alt=""
              width="52"
              height="46"
            />
            KVN<span className="kv-brand-light">Store</span>
          </Link>
          <NavLink
            className="kv-header-favorites"
            to="/favorites"
            aria-label="My Favorites"
          >
            <FavoriteBorder aria-hidden="true" />
          </NavLink>
          <NavLink
            className="kv-header-cart"
            to="/cart"
            aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <ShoppingBagOutlinedIcon aria-hidden="true" />
            <span className="kv-header-cart-label">Bag</span>
            <span className="kv-count" aria-hidden="true">
              {count}
            </span>
          </NavLink>
          <button
            type="button"
            className="kv-menu-toggle"
            ref={toggle}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="store-header-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <CloseIcon aria-hidden="true" />
            ) : (
              <MenuIcon aria-hidden="true" />
            )}
          </button>
          <div
            id="store-header-menu"
            className={`kv-header-menu${menuOpen ? " is-open" : ""}`}
            ref={panel}
            onClick={closeAfterNavigation}
            onBlur={(event) => {
              if (
                menuOpen &&
                !header.current?.contains(event.relatedTarget as Node | null)
              ) {
                setMenuOpen(false);
              }
            }}
          >
            <GooeyNav
              items={navigationItems}
              activeIndex={activeIndex}
              className="kv-header-nav"
              theme="light"
              color="#0071E3"
              activeTextColor="#FFFFFF"
              frame={false}
              animationTime={500}
              timeVariance={150}
              particleCount={12}
              spread={24}
              gooeyness={0.5}
              wobble={0.35}
            />
            <div className="kv-header-actions">
              {member ? (
                <>
                  <span className="kv-member-name" title={member.memberNick}>
                    {member.memberNick}
                  </span>
                  <NavLink className="kv-header-account-link" to="/account">
                    Account
                  </NavLink>
                  <button
                    type="button"
                    className="kv-header-signout"
                    disabled={signingOut}
                    onClick={() => {
                      if (menuOpen) {
                        setMenuOpen(false);
                        toggle.current?.focus();
                      }
                      onSignOut();
                    }}
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </>
              ) : (
                <Link className="kv-header-signin" to="/login">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
