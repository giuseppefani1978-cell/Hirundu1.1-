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
  finalizeSenderAcknowledgement,
  finishReceiverTrade,
  getCardOrigins,
  getResumableCompletionAckTrade,
  getResumableOutgoingCardTrade,
  getResumableReceiptTrade,
  hasUnresolvedExpiredOutgoingCardTrade,
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
    test: "Créer un double de test", testHelp: "Essai uniquement : aucune visite réelle n’est validée.", invalid: "QR refusé, inconnu ou expiré.", expires: "Le QR d’échange expire après 15 minutes.", back: "Retour aux cartes", origins: "Provenance", already: "Ce code a déjà été utilisé sur ce téléphone.", partnerAdded: "Carte partenaire ajoutée et visite QR inscrite dans le passeport de test.", physicalAdded: "Carte physique ajoutée. Aucune visite n’a été validée.", fieldIntro: "Affiche un QR sur un téléphone, puis scanne-le avec l’autre. Ces deux codes sont des prototypes réservés à la branche de test.", visitYes: "Valide la visite QR", visitNo: "Ne valide pas une visite", collectionRule: "Posséder une carte ne prouve jamais une visite. Seul un QR partenaire autorisé peut aussi compléter le passeport réel.", noCards: "Joue un niveau ou scanne une carte pour commencer la collection.", receiptReady: "Demande enregistrée. Montre ce reçu à l’expéditeur. La carte ne sera ajoutée qu’après sa confirmation.", senderConfirmed: "Double débité. Montre ce QR final au destinataire pour créditer sa carte.", receiverDone: "Carte ajoutée à ta collection. Montre ce reçu final à l’expéditeur pour fermer l’échange sur les deux téléphones.", finalConfirm: "Confirmation finale", finalReceipt: "Reçu final", myCards: "Mes cartes", protocol: "Échange sécurisé en 4 étapes : offre signée → reçu signé → confirmation du transfert → reçu final du destinataire. Validité maximale : 15 minutes.", remaining: "Temps restant", generating: "Génération du QR…", security: "Le QR final ne peut être crédité que sur le téléphone ayant créé le reçu. Sans serveur, cela protège contre le transfert ordinaire du QR mais ne constitue pas un DRM inviolable.", expiredUncertain: "Une confirmation d’échange a expiré après le débit. Ce téléphone ne peut pas savoir si le destinataire l’a déjà finalisée. Aucun remboursement automatique n’est effectué.",
  },
  it: {
    title: "Collezione e scambi QR", intro: "Un’unica collezione per scoperte di gioco, carte fisiche, QR partner e scambi tra giocatori.",
    send: "Invia un doppione", receive: "Scansiona / ricevi", field: "Carte sul posto", copies: "copie", create: "Crea il QR offerta", scan: "Scansiona un QR HIRUNDU", scanReceipt: "Scansiona la ricevuta", confirm: "Accetta questa carta", cancel: "Annulla offerta", done: "Trasferimento completato.", received: "Carta ricevuta. Mostra ora questa ricevuta al mittente.",
    test: "Crea un doppione di prova", testHelp: "Solo prova: nessuna visita reale viene convalidata.", invalid: "QR rifiutato, sconosciuto o scaduto.", expires: "Il QR di scambio scade dopo 15 minuti.", back: "Torna alle carte", origins: "Provenienza", already: "Questo codice è già stato usato su questo telefono.", partnerAdded: "Carta partner aggiunta e visita QR registrata nel passaporto di prova.", physicalAdded: "Carta fisica aggiunta. Nessuna visita è stata convalidata.", fieldIntro: "Mostra un QR su un telefono e scansionalo con l’altro. Questi codici sono prototipi del ramo di test.", visitYes: "Convalida la visita QR", visitNo: "Non convalida una visita", collectionRule: "Possedere una carta non prova mai una visita. Solo un QR partner autorizzato può completare anche il passaporto reale.", noCards: "Gioca un livello o scansiona una carta per iniziare la collezione.", receiptReady: "Richiesta registrata. Mostra questa ricevuta al mittente. La carta verrà aggiunta solo dopo la sua conferma.", senderConfirmed: "Doppione addebitato. Mostra questo QR finale al destinatario per accreditare la carta.", receiverDone: "Carta aggiunta alla tua collezione. Mostra questa ricevuta finale al mittente per chiudere lo scambio su entrambi i telefoni.", finalConfirm: "Conferma finale", finalReceipt: "Ricevuta finale", myCards: "Le mie carte", protocol: "Scambio sicuro in 4 passaggi: offerta firmata → ricevuta firmata → conferma del trasferimento → ricevuta finale del destinatario. Validità massima: 15 minuti.", remaining: "Tempo rimanente", generating: "Generazione QR…", security: "Il QR finale può essere accreditato solo sul telefono che ha creato la ricevuta. Senza server protegge dalla normale condivisione del QR, ma non è un DRM inviolabile.", expiredUncertain: "Una conferma di scambio è scaduta dopo l’addebito. Questo telefono non può sapere se il destinatario l’ha già finalizzata. Non viene effettuato alcun rimborso automatico.",
  },
  en: {
    title: "QR collection & trades", intro: "One collection for in-game discoveries, physical cards, partner QR codes and player-to-player trades.",
    send: "Send a duplicate", receive: "Scan / receive", field: "On-site cards", copies: "copies", create: "Create offer QR", scan: "Scan a HIRUNDU QR", scanReceipt: "Scan receipt", confirm: "Accept this card", cancel: "Cancel offer", done: "Transfer complete.", received: "Card received. Now show this receipt to the sender.",
    test: "Create a test duplicate", testHelp: "Test only: no real visit is validated.", invalid: "QR rejected, unknown or expired.", expires: "Trade QR codes expire after 15 minutes.", back: "Back to cards", origins: "Origin", already: "This code has already been used on this phone.", partnerAdded: "Partner card added and QR visit recorded in the test passport.", physicalAdded: "Physical card added. No visit was validated.", fieldIntro: "Show a QR on one phone and scan it with the other. These two codes are test-branch prototypes.", visitYes: "Validates the QR visit", visitNo: "Does not validate a visit", collectionRule: "Owning a card never proves a visit. Only an authorised partner QR can also complete the real-world passport.", noCards: "Play a level or scan a card to start the collection.", receiptReady: "Request recorded. Show this receipt to the sender. The card is added only after sender confirmation.", senderConfirmed: "Duplicate deducted. Show this final QR to the recipient to credit the card.", receiverDone: "Card added to your collection. Show this final receipt to the sender to close the trade on both phones.", finalConfirm: "Final confirmation", finalReceipt: "Final receipt", myCards: "My cards", protocol: "Secure four-step trade: signed offer → signed receipt → transfer confirmation → recipient final receipt. Maximum validity: 15 minutes.", remaining: "Time left", generating: "Generating QR…", security: "The final QR can only credit the phone that created the receipt. Without a server this blocks ordinary QR forwarding, but it is not unbreakable DRM.", expiredUncertain: "A trade confirmation expired after the duplicate was deducted. This phone cannot know whether the recipient already finalized it. No automatic refund is performed.",
  },
  es: {
    title: "Colección e intercambios QR", intro: "Una sola colección para descubrimientos del juego, tarjetas físicas, QR de socios e intercambios entre jugadores.",
    send: "Enviar un duplicado", receive: "Escanear / recibir", field: "Tarjetas in situ", copies: "copias", create: "Crear QR de oferta", scan: "Escanear un QR HIRUNDU", scanReceipt: "Escanear recibo", confirm: "Aceptar esta tarjeta", cancel: "Cancelar oferta", done: "Transferencia completada.", received: "Tarjeta recibida. Muestra ahora este recibo al remitente.",
    test: "Crear un duplicado de prueba", testHelp: "Solo prueba: no se valida ninguna visita real.", invalid: "QR rechazado, desconocido o caducado.", expires: "El QR de intercambio caduca después de 15 minutos.", back: "Volver a las tarjetas", origins: "Procedencia", already: "Este código ya se utilizó en este teléfono.", partnerAdded: "Tarjeta de socio añadida y visita QR registrada en el pasaporte de prueba.", physicalAdded: "Tarjeta física añadida. No se validó ninguna visita.", fieldIntro: "Muestra un QR en un teléfono y escanéalo con el otro. Estos códigos son prototipos de la rama de prueba.", visitYes: "Valida la visita QR", visitNo: "No valida una visita", collectionRule: "Tener una tarjeta nunca demuestra una visita. Solo un QR de socio autorizado puede completar también el pasaporte real.", noCards: "Juega un nivel o escanea una tarjeta para empezar la colección.", receiptReady: "Solicitud registrada. Muestra este recibo al remitente. La tarjeta solo se añadirá tras su confirmación.", senderConfirmed: "Duplicado descontado. Muestra este QR final al destinatario para acreditar la tarjeta.", receiverDone: "Tarjeta añadida a tu colección. Muestra este recibo final al remitente para cerrar el intercambio en ambos teléfonos.", finalConfirm: "Confirmación final", finalReceipt: "Recibo final", myCards: "Mis tarjetas", protocol: "Intercambio seguro en 4 pasos: oferta firmada → recibo firmado → confirmación de transferencia → recibo final del destinatario. Validez máxima: 15 minutos.", remaining: "Tiempo restante", generating: "Generando QR…", security: "El QR final solo puede acreditarse en el teléfono que creó el recibo. Sin servidor bloquea el reenvío normal del QR, pero no es un DRM inviolable.", expiredUncertain: "Una confirmación de intercambio caducó después de descontar el duplicado. Este teléfono no puede saber si el destinatario ya la finalizó. No se realiza ningún reembolso automático.",
  },
};

