import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { Link } from "react-router-dom";
import { adminUrl } from "../../lib/config";
import { collections } from "../../shared/contracts";
import { socialLinks } from "../components/footer/socialLinks";
import Lightfall from "../components/Lightfall";
import "./StoreFooter.css";

const socialIcons = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: MusicNoteIcon,
};

const storeLinks = [
  { label: "My account", path: "/account" },
  { label: "My orders", path: "/orders" },
  { label: "My Favorites", path: "/favorites" },
  { label: "Community", path: "/community" },
];

export function StoreFooter() {
  return (
    <footer className="kv-footer">
      <div className="kv-footer-lightfall" aria-hidden="true">
        <Lightfall
          lightMode
          colors={["#0071e3", "#65a7ec", "#a0c8ef"]}
          opacity={0.32}
          speed={0.22}
          streakCount={5}
          streakWidth={1.25}
          streakLength={1.2}
          density={0.9}
          fade={0.14}
          bloom={0}
          dpr={1}
          intro={false}
          mouseInteraction={false}
          holdToWarp={false}
        />
      </div>
      <div className="kv-wrap">
        <div className="kv-footer-main">
          <div className="kv-footer-intro">
            <p>
              Everyday pieces.
              <br />
              Considered choices.
            </p>
            <ul className="kv-footer-socials" aria-label="Social media">
              {socialLinks.map(({ label, href }) => {
                const Icon = socialIcons[label];
                return (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon fontSize="small" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <nav className="kv-footer-nav" aria-label="Store footer">
            <div>
              <h2>Explore</h2>
              <ul className="kv-footer-links">
                {Object.entries(collections).map(([key, label]) => (
                  <li key={key}>
                    <Link to={`/products?productCollection=${key}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Your store</h2>
              <ul className="kv-footer-links">
                {storeLinks.map(({ label, path }) => (
                  <li key={path}>
                    <Link to={path}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="kv-footer-service">
              <h2>Store info</h2>
              <ul className="kv-footer-links">
                <li>
                  <Link to="/help">Shopping guide</Link>
                </li>
                <li>
                  <a href={adminUrl}>Administration</a>
                </li>
              </ul>
              <div className="kv-footer-delivery">
                <p>
                  <span className="kv-badge accent">USD</span> $5 standard
                  delivery. Free on orders of $100 or more.
                </p>
                <p>Unpaid reservations expire after 30 minutes.</p>
              </div>
            </div>
          </nav>
        </div>
        <div className="kv-footer-wordmark">
          <Link to="/" aria-label="KVNStore home">
            <span>KVNStore</span>
          </Link>
        </div>
        <div className="kv-footer-bottom">
          <span>© {new Date().getFullYear()} KVN Store</span>
          <span>Made for your everyday.</span>
        </div>
      </div>
    </footer>
  );
}
