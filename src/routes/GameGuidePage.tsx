import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSelect from "../ui/LanguageSelect";
import { LANG } from "../i18n.js";
import { attachPractice } from "../legacy/practice.js";
import { withBase } from "../utils/basePath.js";
import "../legacy/practice.css";
import "./GameGuidePage.css";

type Family = "classic" | "arkanoid" | "flight";

const STORAGE_KEY = "hirundu_game_guide_v1";

const copy = {
  fr: {
    guide: "Guide du jeu", back: "Retour à l’accueil", skip: "Passer", previous: "Précédent", next: "Continuer", finish: "Commencer l’aventure", step: "Étape", practice: "Choisis une famille puis ouvre l’entraînement.", safe: "Cet exercice n’ajoute ni point, ni victoire, ni visite.",
    families: { classic: "Classique", arkanoid: "Arkanoid", flight: "Vol" },
    steps: [
      { icon: "⌖", title: "Ton voyage", text: "Explore neuf territoires du Salento. Chaque niveau propose une chasse, puis une bataille contre le boss du territoire.", bullets: ["Niveaux 1, 2 et 9 : chasse classique", "Niveaux 3, 5 et 7 : Arkanoid", "Niveaux 4, 6 et 8 : vol vertical"] },
      { icon: "✦", title: "Apprends en jouant", text: "Les commandes changent selon la famille. Fais le véritable exercice interactif avant de commencer.", bullets: ["Déplacer Aracne", "Réussir un rebond avec la barre", "Rejoindre la cible indiquée"] },
      { icon: "⚔", title: "Chasse, puis bataille", text: "Lis l’énigme de Tarantula et rejoins le bon lieu. Dix découvertes ouvrent la bataille.", bullets: ["Évite ennemis et obstacles", "Ramasse les bonus alimentaires", "Tourne le téléphone lorsque la bataille le demande"] },
      { icon: "◇", title: "Tes découvertes", text: "Une victoire révèle la carte culturelle du territoire : illustration, anecdote et accès à sa carte réelle.", bullets: ["Les cartes secrètes restent masquées", "Rejouer ne retire aucune découverte", "Le souvenir gagné dans le jeu reste protégé"] },
      { icon: "▤", title: "Du jeu au monde réel", text: "Collection et passeport sont distincts. Posséder une carte ne prouve jamais une visite.", bullets: ["QR partenaire autorisé : carte + visite du lieu", "Carte physique : carte seulement", "Échange : carte seulement"] },
      { icon: "⇄", title: "Échange tes doubles", text: "Affiche une offre sur un téléphone. L’autre joueur la scanne, accepte, puis montre le reçu à l’expéditeur.", bullets: ["Deux téléphones, aucun compte", "Offre valable quinze minutes", "Un échange ne débloque ni niveau ni visite"] },
    ],
  },
  it: {
    guide: "Guida al gioco", back: "Torna alla home", skip: "Salta", previous: "Indietro", next: "Continua", finish: "Inizia l’avventura", step: "Tappa", practice: "Scegli una famiglia e apri l’allenamento.", safe: "L’esercizio non aggiunge punti, vittorie o visite.",
    families: { classic: "Classico", arkanoid: "Arkanoid", flight: "Volo" },
    steps: [
      { icon: "⌖", title: "Il tuo viaggio", text: "Esplora nove territori del Salento. Ogni livello propone una caccia e poi la battaglia contro il boss.", bullets: ["Livelli 1, 2 e 9: caccia classica", "Livelli 3, 5 e 7: Arkanoid", "Livelli 4, 6 e 8: volo verticale"] },
      { icon: "✦", title: "Impara giocando", text: "I comandi cambiano secondo la famiglia. Prova il vero esercizio interattivo prima di iniziare.", bullets: ["Muovere Aracne", "Riuscire in un rimbalzo con la barra", "Raggiungere il bersaglio indicato"] },
      { icon: "⚔", title: "Caccia, poi battaglia", text: "Leggi l’enigma di Tarantula e raggiungi il luogo giusto. Dieci scoperte aprono la battaglia.", bullets: ["Evita nemici e ostacoli", "Raccogli i bonus alimentari", "Ruota il telefono quando richiesto"] },
      { icon: "◇", title: "Le tue scoperte", text: "La vittoria rivela la carta culturale del territorio con immagine, aneddoto e mappa reale.", bullets: ["Le carte segrete restano nascoste", "Rigiocare non cancella le scoperte", "Il ricordo vinto nel gioco resta protetto"] },
      { icon: "▤", title: "Dal gioco al mondo reale", text: "Collezione e passaporto sono distinti. Possedere una carta non prova una visita.", bullets: ["QR partner autorizzato: carta + visita", "Carta fisica: solo carta", "Scambio: solo carta"] },
      { icon: "⇄", title: "Scambia i doppioni", text: "Mostra l’offerta su un telefono. L’altro giocatore la scansiona, accetta e mostra la ricevuta.", bullets: ["Due telefoni, nessun account", "Offerta valida quindici minuti", "Lo scambio non sblocca livelli o visite"] },
    ],
  },
  en: {
    guide: "Game guide", back: "Back to home", skip: "Skip", previous: "Previous", next: "Continue", finish: "Start the adventure", step: "Step", practice: "Choose a family, then open its practice.", safe: "Practice adds no score, victory or visit.",
    families: { classic: "Classic", arkanoid: "Arkanoid", flight: "Flight" },
    steps: [
      { icon: "⌖", title: "Your journey", text: "Explore nine Salento territories. Each level has a hunt followed by a battle against its boss.", bullets: ["Levels 1, 2 and 9: classic hunt", "Levels 3, 5 and 7: Arkanoid", "Levels 4, 6 and 8: vertical flight"] },
      { icon: "✦", title: "Learn by playing", text: "Controls change with each family. Try the real interactive practice before starting.", bullets: ["Move Aracne", "Bounce on the paddle", "Reach the marked target"] },
      { icon: "⚔", title: "Hunt, then battle", text: "Read Tarantula’s clue and reach the right place. Ten discoveries open the battle.", bullets: ["Avoid enemies and obstacles", "Collect food bonuses", "Rotate your phone when battle asks"] },
      { icon: "◇", title: "Your discoveries", text: "Victory reveals the territory’s cultural card with an illustration, short fact and real map.", bullets: ["Secret cards stay hidden", "Replaying removes nothing", "Your in-game souvenir stays protected"] },
      { icon: "▤", title: "From game to real world", text: "Collection and passport are separate. Owning a card never proves a visit.", bullets: ["Authorised partner QR: card + place visit", "Physical card: card only", "Trade: card only"] },
      { icon: "⇄", title: "Trade your duplicates", text: "Show an offer on one phone. The other player scans, accepts and shows the receipt back.", bullets: ["Two phones, no account", "Offer valid for fifteen minutes", "A trade unlocks no level or visit"] },
    ],
  },
  es: {
    guide: "Guía del juego", back: "Volver al inicio", skip: "Omitir", previous: "Anterior", next: "Continuar", finish: "Empezar la aventura", step: "Etapa", practice: "Elige una familia y abre el entrenamiento.", safe: "El ejercicio no añade puntos, victorias ni visitas.",
    families: { classic: "Clásico", arkanoid: "Arkanoid", flight: "Vuelo" },
    steps: [
      { icon: "⌖", title: "Tu viaje", text: "Explora nueve territorios del Salento. Cada nivel tiene una caza y una batalla contra su jefe.", bullets: ["Niveles 1, 2 y 9: caza clásica", "Niveles 3, 5 y 7: Arkanoid", "Niveles 4, 6 y 8: vuelo vertical"] },
      { icon: "✦", title: "Aprende jugando", text: "Los controles cambian según la familia. Prueba el ejercicio interactivo real antes de empezar.", bullets: ["Mover a Aracne", "Rebotar con la barra", "Alcanzar el objetivo indicado"] },
      { icon: "⚔", title: "Caza y después batalla", text: "Lee la pista de Tarantula y alcanza el lugar correcto. Diez descubrimientos abren la batalla.", bullets: ["Evita enemigos y obstáculos", "Recoge bonus de comida", "Gira el teléfono cuando se indique"] },
      { icon: "◇", title: "Tus descubrimientos", text: "La victoria revela la tarjeta cultural del territorio con imagen, anécdota y mapa real.", bullets: ["Las tarjetas secretas siguen ocultas", "Repetir no elimina descubrimientos", "El recuerdo ganado queda protegido"] },
      { icon: "▤", title: "Del juego al mundo real", text: "Colección y pasaporte son distintos. Tener una tarjeta nunca demuestra una visita.", bullets: ["QR autorizado: tarjeta + visita", "Tarjeta física: solo tarjeta", "Intercambio: solo tarjeta"] },
      { icon: "⇄", title: "Intercambia duplicados", text: "Muestra una oferta en un teléfono. El otro jugador la escanea, acepta y devuelve el recibo.", bullets: ["Dos teléfonos, sin cuenta", "Oferta válida quince minutos", "Intercambiar no desbloquea niveles ni visitas"] },
    ],
  },
} as const;

