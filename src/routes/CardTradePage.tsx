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
  finishReceiverTrade,
  finishReceiverAfterReceipt,
  finishSenderTrade,
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
  fr: {
    senderTab: "Je propose un échange", receiverTab: "Je réponds à une offre",
    duplicateRule: "Un échange est toujours carte contre carte. Il faut au moins 2 exemplaires de la carte que tu donnes : 1 reste dans ta collection et le double est échangé.",
    noDuplicate: "Aucun double disponible : il faut au moins 2 exemplaires de cette carte pour l’échanger.",
    senderHelp: "Choisis la carte que tu donnes et celle que tu veux recevoir. Puis génère l’offre.",
    receiverHelp: "Scanne l’offre. L’échange n’est possible que si tu possèdes au moins 2 exemplaires de la carte demandée.",
    scanOffer: "Scanner l’offre", scanReceiverReceipt: "Scanner la réponse de l’autre joueur", scanSenderConfirmation: "Scanner la confirmation finale",
    receiptStep: "Étape 2/2 — Fais scanner ce QR par l’autre joueur. Quand son téléphone affiche « Échange terminé », appuie ci-dessous.",
    senderStep: "Échange terminé.",
    receiverStep: "Échange réussi ✓",
    receiverFinishHelp: "Aucun autre scan n’est nécessaire.",
    finishHere: "Terminer", finishSender: "Terminer",
    protocol: "2 scans : l’offre, puis la réponse avec la carte demandée. Après le deuxième scan, l’expéditeur a fini ; le destinataire confirme avec un bouton.",
    qrValidity: "QR valable encore", chooseWanted: "Je veux recevoir", giveLabel: "Tu donnes", receiveLabel: "Tu reçois",
    acceptTrade: "Accepter cet échange", missingWanted: "Échange impossible : tu n’as pas de double de la carte demandée.",
    offerReady: "Offre prête : le QR contient la carte proposée et la carte demandée.",
    finishAfterSenderScan: "L’autre joueur a scanné mon QR — Terminer l’échange",
    senderDoneAfterReceipt: "Échange terminé ✓ Tu as reçu la carte demandée et ton double a été échangé.",
    receiverDoneAfterReceipt: "Échange terminé ✓ Tu as reçu la carte proposée et ton double a été échangé."
  },
  it: {
    senderTab: "Propongo uno scambio", receiverTab: "Rispondo a un’offerta",
    duplicateRule: "Lo scambio è sempre carta contro carta. Servono almeno 2 copie della carta che dai: 1 resta nella collezione e il doppione viene scambiato.",
    noDuplicate: "Nessun doppione disponibile: servono almeno 2 copie della carta.",
    senderHelp: "Scegli la carta che dai e quella che vuoi ricevere, poi genera l’offerta.",
    receiverHelp: "Scansiona l’offerta. Lo scambio è possibile solo se possiedi almeno 2 copie della carta richiesta.",
    scanOffer: "Scansiona l’offerta", scanReceiverReceipt: "Scansiona la risposta dell’altro giocatore", scanSenderConfirmation: "Scansiona la conferma finale",
    receiptStep: "Passo 2/2 — Fai scansionare questo QR all’altro giocatore. Quando il suo telefono mostra « Scambio completato », premi qui sotto.",
    senderStep: "Scambio completato.", receiverStep: "Scambio riuscito ✓", receiverFinishHelp: "Non serve un’altra scansione.",
    finishHere: "Termina", finishSender: "Termina",
    protocol: "2 scansioni: offerta, poi risposta con la carta richiesta. Dopo la seconda scansione il mittente ha finito; il destinatario conferma con un pulsante.",
    qrValidity: "QR valido ancora", chooseWanted: "Voglio ricevere", giveLabel: "Dai", receiveLabel: "Ricevi",
    acceptTrade: "Accetta questo scambio", missingWanted: "Scambio impossibile: non hai un doppione della carta richiesta.",
    offerReady: "Offerta pronta: il QR contiene la carta proposta e quella richiesta.",
    finishAfterSenderScan: "L’altro giocatore ha scansionato il mio QR — Termina lo scambio",
    senderDoneAfterReceipt: "Scambio completato ✓ Hai ricevuto la carta richiesta e il tuo doppione è stato scambiato.",
    receiverDoneAfterReceipt: "Scambio completato ✓ Hai ricevuto la carta proposta e il tuo doppione è stato scambiato."
  },
  en: {
    senderTab: "I propose a trade", receiverTab: "I respond to an offer",
    duplicateRule: "A trade is always card-for-card. You need at least 2 copies of the card you give: 1 stays in your collection and the duplicate is traded.",
    noDuplicate: "No duplicate available: you need at least 2 copies of this card.",
    senderHelp: "Choose the card you give and the card you want back, then generate the offer.",
    receiverHelp: "Scan the offer. The trade can continue only if you own at least 2 copies of the requested card.",
    scanOffer: "Scan the offer", scanReceiverReceipt: "Scan the other player’s response", scanSenderConfirmation: "Scan final confirmation",
    receiptStep: "Step 2/2 — Have the other player scan this QR. When their phone shows “Trade complete”, tap below.",
    senderStep: "Trade complete.", receiverStep: "Trade complete ✓", receiverFinishHelp: "No more scanning is needed.",
    finishHere: "Finish", finishSender: "Finish",
    protocol: "2 scans: the offer, then the response carrying the requested card. After the second scan the sender is done; the recipient confirms with a button.",
    qrValidity: "QR valid for", chooseWanted: "I want to receive", giveLabel: "You give", receiveLabel: "You receive",
    acceptTrade: "Accept this trade", missingWanted: "Trade impossible: you do not have a duplicate of the requested card.",
    offerReady: "Offer ready: the QR contains both the offered card and the requested card.",
    finishAfterSenderScan: "The other player scanned my QR — Finish trade",
    senderDoneAfterReceipt: "Trade complete ✓ You received the requested card and your duplicate was exchanged.",
    receiverDoneAfterReceipt: "Trade complete ✓ You received the offered card and your duplicate was exchanged."
  },
  es: {
    senderTab: "Propongo un intercambio", receiverTab: "Respondo a una oferta",
    duplicateRule: "El intercambio es siempre tarjeta por tarjeta. Necesitas al menos 2 copias de la tarjeta que das: 1 queda en tu colección y el duplicado se intercambia.",
    noDuplicate: "No hay duplicado disponible: necesitas al menos 2 copias de esta tarjeta.",
    senderHelp: "Elige la tarjeta que das y la que quieres recibir, y genera la oferta.",
    receiverHelp: "Escanea la oferta. El intercambio solo puede continuar si tienes al menos 2 copias de la tarjeta solicitada.",
    scanOffer: "Escanear la oferta", scanReceiverReceipt: "Escanear la respuesta del otro jugador", scanSenderConfirmation: "Escanear confirmación final",
    receiptStep: "Paso 2/2 — Haz que el otro jugador escanee este QR. Cuando su teléfono muestre « Intercambio completado », pulsa abajo.",
    senderStep: "Intercambio completado.", receiverStep: "Intercambio completado ✓", receiverFinishHelp: "No hace falta otro escaneo.",
    finishHere: "Terminar", finishSender: "Terminar",
    protocol: "2 escaneos: la oferta y luego la respuesta con la tarjeta solicitada. Tras el segundo escaneo el remitente termina; el destinatario confirma con un botón.",
    qrValidity: "QR válido durante", chooseWanted: "Quiero recibir", giveLabel: "Das", receiveLabel: "Recibes",
    acceptTrade: "Aceptar este intercambio", missingWanted: "Intercambio imposible: no tienes un duplicado de la tarjeta solicitada.",
    offerReady: "Oferta lista: el QR contiene la tarjeta ofrecida y la solicitada.",
    finishAfterSenderScan: "El otro jugador escaneó mi QR — Terminar intercambio",
    senderDoneAfterReceipt: "Intercambio completado ✓ Has recibido la tarjeta solicitada y tu duplicado se ha intercambiado.",
    receiverDoneAfterReceipt: "Intercambio completado ✓ Has recibido la tarjeta ofrecida y tu duplicado se ha intercambiado."
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
  const t = { ...copy[language], ...uxCopy[language] };
  const labels = originLabels[language] ?? originLabels.fr;
  const [inventory, setInventory] = useState(readCardInventory);
  const [mode, setMode] = useState<Mode>("send");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [qrKind, setQrKind] = useState<"offer" | "confirmation" | null>(null);
  const [qrCard, setQrCard] = useState<BonusKey | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState(0);
  const [qrOfferId, setQrOfferId] = useState("");
  const [now, setNow] = useState(Date.now());
  const [incoming, setIncoming] = useState<{ token: string; card: BonusKey; requestedCard: BonusKey } | null>(null);
  const [receiptQr, setReceiptQr] = useState("");
  const [receiptExpiresAt, setReceiptExpiresAt] = useState(0);
  const [receiptOfferId, setReceiptOfferId] = useState("");
  const [completionExpiresAt, setCompletionExpiresAt] = useState(0);
  const [completionOfferId, setCompletionOfferId] = useState("");
  const [receivedCard, setReceivedCard] = useState<BonusKey | null>(null);
  const [message, setMessage] = useState("");
  const [workingCard, setWorkingCard] = useState<BonusKey | null>(null);
  const [wantedCard, setWantedCard] = useState<BonusKey>("lecce");
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
          setQrOfferId(outgoing.offerId ?? "");
        } catch {
          setMessage(t.invalid);
        }
      }

      const receipt = getResumableReceiptTrade();
      if (receipt) {
        try {
          setReceiptQr(await QRCode.toDataURL(receipt.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
          setReceiptExpiresAt(receipt.expiresAt);
          setReceiptOfferId(receipt.offerId ?? "");
        } catch {
          setMessage(t.invalid);
        }
      }

      const completion = getResumableCompletionAckTrade();
      if (completion) {
        setCompletionExpiresAt(completion.expiresAt);
        setCompletionOfferId(completion.offerId ?? "");
        setReceivedCard(completion.card);
        setMode("receive");
        setMessage(t.receiverStep);
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
      const requested = wantedCard === card
        ? ((Object.keys(BONUS_MAPS) as BonusKey[]).find((key) => key !== card) ?? "lecce")
        : wantedCard;
      const result = await createCardOffer(card, requested);
      const image = await QRCode.toDataURL(result.token, { width: 360, margin: 2, errorCorrectionLevel: "L" });
      setQr(image);
      setQrKind("offer");
      setQrCard(card);
      setQrExpiresAt(result.offer.expiresAt);
      setQrOfferId(result.offer.id);
      setNow(Date.now());
      setMessage(t.offerReady);
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
      setIncoming({ token: text, card: offer.card, requestedCard: offer.requestedCard });
      setMode("receive");
      setMessage("");
      return;
    } catch {
      // Continue: the QR may be a receiver receipt or the final confirmation.
    }

    try {
      const result = await completeCardReceipt(text);
      setInventory(finishSenderTrade(result.confirmation.offerId));
      setQr("");
      setQrKind(null);
      setQrCard(null);
      setQrExpiresAt(0);
      setQrOfferId("");
      setNow(Date.now());
      setMessage(t.senderDoneAfterReceipt);
      return;
    } catch {
      // Continue with legacy final-confirmation compatibility.
    }

    try {
      const result = await finalizeCardConfirmation(text);
      setInventory(result.state);
      setReceiptQr("");
      setReceiptExpiresAt(0);
      setReceiptOfferId("");
      setIncoming(null);
      setReceivedCard(result.card);
      setMode("receive");
      setCompletionExpiresAt(result.ack.expiresAt);
      setCompletionOfferId(result.ack.offerId);
      setNow(Date.now());
      setMessage(t.receiverStep);
      return;
    } catch {
      setMessage(t.invalid);
    }
  }

  async function accept() {
    if (!incoming) return;
    if ((inventory.cards[incoming.requestedCard] || 0) < 2) {
      setMessage(t.missingWanted);
      return;
    }
    try {
      const result = await acceptCardOffer(incoming.token);
      setReceiptExpiresAt(result.receipt.expiresAt);
      setReceiptOfferId(result.receipt.offerId);
      setNow(Date.now());
      try {
        setReceiptQr(await QRCode.toDataURL(result.token, { width: 360, margin: 2, errorCorrectionLevel: "L" }));
        setMessage(t.receiptStep);
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
        <strong className="card-trade__countdown">{t.qrValidity}: {remainingLabel}</strong>
        <p>{qrKind === "confirmation" ? t.senderStep : t.expires}</p>
        <p><small>{t.security}</small></p>
        {qrKind === "offer" ? <button className="trade-primary" onClick={() => setScannerOpen(true)}>→ {t.scanReceiverReceipt}</button> : null}
        {qrKind === "confirmation" ? <button className="trade-primary card-trade__main-action" onClick={() => {
          if (qrOfferId) setInventory(finishSenderTrade(qrOfferId));
          setQr("");
          setQrKind(null);
          setQrCard(null);
          setQrExpiresAt(0);
          setQrOfferId("");
          setMessage(t.done);
        }}>{t.finishSender}</button> : null}
        {qrKind === "offer" ? <button onClick={() => {
          cancelPendingOffer();
          setQr("");
          setQrKind(null);
          setQrCard(null);
          setQrExpiresAt(0);
          setQrOfferId("");
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
      setQrOfferId("");
    }
    if (receiptExpiresAt && Date.now() >= receiptExpiresAt) {
      setReceiptQr("");
      setReceiptExpiresAt(0);
      setReceiptOfferId("");
    }
    if (completionExpiresAt && Date.now() >= completionExpiresAt) {
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
        <p className="card-trade__guide">{mode === "send" ? t.senderHelp : t.receiverHelp}</p>
        {message ? <p className="card-trade__status" role="status">{message}</p> : null}

        {mode === "send" ? (
          <section>
            <h2>{t.senderTab}</h2>
            <p className="card-trade__duplicate-rule">{t.duplicateRule}</p>
            {!cards.length ? <p>{t.noCards}</p> : null}
            {cards.map(([key, count]) => (
              <div key={key} className="card-trade__item">
                {renderCard(key, count)}
                {count > 1 ? <>
                  <label className="card-trade__wanted">
                    <strong>{t.chooseWanted}</strong>
                    <select value={wantedCard === key ? ((Object.keys(BONUS_MAPS) as BonusKey[]).find((candidate) => candidate !== key) ?? "lecce") : wantedCard} onChange={(event) => setWantedCard(event.target.value as BonusKey)}>
                      {(Object.keys(BONUS_MAPS) as BonusKey[]).filter((candidate) => candidate !== key).map((candidate) => (
                        <option key={candidate} value={candidate}>{BONUS_MAPS[candidate].title}</option>
                      ))}
                    </select>
                  </label>
                  <div className="card-trade__swap-summary"><span>{t.giveLabel}: <strong>{BONUS_MAPS[key].title}</strong></span><span>⇄</span><span>{t.receiveLabel}: <strong>{BONUS_MAPS[wantedCard === key ? ((Object.keys(BONUS_MAPS) as BonusKey[]).find((candidate) => candidate !== key) ?? "lecce") : wantedCard].title}</strong></span></div>
                  <button className="trade-primary card-trade__main-action" disabled={workingCard !== null} onClick={() => void makeOffer(key)}>{workingCard === key ? t.generating : "1. " + t.create}</button>
                </> : <p className="card-trade__no-duplicate">🔒 {t.noDuplicate}</p>}
                {qrCard === key ? renderActiveQr() : null}
              </div>
            ))}
          </section>
        ) : null}

        {mode === "receive" ? (
          <section>
            <h2>{t.receiverTab}</h2>
            {!receiptQr && !completionOfferId && !incoming ? <button className="trade-primary card-trade__main-action" onClick={() => setScannerOpen(true)}>1. {t.scanOffer}</button> : null}
            {incoming ? <div className="card-trade__incoming">
              <div className="card-trade__swap-summary card-trade__swap-summary--large">
                <span>{t.receiveLabel}: <strong>{BONUS_MAPS[incoming.card].title}</strong></span>
                <span>⇄</span>
                <span>{t.giveLabel}: <strong>{BONUS_MAPS[incoming.requestedCard].title}</strong></span>
              </div>
              {renderCard(incoming.card)}
              {(inventory.cards[incoming.requestedCard] || 0) >= 2
                ? <button className="trade-primary card-trade__main-action" onClick={() => void accept()}>2. {t.acceptTrade}</button>
                : <p className="card-trade__no-duplicate">🔒 {t.missingWanted}</p>}
            </div> : null}
            {receiptQr ? <div className="card-trade__qr card-trade__qr--active"><img src={receiptQr} alt={t.scanReceipt} /><p>{t.receiptStep}</p><button className="trade-primary card-trade__main-action" onClick={() => {
              if (!receiptOfferId) return;
              try {
                const next = finishReceiverAfterReceipt(receiptOfferId);
                setInventory(next);
                setReceiptQr("");
                setReceiptExpiresAt(0);
                setReceiptOfferId("");
                setReceivedCard(incoming?.card ?? null);
                setMessage(t.receiverDoneAfterReceipt);
              } catch {
                setMessage(t.invalid);
              }
            }}>{t.finishAfterSenderScan}</button><p><small>{t.protocol}</small></p></div> : null}
            {completionOfferId ? <div className="card-trade__qr card-trade__qr--active"><p>{t.receiverStep}</p><p className="card-trade__finish-help">{t.receiverFinishHelp}</p><button className="trade-primary card-trade__main-action" onClick={() => {
              if (completionOfferId) setInventory(finishReceiverTrade(completionOfferId));
              setCompletionExpiresAt(0);
              setCompletionOfferId("");
              setMessage(t.done);
            }}>{t.finishHere}</button></div> : null}
            {cards.length ? <div className="card-trade__owned"><h3>{t.myCards}</h3>{cards.map(([key, count]) => <div key={key} className="card-trade__item">{renderCard(key, count)}</div>)}</div> : null}
          </section>
        ) : null}

        {scannerOpen ? <QrScanner onResult={(text) => { void processScan(text); }} onClose={() => setScannerOpen(false)} onError={() => setMessage(t.invalid)} /> : null}
      </div>
    </main>
  );
}

