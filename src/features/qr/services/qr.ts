// Simple routeur d’actions QR. Tu peux brancher sur ton JSON si besoin.
type QRAction =
  | { type: "open-otranto-map" }
  | { type: "open-otranto-market" }
  | { type: "open-any"; path: string }
  | { type: "badge"; name: string }
  | { type: "unknown"; raw: string };

export function parseQrPayload(text: string): QRAction {
  const t = text.trim();

  // Exemples de formats supportés
  if (/^hirundu:\/\/otranto\/map$/i.test(t)) return { type: "open-otranto-map" };
  if (/^hirundu:\/\/otranto\/market$/i.test(t)) return { type: "open-otranto-market" };
  if (/^hirundu:\/\/badge\/(.+)/i.test(t)) {
    const m = t.match(/^hirundu:\/\/badge\/(.+)/i);
    return { type: "badge", name: decodeURIComponent(m?.[1] || "?" ) };
  }
  if (/^hirundu:\/\/open\//i.test(t)) {
    // ex: hirundu://open//poi/otranto/realmap
    const path = t.replace(/^hirundu:\/\/open/, "");
    return { type: "open-any", path };
  }
  // fallback: Raw
  return { type: "unknown", raw: t };
}

