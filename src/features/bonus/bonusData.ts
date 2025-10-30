import type { Partner } from "../qr/services/partners";
import type { Poi } from "../qr/services/pois";

export type BonusMapConfig = {
  title: string;
  lat: number;
  lng: number;
  zoom: number;
  markerText?: string;
  partnerIds: Partner["id"][];
  poiIds: Poi["id"][];
};

export const BONUS_MAPS = {
  otranto: {
    title: "Otranto",
    lat: 40.1489,
    lng: 18.4863,
    zoom: 14,
    markerText: "Tu as libéré Otranto ! 🌊",
    partnerIds: [
      "otranto_castle",
      "otranto_cathedral",
      "otranto_beach",
      "bar_caffe_mengoli",
      "bar_porta_terra",
      "bar_laltro_baffo",
      "hotel_palazzo_papaleo",
      "shop_artigiani",
      "ristorante_hydro",
      "beach_grotte",
    ],
    poiIds: [
      "poi_castle",
      "poi_cathedral",
      "poi_beach_alimini",
      "poi_caffe_mengoli",
      "poi_grotta_poesia",
    ],
  },
  gallipoli: {
    title: "Gallipoli",
    lat: 40.0553,
    lng: 17.9889,
    zoom: 14,
    markerText: "Bravo ! Aracne triomphe à Gallipoli ! 🕊️",
    partnerIds: [],
    poiIds: [],
  },
  lecce: {
    title: "Lecce",
    lat: 40.352,
    lng: 18.175,
    zoom: 13,
    markerText: "Bienvenue à Lecce – le cœur du Salento ! ☀️",
    partnerIds: [],
    poiIds: [],
  },
} as const satisfies Record<string, BonusMapConfig>;

export type BonusKey = keyof typeof BONUS_MAPS;
