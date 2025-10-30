import poisData from "../../../data/pois.json";
import type { Partner } from "./partners";
import { findPartnerById } from "./partners";

export type PoiCategory = "monument" | "restaurant" | "bar" | "hotel" | "shop" | "beach";

export interface Poi {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radius: number;
  partnerId?: Partner["id"];
  category?: PoiCategory;
}

export interface EnrichedPoi extends Poi {
  partner?: Partner;
}

const POIS: Poi[] = poisData as Poi[];

export function getAllPois(): Poi[] {
  return POIS;
}

export function getEnrichedPois(): EnrichedPoi[] {
  return POIS.map((poi) => ({
    ...poi,
    partner: poi.partnerId ? findPartnerById(poi.partnerId) : undefined,
  }));
}

export function findPoiById(id: string): Poi | undefined {
  return POIS.find((poi) => poi.id === id);
}
