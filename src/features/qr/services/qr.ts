// Simple routeur d’actions QR. Tu peux brancher sur ton JSON si besoin.
import { findPartnerByQrId } from "./partners";
import { BONUS_MAPS } from "../../bonus/bonusData";

export type QRAction =
  | { type: "open-otranto-map" }
  | { type: "open-otranto-market" }
  | { type: "open-any"; path: string }
  | { type: "badge"; name: string }
  | { type: "partner"; partnerId: string }
  | { type: "unknown"; raw: string };

export function parseQrPayload(text: string): QRAction {
  const t = text.trim();

  // Exemples de formats supportés
  if (/^hirundu:\/\/otranto\/map$/i.test(t)) return { type: "open-otranto-map" };
  if (/^hirundu:\/\/otranto\/market$/i.test(t)) return { type: "open-otranto-market" };
  if (/^hirundu:\/\/badge\/(.+)/i.test(t)) {
    const m = t.match(/^hirundu:\/\/badge\/(.+)/i);
    try {
      return { type: "badge", name: decodeURIComponent(m?.[1] || "?" ) };
    } catch {
      return { type: "unknown", raw: t };
    }
  }
  const partner = findPartnerByQrId(t);
  if (partner) {
    return { type: "partner", partnerId: partner.id };
  }
  if (/^hirundu:\/\/open\//i.test(t)) {
    // ex: hirundu://open//poi/otranto/realmap
    const path = t.replace(/^hirundu:\/\/open\//i, "").replace(/^\/+/, "/");
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const match = normalized.match(/^\/poi\/([a-z]+)\/(realmap|market)$/)
      || normalized.match(/^\/(?:bonus|passport)\/([a-z]+)$/);
    const valid = ["/", "/bonus", "/passport", "/qr"].includes(normalized)
      || (match && Object.prototype.hasOwnProperty.call(BONUS_MAPS, match[1]));
    return valid ? { type: "open-any", path: normalized } : { type: "unknown", raw: t };
  }
  // fallback: Raw
  return { type: "unknown", raw: t };
}