export default function GameGuidePage() {
  const navigate = useNavigate();
  const language = (LANG in copy ? LANG : "fr") as keyof typeof copy;
  const t = copy[language];
  const [index, setIndex] = useState(0);
  const [family, setFamily] = useState<Family>("classic");
  const practiceHost = useRef<HTMLDivElement>(null);
  const current = t.steps[index];
  const last = index === t.steps.length - 1;

  useEffect(() => {
    if (index !== 1 || !practiceHost.current) return undefined;
    const practice = attachPractice({
      host: practiceHost.current,
      family,
      sprite: withBase("level4-flight/assets/bird.png"),
    });
    return () => practice.dispose();
  }, [family, index]);

  function leave(status: "completed" | "skipped") {
    try { window.localStorage.setItem(STORAGE_KEY, status); } catch { /* guide remains usable */ }
    navigate("/");
  }

  return (
    <main className="game-guide">
      <div className="game-guide__shell">
        <nav className="game-guide__top">
          <button type="button" className="game-guide__text-button" onClick={() => navigate("/")}>← {t.back}</button>
          <LanguageSelect />
        </nav>

        <header className="game-guide__progress">
          <div><span>HIRUNDU</span><strong>{t.guide}</strong></div>
          <p>{t.step} {index + 1} / {t.steps.length}</p>
          <div className="game-guide__bar" aria-hidden="true"><span style={{ width: `${((index + 1) / t.steps.length) * 100}%` }} /></div>
        </header>

        <article className="game-guide__card" aria-live="polite">
          <div className="game-guide__icon" aria-hidden="true">{current.icon}</div>
          <h1>{current.title}</h1>
          <p className="game-guide__lead">{current.text}</p>
          <ul>{current.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>

          {index === 1 ? (
            <section className="game-guide__practice" aria-label={t.practice}>
              <p>{t.practice}</p>
              <div className="game-guide__families">
                {(Object.keys(t.families) as Family[]).map((id) => (
                  <button type="button" key={id} aria-pressed={family === id} onClick={() => setFamily(id)}>{t.families[id]}</button>
                ))}
              </div>
              <div ref={practiceHost} className="game-guide__practice-launch" />
              <small>{t.safe}</small>
            </section>
          ) : null}

          {index === 4 ? (
            <div className="game-guide__rule-grid" aria-label={current.title}>
              <span><b>QR</b><small>{current.bullets[0]}</small></span>
              <span><b>▣</b><small>{current.bullets[1]}</small></span>
              <span><b>⇄</b><small>{current.bullets[2]}</small></span>
            </div>
          ) : null}
        </article>

        <footer className="game-guide__actions">
          <button type="button" className="game-guide__skip" onClick={() => leave("skipped")}>{t.skip}</button>
          <div>
            {index > 0 ? <button type="button" onClick={() => setIndex((value) => value - 1)}>{t.previous}</button> : null}
            <button type="button" className="game-guide__primary" onClick={() => last ? leave("completed") : setIndex((value) => value + 1)}>{last ? t.finish : t.next}</button>
          </div>
        </footer>
      </div>
    </main>
  );
}
