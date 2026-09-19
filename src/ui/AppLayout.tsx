import React from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { bt } from "../features/qr/i18n/bonusLocale";
import { copy } from './copy.js';
import LanguageSelect from './LanguageSelect';
import './AppLayout.css';
import './styles.css';

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const { id } = useParams();
  const city = ['otranto','gallipoli','lecce'].includes(id || '') ? id : 'otranto';
  return <div className="app-shell">
    <div className="app-shell__inner">
      <header className="app-shell__header">
        <div className="app-shell__topbar">
          <NavLink className="app-button app-button--dark" to="/bonus">← {copy.bonus}</NavLink>
          <LanguageSelect />
        </div>
        <nav className="app-shell__nav" aria-label={bt('Navigation principale')}>
          {[{to:'/qr',label:bt('QR Hub')},{to:`/passport/${city}`,label:copy.passportOpen},{to:`/poi/${city}/market`,label:bt('Marché & Souvenirs')}].map(link => <NavLink key={link.to} to={link.to} className={({isActive})=>`app-nav__link ${isActive?'app-nav__link--active':''}`}>{link.label}</NavLink>)}
        </nav>
      </header>
      <main className="app-shell__content">{children ?? <Outlet />}</main>
    </div>
  </div>;
}
