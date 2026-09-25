import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import LanguageSelect from "../ui/LanguageSelect";
import QrScanner from "../features/qr/components/QrScanner";
import { LANG } from "../i18n.js";
import { DISCOVERY_CARDS } from "../features/bonus/discoveryCards";
import { BONUS_MAPS, type BonusKey } from "../features/bonus/bonusData";
import {
  FIELD_CARD_SCENARIOS,
  acceptCardOffer,
  addTestDuplicate,
  cancelPendingOffer,
  completeCardReceipt,
  createCardOffer,
  getCardOrigins,
  inspectCardOffer,
  readCardInventory,
  redeemFieldCardQr,
  takeQueuedCardQr,
  type CardOrigin,
  type FieldCardScenario,
} from "../features/bonus/cardTrade";
import { withBase } from "../utils/basePath.js";
import "./CardTradePage.css";

const copy = {
  fr: {
    title: "Collection & échanges QR", intro: "Une seule collection pour les découvertes du jeu, les cartes physiques, les QR partenaires et les échanges entre joueurs.",
    send: "Envoyer un double", receive: "Scanner / recevoir", field: "Cartes sur place", copies: "exemplaires", create: "Créer le QR d’offre", scan: "Scanner un QR HIRUNDU", scanReceipt: "Scanner le reçu", confirm: "Accepter cette carte", cancel: "Annuler l’offre", done: "Transfert terminé.", received: "Carte reçue. Montre maintenant ce reçu à l’expéditeur.",
    test: "Créer un double de test", testHelp: "Essai uniquement : aucune visite réelle n’est validée.", invalid: "QR refusé, inconnu ou expiré.", expires: "Le QR d’échange expire après 15 minutes.", back: "Retour aux cartes", origins: "Provenance", already: "Ce code a déjà été utilisé sur ce téléphone.", partnerAdded: "Carte partenaire ajoutée et visite QR inscrite dans le passeport de test.", physicalAdded: "Carte physique ajoutée. Aucune visite n’a été validée.", fieldIntro: "Affiche un QR sur un téléphone, puis scanne-le avec l’autre. Ces deux codes sont des prototypes réservés à la branche de test.", visitYes: "Valide la visite QR", visitNo: "Ne valide pas une visite", collectionRule: "Posséder une carte ne prouve jamais une visite. Seul un QR partenaire autorisé peut aussi compléter le passeport réel.", noCards: "Joue un niveau ou scanne une carte pour commencer la collection.",
  },
  it: {
    title: "Collezione e scambi QR", intro: "Un’unica collezione per scoperte di gioco, carte fisiche, QR partner e scambi tra giocatori.",
    send: "Invia un doppione", receive: "Scansiona / ricevi", field: "Carte sul posto", copies: "copie", create: "Crea il QR offerta", scan: "Scansiona un QR HIRUNDU", scanReceipt: "Scansiona la ricevuta", confirm: "Accetta questa carta", cancel: "Annulla offerta", done: "Trasferimento completato.", received: "Carta ricevuta. Mostra ora questa ricevuta al mittente.",
    test: "Crea un doppione di prova", testHelp: "Solo prova: nessuna visita reale viene convalidata.", invalid: "QR rifiutato, sconosciuto o scaduto.", expires: "Il QR di scambio scade dopo 15 minuti.", back: "Torna alle carte", origins: "Provenienza", already: "Questo codice è già stato usato su questo telefono.", partnerAdded: "Carta partner aggiunta e visita QR registrata nel passaporto di prova.", physicalAdded: "Carta fisica aggiunta. Nessuna visita è stata convalidata.", fieldIntro: "Mostra un QR su un telefono e scansionalo con l’altro. Questi codici sono prototipi del ramo di test.", visitYes: "Convalida la visita QR", visitNo: "Non convalida una visita", collectionRule: "Possedere una carta non prova mai una visita. Solo un QR partner autorizzato può completare anche il passaporto reale.", noCards: "Gioca un livello o scansiona una carta per iniziare la collezione.",
  },
  en: {
    title: "QR collection & trades", intro: "One collection for in-game discoveries, physical cards, partner QR codes and player-to-player trades.",
    send: "Send a duplicate", receive: "Scan / receive", field: "On-site cards", copies: "copies", create: "Create offer QR", scan: "Scan a HIRUNDU QR", scanReceipt: "Scan receipt", confirm: "Accept this card", cancel: "Cancel offer", done: "Transfer complete.", received: "Card received. Now show this receipt to the sender.",
    test: "Create a test duplicate", testHelp: "Test only: no real visit is validated.", invalid: "QR rejected, unknown or expired.", expires: "Trade QR codes expire after 15 minutes.", back: "Back to cards", origins: "Origin", already: "This code has already been used on this phone.", partnerAdded: "Partner card added and QR visit recorded in the test passport.", physicalAdded: "Physical card added. No visit was validated.", fieldIntro: "Show a QR on one phone and scan it with the other. These two codes are test-branch prototypes.", visitYes: "Validates the QR visit", visitNo: "Does not validate a visit", collectionRule: "Owning a card never proves a visit. Only an authorised partner QR can also complete the real-world passport.", noCards: "Play a level or scan a card to start the collection.",
  },
  es: {
    title: "Colección e intercambios QR", intro: "Una sola colección para descubrimientos del juego, tarjetas físicas, QR de socios e intercambios entre jugadores.",
    send: "Enviar un duplicado", receive: "Escanear / recibir", field: "Tarjetas in situ", copies: "copias", create: "Crear QR de oferta", scan: "Escanear un QR HIRUNDU", scanReceipt: "Escanear recibo", confirm: "Aceptar esta tarjeta", cancel: "Cancelar oferta", done: "Transferencia completada.", received: "Tarjeta recibida. Muestra ahora este recibo al remitente.",
    test: "Crear un duplicado de prueba", testHelp: "Solo prueba: no se valida ninguna visita real.", invalid: "QR rechazado, desconocido o caducado.", expires: "El QR de intercambio caduca después de 15 minutos.", back: "Volver a las tarjetas", origins: "Procedencia", already: "Este código ya se utilizó en este teléfono.", partnerAdded: "Tarjeta de socio añadida y visita QR registrada en el pasaporte de prueba.", physicalAdded: "Tarjeta física añadida. No se validó ninguna visita.", fieldIntro: "Muestra un QR en un teléfono y escanéalo con el otro. Estos códigos son prototipos de la rama de prueba.", visitYes: "Valida la visita QR", visitNo: "No valida una visita", collectionRule: "Tener una tarjeta nunca demuestra una visita. Solo un QR de socio autorizado puede completar también el pasaporte real.", noCards: "Juega un nivel o escanea una tarjeta para empezar la colección.",
  },
};

