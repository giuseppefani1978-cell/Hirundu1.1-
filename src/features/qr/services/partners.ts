import partnersData from "../../../data/partners.json";

export type PartnerCategory =
  | "monument"
  | "restaurant"
  | "bar"
  | "hotel"
  | "shop"
  | "beach";

export type PartnerReward =
  | { type: "stars"; value: number }
  | { type: "score"; value: number }
  | { type: "bonus"; item: string; value: number };

export interface Partner {
  id: string;
  name: string;
  type: PartnerCategory;
  lat: number;
  lng: number;
  reward: PartnerReward;
  qr_id: string;
  description: string;
}

const PARTNERS: Partner[] = partnersData as Partner[];

export function getAllPartners(): Partner[] {
  return PARTNERS;
}

export function findPartnerByQrId(qrId: string): Partner | undefined {
  return PARTNERS.find((partner) => partner.qr_id === qrId);
}

export function findPartnerById(id: string): Partner | undefined {
  return PARTNERS.find((partner) => partner.id === id);
}

export function findPartnerByName(name: string): Partner | undefined {
  const target = name.trim().toLowerCase();
  return PARTNERS.find((partner) => partner.name.toLowerCase() === target);
}

export function listPartnersByCategory(category: PartnerCategory): Partner[] {
  return PARTNERS.filter((partner) => partner.type === category);
}

export function getPartnerCategories(): PartnerCategory[] {
  return Array.from(new Set(PARTNERS.map((partner) => partner.type)));
}
