import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import QRCode from "qrcode";
import LanguageSelect from "../ui/LanguageSelect";
import QrScanner from "../features/qr/components/QrScanner";
import { LANG } from "../i18n.js";
import { DISCOVERY_CARDS } from "../features/bonus/discoveryCards";
import { BONUS_MAPS, type BonusKey } from "../features/bonus/bonusData";
import {
  acceptCardOffer,
  cancelPendingOffer,
  completeCardReceipt,
  createCardOffer,
  finalizeCardConfirmation,
  getCardOrigins,
  inspectCardOffer,
  readCardInventory,
  takeQueuedCardQr,
  type CardOrigin,
} from "../features/bonus/cardTrade";
import { withBase } from "../utils/basePath.js";
import "./CardTradePage.css";

const copy = {
  fr: {
    title: "Collection & échanges QR", intro: "Une seule collection pour les découvertes du jeu, les cartes physiques, les QR partenaires et les échanges entre joueurs.",
    send: "Envoyer un double", receive: "Scanner / recevoir", field: "Cartes sur place", copies: "exemplaires", create: "Créer le QR d’offre", scan: "Scanner un QR HIRUNDU", scanReceipt: "Scanner le reçu", confirm: "Accepter cette carte", cancel: "Annuler l’offre", done: "Transfert terminé.", received: "Carte reçue. Montre maintenant ce reçu à l’expéditeur.",
    test: "Créer un double de test", testHelp: "Essai uniquement : aucune visite réelle n’est validée.", invalid: "QR refusé, inconnu ou expiré.", expires: "Le QR d’échange expire après 15 minutes.", back: "Retour aux cartes", origins: "Provenance", already: "Ce code a déjà été utilisé sur ce téléphone.", partnerAdded: "Carte partenaire ajoutée et visite QR inscrite dans le passeport de test.", physicalAdded: "Carte physique ajoutée. Aucune visite n’a été validée.", fieldIntro: "Affiche un QR sur un téléphone, puis scanne-le avec l’autre. Ces deux codes sont des prototypes réservés à la branche de test.", visitYes: "Valide la visite QR", visitNo: "Ne valide pas une visite", collectionRule: "Posséder une carte ne prouve jamais une visite. Seul un QR partenaire autorisé peut aussi compléter le passeport réel.", noCards: "Joue un niveau ou scanne une carte pour commencer la collection.", receiptReady: "Demande enregistrée. Montre ce reçu à l’expéditeur. La carte ne sera ajoutée qu’après sa confirmation.", senderConfirmed: "Double débité. Montre ce QR final au destinataire pour créditer sa carte.", finalConfirm: "Confirmation finale", protocol: "Échange en 3 étapes : offre → reçu → confirmation finale. Une offre n’est finalisée qu’une fois sur l’appareil expéditeur et le QR final est lié à l’appareil destinataire. Sans serveur, l’unicité globale entre appareils ne peut pas être garantie.",
  },
  it: {
    title: "Collezione e scambi QR", intro: "Un’unica collezione per scoperte di gioco, carte fisiche, QR partner e scambi tra giocatori.",
    send: "Invia un doppione", receive: "Scansiona / ricevi", field: "Carte sul posto", copies: "copie", create: "Crea il QR offerta", scan: "Scansiona un QR HIRUNDU", scanReceipt: "Scansiona la ricevuta", confirm: "Accetta questa carta", cancel: "Annulla offerta", done: "Trasferimento completato.", received: "Carta ricevuta. Mostra ora questa ricevuta al mittente.",
    test: "Crea un doppione di prova", testHelp: "Solo prova: nessuna visita reale viene convalidata.", invalid: "QR rifiutato, sconosciuto o scaduto.", expires: "Il QR di scambio scade dopo 15 minuti.", back: "Torna alle carte", origins: "Provenienza", already: "Questo codice è già stato usato su questo telefono.", partnerAdded: "Carta partner aggiunta e visita QR registrata nel passaporto di prova.", physicalAdded: "Carta fisica aggiunta. Nessuna visita è stata convalidata.", fieldIntro: "Mostra un QR su un telefono e scansionalo con l’altro. Questi codici sono prototipi del ramo di test.", visitYes: "Convalida la visita QR", visitNo: "Non convalida una visita", collectionRule: "Possedere una carta non prova mai una visita. Solo un QR partner autorizzato può completare anche il passaporto reale.", noCards: "Gioca un livello o scansiona una carta per iniziare la collezione.", receiptReady: "Richiesta registrata. Mostra questa ricevuta al mittente. La carta verrà aggiunta solo dopo la sua conferma.", senderConfirmed: "Doppione addebitato. Mostra questo QR finale al destinatario per accreditare la carta.", finalConfirm: "Conferma finale", protocol: "Scambio in 3 passaggi: offerta → ricevuta → conferma finale. Un’offerta viene finalizzata una sola volta sul dispositivo del mittente e il QR finale è legato al dispositivo destinatario. Senza server non si può garantire l’unicità globale tra dispositivi.",
  },
  en: {
    title: "QR collection & trades", intro: "One collection for in-game discoveries, physical cards, partner QR codes and player-to-player trades.",
    send: "Send a duplicate", receive: "Scan / receive", field: "On-site cards", copies: "copies", create: "Create offer QR", scan: "Scan a HIRUNDU QR", scanReceipt: "Scan receipt", confirm: "Accept this card", cancel: "Cancel offer", done: "Transfer complete.", received: "Card received. Now show this receipt to the sender.",
    test: "Create a test duplicate", testHelp: "Test only: no real visit is validated.", invalid: "QR rejected, unknown or expired.", expires: "Trade QR codes expire after 15 minutes.", back: "Back to cards", origins: "Origin", already: "This code has already been used on this phone.", partnerAdded: "Partner card added and QR visit recorded in the test passport.", physicalAdded: "Physical card added. No visit was validated.", fieldIntro: "Show a QR on one phone and scan it with the other. These two codes are test-branch prototypes.", visitYes: "Validates the QR visit", visitNo: "Does not validate a visit", collectionRule: "Owning a card never proves a visit. Only an authorised partner QR can also complete the real-world passport.", noCards: "Play a level or scan a card to start the collection.", receiptReady: "Request recorded. Show this receipt to the sender. The card is added only after sender confirmation.", senderConfirmed: "Duplicate deducted. Show this final QR to the recipient to credit the card.", finalConfirm: "Final confirmation", protocol: "Three-step trade: offer → receipt → final confirmation. An offer is finalized only once on the sender device and the final QR is bound to the recipient device. Without a server, global uniqueness across devices cannot be guaranteed.",
  },
  es: {
    title: "Colección e intercambios QR", intro: "Una sola colección para descubrimientos del juego, tarjetas físicas, QR de socios e intercambios entre jugadores.",
    send: "Enviar un duplicado", receive: "Escanear / recibir", field: "Tarjetas in situ", copies: "copias", create: "Crear QR de oferta", scan: "Escanear un QR HIRUNDU", scanReceipt: "Escanear recibo", confirm: "Aceptar esta tarjeta", cancel: "Cancelar oferta", done: "Transferencia completada.", received: "Tarjeta recibida. Muestra ahora este recibo al remitente.",
    test: "Crear un duplicado de prueba", testHelp: "Solo prueba: no se valida ninguna visita real.", invalid: "QR rechazado, desconocido o caducado.", expires: "El QR de intercambio caduca después de 15 minutos.", back: "Volver a las tarjetas", origins: "Procedencia", already: "Este código ya se utilizó en este teléfono.", partnerAdded: "Tarjeta de socio añadida y visita QR registrada en el pasaporte de prueba.", physicalAdded: "Tarjeta física añadida. No se validó ninguna visita.", fieldIntro: "Muestra un QR en un teléfono y escanéalo con el otro. Estos códigos son prototipos de la rama de prueba.", visitYes: "Valida la visita QR", visitNo: "No valida una visita", collectionRule: "Tener una tarjeta nunca demuestra una visita. Solo un QR de socio autorizado puede completar también el pasaporte real.", noCards: "Juega un nivel o escanea una tarjeta para empezar la colección.", receiptReady: "Solicitud registrada. Muestra este recibo al remitente. La tarjeta solo se añadirá tras su confirmación.", senderConfirmed: "Duplicado descontado. Muestra este QR final al destinatario para acreditar la tarjeta.", finalConfirm: "Confirmación final", protocol: "Intercambio en 3 pasos: oferta → recibo → confirmación final. Una oferta se finaliza una sola vez en el dispositivo remitente y el QR final queda vinculado al dispositivo destinatario. Sin servidor no puede garantizarse la unicidad global entre dispositivos.",
  },
};

