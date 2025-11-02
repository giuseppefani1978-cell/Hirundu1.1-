import React from "react";
import { useNavigate } from "react-router-dom";
import { HallOfFameSection } from "../features/bonus/HallOfFameSection";
import "./StartPage.css";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="start-page">
      <div className="start-page__hero">
        <div className="start-page__content">
          <p className="start-page__eyebrow">Le Vol d’Aracne</p>
          <h1 className="start-page__title">Prêt·e pour la chasse&nbsp;?</h1>
          <p className="start-page__lead">
            Traverse Otranto, Gallipoli et Lecce, collecte les artefacts et triomphe des batailles
            pour débloquer les cartes bonus. Le scanner QR reste disponible à chaque étape.
          </p>
          <div className="start-page__actions">
            <button
              type="button"
              className="app-button app-button--dark start-page__cta"
              onClick={() => navigate("/level/1")}
            >
              ▶︎ Lancer la chasse N°1
            </button>
            <button
              type="button"
              className="app-button app-button--ghost"
              onClick={() => navigate("/bonus/otranto", { state: { fromIntro: true } })}
            >
              🎁 Voir les bonus
            </button>
          </div>
        </div>
      </div>

      <div className="start-page__hof">
        <HallOfFameSection highlight />
      </div>
    </div>
  );
}
