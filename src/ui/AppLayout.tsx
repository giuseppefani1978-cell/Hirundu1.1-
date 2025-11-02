import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AppLayout.css";
import "./styles.css";

type AppLayoutProps = {
  children?: React.ReactNode;
};

const NAV_LINKS = [
  { to: "/qr", label: "QR Hub", icon: "🔍" },
  { to: "/bonus", label: "Bonus", icon: "🎁" },
  { to: "/poi/otranto/market", label: "Marché & Souvenirs", icon: "🏪" },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const renderedChildren = children ?? <Outlet />;
  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <header className="app-shell__header">
          <div>
            <p className="app-shell__eyebrow">HIRUNDU</p>
            <h1 className="app-shell__title">Module QR &amp; cartes bonus</h1>
            <p className="app-shell__subtitle">
              Accède rapidement au scanner, au hub des bonus ou aux cartes partenaires.
            </p>
          </div>

          <nav className="app-shell__nav" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "app-nav__link",
                    isActive ? "app-nav__link--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                <span aria-hidden className="app-nav__icon">
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="app-shell__content">{renderedChildren}</main>
      </div>
    </div>
  );
}