const originLabels: Record<string, Record<CardOrigin, string>> = {
  fr: { game: "Jeu", partner: "Partenaire", physical: "Carte physique", exchange: "Échange", test: "Test", legacy: "Ancienne collection" },
  it: { game: "Gioco", partner: "Partner", physical: "Carta fisica", exchange: "Scambio", test: "Test", legacy: "Collezione precedente" },
  en: { game: "Game", partner: "Partner", physical: "Physical card", exchange: "Trade", test: "Test", legacy: "Previous collection" },
  es: { game: "Juego", partner: "Socio", physical: "Tarjeta física", exchange: "Intercambio", test: "Prueba", legacy: "Colección anterior" },
};

type Mode = "send" | "receive";

export default function CardTradePage() {
  const location = useLocation();
  const requestedCard = new URLSearchParams(location.search).get("card") as BonusKey | null;
  const language = (LANG in copy ? LANG : "fr") as keyof typeof copy;
  const t = copy[language];
  const labels = originLabels[language] ?? originLabels.fr;
  const [inventory, setInventory] = useState(readCardInventory);
  const [mode, setMode] = useState<Mode>("send");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [qrKind, setQrKind] = useState<"offer" | "confirmation" | null>(null);
  const [incoming, setIncoming] = useState<{ token: string; card: BonusKey } | null>(null);
  const [receiptQr, setReceiptQr] = useState("");
  const [message, setMessage] = useState("");
  const cards = (Object.entries(inventory.cards) as [BonusKey, number][])
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => {
      if (requestedCard && a === requestedCard) return -1;
      if (requestedCard && b === requestedCard) return 1;
      return 0;
    });

  useEffect(() => {
    const refresh = () => setInventory(readCardInventory());
    window.addEventListener("hirundu:cards", refresh);
    return () => window.removeEventListener("hirundu:cards", refresh);
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
      setQrKind("offer");
      setMessage("");
    } catch {
      setMessage(t.invalid);
    }
  }

  async function processScan(text: string) {
    setScannerOpen(false);

    try {
      const offer = inspectCardOffer(text);
      setIncoming({ token: text, card: offer.card });
      setMode("receive");
      setMessage("");
      return;
    } catch {
      // Continue: the QR may be a receiver receipt or the final confirmation.
    }

    try {
      const result = completeCardReceipt(text);
      setInventory(result.state);
      setQr(await QRCode.toDataURL(result.token, { width: 300, margin: 2, errorCorrectionLevel: "M" }));
      setQrKind("confirmation");
      setMessage(t.senderConfirmed);
      return;
    } catch {
      // Continue with the final receiver confirmation path.
    }

    try {
      const result = finalizeCardConfirmation(text);
      setInventory(result.state);
      setReceiptQr("");
      setIncoming(null);
      setMessage(t.done);
      return;
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
      setMessage(t.receiptReady);
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
    ["send", t.send], ["receive", t.receive],
  ] as const, [t]);

  return (
    <main className="card-trade">
      <div className="card-trade__inner">
        <nav><a href="#/bonus">← {t.back}</a><LanguageSelect /></nav>
        <header><span>HIRUNDU · COLLECTION</span><h1>{t.title}</h1><p>{t.intro}</p></header>
        <p className="card-trade__rule">{t.collectionRule}</p>
        <p className="card-trade__rule"><small>{t.protocol}</small></p>
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
            {qr ? (
              <div className="card-trade__qr">
                <img src={qr} alt={qrKind === "confirmation" ? t.finalConfirm : t.create} />
                <p>{qrKind === "confirmation" ? t.senderConfirmed : t.expires}</p>
                {qrKind === "offer" ? <button className="trade-primary" onClick={() => setScannerOpen(true)}>{t.scanReceipt}</button> : null}
                {qrKind === "offer" ? <button onClick={() => { cancelPendingOffer(); setQr(""); setQrKind(null); }}>{t.cancel}</button> : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {mode === "receive" ? (
          <section>
            <h2>{t.receive}</h2>
            <button className="trade-primary" onClick={() => setScannerOpen(true)}>{t.scan}</button>
            {incoming ? <div>{renderCard(incoming.card)}<button className="trade-primary" onClick={() => void accept()}>{t.confirm}</button></div> : null}
            {receiptQr ? <div className="card-trade__qr"><img src={receiptQr} alt={t.scanReceipt} /><p>{t.receiptReady}</p><p><small>{t.protocol}</small></p></div> : null}
          </section>
        ) : null}

        {scannerOpen ? <QrScanner onResult={(text) => { void processScan(text); }} onClose={() => setScannerOpen(false)} onError={() => setMessage(t.invalid)} /> : null}
      </div>
    </main>
  );
}

