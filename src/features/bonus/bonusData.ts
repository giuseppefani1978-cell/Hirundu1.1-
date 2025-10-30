export type BonusMapConfig = {
  title: string;
  lat: number;
  lng: number;
  zoom: number;
  markerText?: string;
  partners: unknown[];
};

export const BONUS_MAPS = {
  otranto: {
    title: "Otranto",
    lat: 40.1489,
    lng: 18.4863,
    zoom: 14,
    markerText: "Tu as libéré Otranto ! 🌊",
    partners: [],
  },
  gallipoli: {
    title: "Gallipoli",
    lat: 40.0553,
    lng: 17.9889,
    zoom: 14,
    markerText: "Bravo ! Aracne triomphe à Gallipoli ! 🕊️",
    partners: [],
  },
  lecce: {
    title: "Lecce",
    lat: 40.352,
    lng: 18.175,
    zoom: 13,
    markerText: "Bienvenue à Lecce – le cœur du Salento ! ☀️",
    partners: [],
  },
} as const satisfies Record<string, BonusMapConfig>;

export type BonusKey = keyof typeof BONUS_MAPS;