const uxCopy = {
  fr: { senderTab: "J’envoie une carte", receiverTab: "Je reçois une carte", duplicateRule: "Pour échanger une carte, il faut au moins 2 exemplaires de la même carte : 1 reste dans ta collection et le double peut être envoyé.", noDuplicate: "Aucun double disponible : il faut au moins 2 exemplaires de cette carte pour l’échanger.", senderHelp: "Tu envoies un double. Suis les boutons dans l’ordre : l’application te dit exactement quel QR scanner.", receiverHelp: "Tu reçois une carte. Commence par scanner le QR d’offre affiché sur le téléphone de l’expéditeur.", scanOffer: "Scanner le QR d’offre de l’expéditeur", scanReceiverReceipt: "Scanner le reçu du destinataire", scanSenderConfirmation: "Scanner le QR de confirmation de l’expéditeur", scanFinalReceipt: "Scanner le reçu final du destinataire", receiptStep: "Étape 2/4 — Fais scanner ce QR par l’expéditeur. Ensuite, scanne son QR de confirmation.", senderStep: "Étape 3/4 — Fais scanner ce QR par le destinataire, puis scanne son reçu final.", receiverStep: "Étape 4/4 — Carte ajoutée à ta collection. Fais scanner ce reçu final par l’expéditeur.", receiverFinishHelp: "Quand l’expéditeur affiche « Transfert terminé », termine aussi l’échange sur ce téléphone.", finishHere: "Terminer sur ce téléphone" },
  it: { senderTab: "Invio una carta", receiverTab: "Ricevo una carta", duplicateRule: "Per scambiare una carta servono almeno 2 copie della stessa carta: 1 resta nella collezione e il doppione può essere inviato.", noDuplicate: "Nessun doppione disponibile: servono almeno 2 copie di questa carta.", senderHelp: "Stai inviando un doppione. Segui i pulsanti nell’ordine indicato.", receiverHelp: "Stai ricevendo una carta. Inizia scansionando il QR offerta mostrato sul telefono del mittente.", scanOffer: "Scansiona il QR offerta del mittente", scanReceiverReceipt: "Scansiona la ricevuta del destinatario", scanSenderConfirmation: "Scansiona il QR di conferma del mittente", scanFinalReceipt: "Scansiona la ricevuta finale del destinatario", receiptStep: "Passo 2/4 — Fai scansionare questo QR al mittente. Poi scansiona il suo QR di conferma.", senderStep: "Passo 3/4 — Fai scansionare questo QR al destinatario, poi scansiona la sua ricevuta finale.", receiverStep: "Passo 4/4 — Carta aggiunta alla collezione. Fai scansionare questa ricevuta finale al mittente.", receiverFinishHelp: "Quando il mittente vede « Trasferimento completato », termina anche su questo telefono.", finishHere: "Termina su questo telefono" },
  en: { senderTab: "I’m sending a card", receiverTab: "I’m receiving a card", duplicateRule: "To trade a card you need at least 2 copies of the same card: 1 stays in your collection and the duplicate can be sent.", noDuplicate: "No duplicate available: you need at least 2 copies of this card to trade it.", senderHelp: "You are sending a duplicate. Follow the buttons in order; the app tells you which QR to scan next.", receiverHelp: "You are receiving a card. Start by scanning the offer QR shown on the sender’s phone.", scanOffer: "Scan the sender’s offer QR", scanReceiverReceipt: "Scan the recipient receipt", scanSenderConfirmation: "Scan the sender confirmation QR", scanFinalReceipt: "Scan the recipient final receipt", receiptStep: "Step 2/4 — Have the sender scan this QR. Then scan their confirmation QR.", senderStep: "Step 3/4 — Have the recipient scan this QR, then scan their final receipt.", receiverStep: "Step 4/4 — Card added to your collection. Have the sender scan this final receipt.", receiverFinishHelp: "When the sender shows “Transfer complete”, finish the trade on this phone too.", finishHere: "Finish on this phone" },
  es: { senderTab: "Envío una tarjeta", receiverTab: "Recibo una tarjeta", duplicateRule: "Para intercambiar una tarjeta necesitas al menos 2 copias de la misma: 1 queda en tu colección y el duplicado se puede enviar.", noDuplicate: "No hay duplicado disponible: necesitas al menos 2 copias de esta tarjeta.", senderHelp: "Estás enviando un duplicado. Sigue los botones en orden; la app te indica qué QR escanear.", receiverHelp: "Estás recibiendo una tarjeta. Empieza escaneando el QR de oferta del teléfono del remitente.", scanOffer: "Escanear el QR de oferta del remitente", scanReceiverReceipt: "Escanear el recibo del destinatario", scanSenderConfirmation: "Escanear el QR de confirmación del remitente", scanFinalReceipt: "Escanear el recibo final del destinatario", receiptStep: "Paso 2/4 — Haz que el remitente escanee este QR. Luego escanea su QR de confirmación.", senderStep: "Paso 3/4 — Haz que el destinatario escanee este QR y luego escanea su recibo final.", receiverStep: "Paso 4/4 — Tarjeta añadida a tu colección. Haz que el remitente escanee este recibo final.", receiverFinishHelp: "Cuando el remitente muestre « Transferencia completada », termina también en este teléfono.", finishHere: "Terminar en este teléfono" },
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
  const t = { ...copy[language], ...uxCopy[language] };
  const labels = originLabels[language] ?? originLabels.fr;
  const [inventory, setInventory] = useState(readCardInventory);
  const [mode, setMode] = useState<Mode>("send");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [qrKind, setQrKind] = useState<"offer" | "confirmation" | null>(null);
  const [qrCard, setQrCard] = useState<BonusKey | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [incoming, setIncoming] = useState<{ token: string; card: BonusKey } | null>(null);
  const [receiptQr, setReceiptQr] = useState("");
  const [receiptExpiresAt, setReceiptExpiresAt] = useState(0);
  const [completionQr, setCompletionQr] = useState("");
  const [completionExpiresAt, setCompletionExpiresAt] = useState(0);
  const [completionOfferId, setCompletionOfferId] = useState("");
  const [receivedCard, setReceivedCard] = useState<BonusKey | null>(null);
  const [message, setMessage] = useState("");
  const [workingCard, setWorkingCard] = useState<BonusKey | null>(null);
  const cards = (Object.entries(inventory.cards) as [BonusKey, number][])
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => {
      if (receivedCard && a === receivedCard) return -1;
      if (receivedCard && b === receivedCard) return 1;
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
    if (!qrExpiresAt && !receiptExpiresAt && !completionExpiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [qrExpiresAt, receiptExpiresAt, completionExpiresAt]);

  const remainingMs = Math.max(0, qrExpiresAt - now);
  const remainingLabel = `${Math.floor(remainingMs / 60000).toString().padStart(2, "0")}:${Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, "0")}`;
  const completionRemainingMs = Math.max(0, completionExpiresAt - now);
  const completionRemainingLabel = `${Math.floor(completionRemainingMs / 60000).toString().padStart(2, "0")}:${Math.floor((completionRemainingMs % 60000) / 1000).toString().padStart(2, "0")}`;

  useEffect(() => {
    const queued = takeQueuedCardQr();
    if (queued) {
      void processScan(queued);
      return;
    }

    const restore = async () => {
      const outgoing = getResumableOutgoingCardTrade();
      if (outgoing) {
        try {
          setQr(await QRCode.toDataURL(outgoing.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
          setQrKind(outgoing.kind === "confirmation" ? "confirmation" : "offer");
          setQrCard(outgoing.card);
          setQrExpiresAt(outgoing.expiresAt);
        } catch {
          setMessage(t.invalid);
        }
      }

      const receipt = getResumableReceiptTrade();
      if (receipt) {
        try {
          setReceiptQr(await QRCode.toDataURL(receipt.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
          setReceiptExpiresAt(receipt.expiresAt);
        } catch {
          setMessage(t.invalid);
        }
      }

      const completion = getResumableCompletionAckTrade();
      if (completion) {
        try {
          setCompletionQr(await QRCode.toDataURL(completion.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
          setCompletionExpiresAt(completion.expiresAt);
          setCompletionOfferId(completion.offerId ?? "");
          setReceivedCard(completion.card);
          setMode("receive");
          setMessage(t.receiverDone);
        } catch {
          setMessage(t.invalid);
        }
      }

      if (!outgoing && !receipt && !completion && hasUnresolvedExpiredOutgoingCardTrade()) {
        setMessage(t.expiredUncertain);
      }
      setNow(Date.now());
    };

    void restore();
    // Queued scans and resumable local trade state are consumed/restored once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function makeOffer(card: BonusKey) {
    setWorkingCard(card);
    try {
      const result = await createCardOffer(card);
      const image = await QRCode.toDataURL(result.token, { width: 360, margin: 2, errorCorrectionLevel: "L" });
      setQr(image);
      setQrKind("offer");
      setQrCard(card);
      setQrExpiresAt(result.offer.expiresAt);
      setNow(Date.now());
      setMessage("");
    } catch {
      setMessage(t.invalid);
    } finally {
      setWorkingCard(null);
    }
  }

  async function processScan(text: string) {
    setScannerOpen(false);

    try {
      const offer = await inspectCardOffer(text);
      setIncoming({ token: text, card: offer.card });
      setMode("receive");
      setMessage("");
      return;
    } catch {
      // Continue: the QR may be a receiver receipt or the final confirmation.
    }

    try {
      const result = await completeCardReceipt(text);
      setInventory(result.state);
      setQrKind("confirmation");
      setQrCard(result.card);
      setQrExpiresAt(result.confirmation.expiresAt);
      setNow(Date.now());
      try {
        setQr(await QRCode.toDataURL(result.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
        setMessage(t.senderConfirmed);
      } catch {
        // The signed confirmation is already persisted and will be restored on reload.
        setQr("");
        setMessage(t.invalid);
      }
      return;
    } catch {
      // Continue with the final receiver confirmation path.
    }

    try {
      const result = await finalizeCardConfirmation(text);
      setInventory(result.state);
      setReceiptQr("");
      setReceiptExpiresAt(0);
      setIncoming(null);
      setReceivedCard(result.card);
      setMode("receive");
      setCompletionExpiresAt(result.ack.expiresAt);
      setCompletionOfferId(result.ack.offerId);
      setNow(Date.now());
      try {
        setCompletionQr(await QRCode.toDataURL(result.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
        setMessage(t.receiverDone);
      } catch {
        setCompletionQr("");
        setMessage(t.invalid);
      }
      return;
    } catch {
      // Continue with the sender-side final acknowledgement path.
    }

    try {
      const result = await finalizeSenderAcknowledgement(text);
      setInventory(result.state);
      setQr("");
      setQrKind(null);
      setQrCard(null);
      setQrExpiresAt(0);
      setMessage(t.done);
      return;
    } catch {
      setMessage(t.invalid);
    }
  }

  async function accept() {
    if (!incoming) return;
    try {
      const result = await acceptCardOffer(incoming.token);
      setReceiptExpiresAt(result.receipt.expiresAt);
      setNow(Date.now());
      try {
        setReceiptQr(await QRCode.toDataURL(result.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
        setMessage(t.receiptReady);
      } catch {
        // The signed receipt is already persisted and will be restored on reload.
        setReceiptQr("");
        setMessage(t.invalid);
      }
      setIncoming(null);
    } catch {
      setMessage(t.invalid);
    }
  }

  function renderActiveQr() {
    if (!qr || !qrKind) return null;
    return (
      <div className="card-trade__qr card-trade__qr--active">
        <img src={qr} alt={qrKind === "confirmation" ? t.finalConfirm : t.create} />
        <strong className="card-trade__countdown">{t.remaining}: {remainingLabel}</strong>
        <p>{qrKind === "confirmation" ? t.senderConfirmed : t.expires}</p>
        <p><small>{t.security}</small></p>
        {qrKind === "offer" ? <button className="trade-primary" onClick={() => setScannerOpen(true)}>→ {t.scanReceiverReceipt}</button> : null}
        {qrKind === "confirmation" ? <button className="trade-primary" onClick={() => setScannerOpen(true)}>→ {t.scanFinalReceipt}</button> : null}
        {qrKind === "offer" ? <button onClick={() => {
          cancelPendingOffer();
          setQr("");
          setQrKind(null);
          setQrCard(null);
          setQrExpiresAt(0);
        }}>{t.cancel}</button> : null}
      </div>
    );
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

  useEffect(() => {
    if (qrExpiresAt && Date.now() >= qrExpiresAt) {
      if (qrKind === "offer") cancelPendingOffer();
      setQr("");
      setQrKind(null);
      setQrCard(null);
      setQrExpiresAt(0);
    }
    if (receiptExpiresAt && Date.now() >= receiptExpiresAt) {
      setReceiptQr("");
      setReceiptExpiresAt(0);
    }
    if (completionExpiresAt && Date.now() >= completionExpiresAt) {
      setCompletionQr("");
      setCompletionExpiresAt(0);
    }
  }, [now, qrExpiresAt, qrKind, receiptExpiresAt, completionExpiresAt]);

  const tabs = useMemo(() => [
    ["send", t.senderTab], ["receive", t.receiverTab],
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
              <div key={key} className="card-trade__item">
                {renderCard(key, count)}
                {count > 1 ? <button className="trade-primary" disabled={workingCard !== null} onClick={() => void makeOffer(key)}>{workingCard === key ? t.generating : t.create}</button> : null}
                {qrCard === key ? renderActiveQr() : null}
              </div>
            ))}
          </section>
        ) : null}

        {mode === "receive" ? (
          <section>
            <h2>{t.receive}</h2>
            <button className="trade-primary" onClick={() => setScannerOpen(true)}>{t.scan}</button>
            {incoming ? <div>{renderCard(incoming.card)}<button className="trade-primary" onClick={() => void accept()}>{t.confirm}</button></div> : null}
            {receiptQr ? <div className="card-trade__qr"><img src={receiptQr} alt={t.scanReceipt} /><p>{t.receiptReady}</p><p><small>{t.protocol}</small></p></div> : null}
            {completionQr ? <div className="card-trade__qr card-trade__qr--active"><img src={completionQr} alt={t.finalReceipt} /><strong className="card-trade__countdown">{t.remaining}: {completionRemainingLabel}</strong><p>{t.receiverDone}</p></div> : null}
            {cards.length ? <div className="card-trade__owned"><h3>{t.myCards}</h3>{cards.map(([key, count]) => <div key={key} className="card-trade__item">{renderCard(key, count)}</div>)}</div> : null}
          </section>
        ) : null}

        {scannerOpen ? <QrScanner onResult={(text) => { void processScan(text); }} onClose={() => setScannerOpen(false)} onError={() => setMessage(t.invalid)} /> : null}
      </div>
    </main>
  );
}