const originLabels: Record<string, Record<CardOrigin, string>> = {
  fr: { game: "Jeu", partner: "Partenaire", physical: "Carte physique", exchange: "Échange", test: "Test", legacy: "Ancienne collection" },
  it: { game: "Gioco", partner: "Partner", physical: "Carta fisica", exchange: "Scambio", test: "Test", legacy: "Collezione precedente" },
  en: { game: "Game", partner: "Partner", physical: "Physical card", exchange: "Trade", test: "Test", legacy: "Previous collection" },
  es: { game: "Juego", partner: "Socio", physical: "Tarjeta física", exchange: "Intercambio", test: "Prueba", legacy: "Colección anterior" },
};

type Mode = "send" | "receive" | "field";

export default function CardTradePage() {
  const language = (LANG in copy ? LANG : "fr") as keyof typeof copy;
  const t = copy[language];
  const labels = originLabels[language] ?? originLabels.fr;
  const [inventory, setInventory] = useState(readCardInventory);
  const [mode, setMode] = useState<Mode>("send");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [incoming, setIncoming] = useState<{ token: string; card: BonusKey } | null>(null);
  const [receiptQr, setReceiptQr] = useState("");
  const [message, setMessage] = useState("");
  const [fieldQrs, setFieldQrs] = useState<Record<string, string>>({});
  const cards = (Object.entries(inventory.cards) as [BonusKey, number][]).filter(([, count]) => count > 0);

  useEffect(() => {
    const refresh = () => setInventory(readCardInventory());
    window.addEventListener("hirundu:cards", refresh);
    return () => window.removeEventListener("hirundu:cards", refresh);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all(FIELD_CARD_SCENARIOS.map(async (scenario) => [
      scenario.id,
      await QRCode.toDataURL(scenario.token, { width: 280, margin: 2, errorCorrectionLevel: "M" }),
    ] as const)).then((entries) => { if (active) setFieldQrs(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const queued = takeQueuedCardQr();
    if (queued) processScan(queued);
    // The queued value must be consumed exactly once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function makeOffer(card: BonusKey) {
    try {
      const result = createCardOffer(card);
      setQr(await QRCode.toDataURL(result.token, { width: 300, margin: 2, errorCorrectionLevel: "M" }));
      setMessage("");
    } catch {
      setMessage(t.invalid);
    }
  }

  function processScan(text: string) {
    setScannerOpen(false);
    try {
      const result = redeemFieldCardQr(text);
      setInventory(result.state);
      setMode("field");
      setMessage(result.alreadyRedeemed ? t.already : result.passportValidated ? t.partnerAdded : t.physicalAdded);
      return;
    } catch {
      // It may be a direct trade offer or receipt instead of a field card.
    }

    try {
      const offer = inspectCardOffer(text);
      setIncoming({ token: text, card: offer.card });
      setMode("receive");
      setMessage("");
      return;
    } catch {
      // Continue with the receipt path.
    }

    try {
      const result = completeCardReceipt(text);
      setMessage(t.done);
      setQr("");
      setInventory(result.state);
    } catch {
      setMessage(t.invalid);
    }
  }

  async function accept() {
    if (!incoming) return;
    try {
      const result = acceptCardOffer(incoming.token);
      setReceiptQr(await QRCode.toDataURL(result.token, { width: 300, margin: 2, errorCorrectionLevel: "M" }));
      setIncoming(null);
      setMessage(t.received);
    } catch {
      setMessage(t.invalid);
    }
  }

  function renderCard(key: BonusKey, count?: number) {
    const data = DISCOVERY_CARDS[key];
    const origins = count === undefined ? [] : Object.entries(getCardOrigins(inventory, key)) as [CardOrigin, number][];
    return (
      <article className="card-trade__card">
        <img src={withBase(`assets/${data.image}`)} alt="" />
        <div>
          <h3>{data.name}</h3>
          <p>{BONUS_MAPS[key].title}</p>
          {count !== undefined ? <strong>{count} {t.copies}</strong> : null}
          {origins.length ? (
            <div className="card-trade__origins" aria-label={t.origins}>
              {origins.map(([origin, amount]) => <span key={origin}>{labels[origin]} · {amount}</span>)}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  const tabs = useMemo(() => [
    ["send", t.send], ["receive", t.receive], ["field", t.field],
  ] as const, [t]);

  return (
    <main className="card-trade">
      <div className="card-trade__inner">
        <nav><a href="#/trade-preview">← {t.back}</a><LanguageSelect /></nav>
        <header><span>HIRUNDU · COLLECTION</span><h1>{t.title}</h1><p>{t.intro}</p></header>
        <p className="card-trade__rule">{t.collectionRule}</p>
        <div className="card-trade__tabs">
          {tabs.map(([id, label]) => <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}
        </div>
        {message ? <p className="card-trade__status" role="status">{message}</p> : null}

        {mode === "send" ? (
          <section>
            <h2>{t.send}</h2>
            {!cards.length ? <p>{t.noCards}</p> : null}
            {cards.map(([key, count]) => (
              <div key={key}>{renderCard(key, count)}{count > 1 ? <button className="trade-primary" onClick={() => void makeOffer(key)}>{t.create}</button> : null}</div>
            ))}
            <button onClick={() => setInventory(addTestDuplicate())}>{t.test}</button>
            <p><small>{t.testHelp}</small></p>
            {qr ? (
              <div className="card-trade__qr"><img src={qr} alt={t.create} /><p>{t.expires}</p><button className="trade-primary" onClick={() => setScannerOpen(true)}>{t.scanReceipt}</button><button onClick={() => { cancelPendingOffer(); setQr(""); }}>{t.cancel}</button></div>
            ) : null}
          </section>
        ) : null}

        {mode === "receive" ? (
          <section>
            <h2>{t.receive}</h2>
            <button className="trade-primary" onClick={() => setScannerOpen(true)}>{t.scan}</button>
            {incoming ? <div>{renderCard(incoming.card)}<button className="trade-primary" onClick={() => void accept()}>{t.confirm}</button></div> : null}
            {receiptQr ? <div className="card-trade__qr"><img src={receiptQr} alt={t.scanReceipt} /><p>{t.received}</p></div> : null}
          </section>
        ) : null}

        {mode === "field" ? (
          <section>
            <h2>{t.field}</h2>
            <p>{t.fieldIntro}</p>
            <button className="trade-primary" onClick={() => setScannerOpen(true)}>{t.scan}</button>
            <div className="card-trade__field-grid">
              {FIELD_CARD_SCENARIOS.map((scenario) => <FieldScenario key={scenario.id} scenario={scenario} qr={fieldQrs[scenario.id]} yes={t.visitYes} no={t.visitNo} />)}
            </div>
          </section>
        ) : null}

        {scannerOpen ? <QrScanner onResult={processScan} onClose={() => setScannerOpen(false)} onError={() => setMessage(t.invalid)} /> : null}
      </div>
    </main>
  );
}

function FieldScenario({ scenario, qr, yes, no }: { scenario: FieldCardScenario; qr?: string; yes: string; no: string }) {
  return (
    <article className="card-trade__field-card">
      {qr ? <img src={qr} alt={scenario.title} /> : null}
      <div><h3>{scenario.title}</h3><p>{scenario.detail}</p><strong>{scenario.validatesVisit ? `✓ ${yes}` : `— ${no}`}</strong></div>
    </article>
  );
}
