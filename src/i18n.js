// src/i18n.js
// ========================================================
// i18n : dictionnaires UI, textes POI, détection langue
// ========================================================

export const I18N = {
  fr: {
    title: "Le Vol d’Aracne",
    subtitle: "Collecte les 10 étoiles et découvre 10 lieux secrets du Salento.",
    start: "Démarrer",
    hudStars: "Étoiles",
    musicOn: "⏹️ Musique",
    musicOff: "🎵 Musique",
    replay: "⟲ Rejouer",
    energy: "Énergie",
    ask: (info) => `Dis-moi, où est ${info} ?`,
    success: (name) => `Bravo, c’est exactement ça : ${name} !`,
    errTitle: "⚠️ Problème d’assets",
    mapNotLoaded: (url)=>`Carte non chargée : ${url}`,
    assetMissing: (who,url)=>`• ${who} introuvable : "${url}"`,

    // -------- Niveau 2 --------
    level2: {
      title: "Les Soleils du Salento",
      subtitle: "Collecte les 10 soleils et découvre 10 nouveaux lieux du Salento.",
      hudLabel: "Soleils",
      ask: (info) => `Où est ${info} ?`,
      win: "Bravo ! Victoire ✨"
    }
  },

  it: {
    title: "Il Volo di Aracne",
    subtitle: "Raccogli le 10 stelle e scopri 10 luoghi segreti del Salento.",
    start: "Avvia",
    hudStars: "Stelle",
    musicOn: "⏹️ Musica",
    musicOff: "🎵 Musica",
    replay: "⟲ Rigioca",
    energy: "Energia",
    ask: (info) => `Dimmi, dov’è ${info}?`,
    success: (name) => `Bravissimo, è proprio ${name}!`,
    errTitle: "⚠️ Problema con le risorse",
    mapNotLoaded: (url)=>`Mappa non caricata: ${url}`,
    assetMissing: (who,url)=>`• ${who} non trovato: "${url}"`,

    // -------- Livello 2 --------
    level2: {
      title: "I Soli del Salento",
      subtitle: "Raccogli i 10 soli e scopri 10 nuovi luoghi del Salento.",
      hudLabel: "Soli",
      ask: (info) => `Dov’è ${info}?`,
      win: "Bravissimo! Vittoria ✨"
    }
  },

  es: {
    title: "El Vuelo de Aracne",
    subtitle: "Recoge las 10 estrellas y descubre 10 lugares secretos del Salento.",
    start: "Empezar",
    hudStars: "Estrellas",
    musicOn: "⏹️ Música",
    musicOff: "🎵 Música",
    replay: "⟲ Repetir",
    energy: "Energía",
    ask: (info) => `Dime, ¿dónde está ${info}?`,
    success: (name) => `¡Bien hecho! Es exactamente: ${name}.`,
    errTitle: "⚠️ Problema de recursos",
    mapNotLoaded: (url)=>`Mapa no cargado: ${url}`,
    assetMissing: (who,url)=>`• ${who} no encontrado: "${url}"`,

    // -------- Nivel 2 --------
    level2: {
      title: "Los Soles del Salento",
      subtitle: "Recoge 10 soles y descubre 10 nuevos lugares del Salento.",
      hudLabel: "Soles",
      ask: (info) => `¿Dónde está ${info}?`,
      win: "¡Bravo! Victoria ✨"
    }
  },

  en: {
    title: "Aracne’s Flight",
    subtitle: "Collect 10 stars and discover 10 secret places in Salento.",
    start: "Start",
    hudStars: "Stars",
    musicOn: "⏹️ Music",
    musicOff: "🎵 Music",
    replay: "⟲ Replay",
    energy: "Energy",
    ask: (info) => `Tell me, where is ${info}?`,
    success: (name) => `Great, that’s exactly it: ${name}!`,
    errTitle: "⚠️ Asset issue",
    mapNotLoaded: (url)=>`Map not loaded: ${url}`,
    assetMissing: (who,url)=>`• ${who} missing: "${url}"`,

    // -------- Level 2 --------
    level2: {
      title: "Salento’s Suns",
      subtitle: "Collect 10 suns and discover 10 new places in Salento.",
      hudLabel: "Suns",
      ask: (info) => `Where is ${info}?`,
      win: "Great! Victory ✨"
    }
  }
};

// Textes POI (name + info) — multi-langues
export const POI_TEXT = {
  fr: {
    // Niveau 1
    otranto:      { name:"Otranto — Cathédrale",            info:"la cathédrale aux mosaïques médiévales et la chapelle des 800 martyrs" },
    portobadisco: { name:"Porto Badisco — Calanque",        info:"la grande calanque aux eaux turquoises entourée de falaises" },
    santacesarea: { name:"Santa Cesarea Terme",             info:"les thermes soufrés et la Villa Sticchi en bord de mer" },
    castro:       { name:"Castro — Castrum Minervae",       info:"la grotte Zinzulusa et le souvenir du temple d’Athéna" },
    ciolo:        { name:"Il Ciolo",                         info:"le petit fjord avec le grand pont routier" },
    leuca:        { name:"Santa Maria di Leuca",             info:"le phare très haut et la cascade monumentale du Finibus Terrae" },
    gallipoli:    { name:"Gallipoli",                        info:"la vieille ville bâtie sur un îlot relié par un pont" },
    portocesareo: { name:"Porto Cesareo",                    info:"les plages claires et la réserve marine" },
    nardo:        { name:"Nardò",                            info:"le centre baroque et Porto Selvaggio tout proche" },
    lecce:        { name:"Lecce",                            info:"le baroque en pietra leccese, Santa Croce et le Duomo" },

    // Niveau 2
    galatina:      { name:"Galatina",            info:"la tarantella et la chapelle Santa Caterina d’Alessandrie" },
    ugento:        { name:"Ugento",              info:"les vestiges messapiens et les vents marins" },
    santacaterina: { name:"Santa Caterina",      info:"la marina de Nardò, criques et falaises" },
    maglie:        { name:"Maglie",              info:"le bourg historique et ses palais" },
    melpignano:    { name:"Melpignano",          info:"la grande place de la pizzica (Notte della Taranta)" },
    tricase:       { name:"Tricase",             info:"les oliviers millénaires et la côte orientale" },
    torredellorso: { name:"Torre dell’Orso",     info:"la grande plage et les Due Sorelle" },
    soleto:        { name:"Soleto",              info:"la guglia gothique et les ruelles anciennes" },
    copertino:     { name:"Copertino",           info:"le château et l’histoire de San Giuseppe da Copertino" }
  },

  en: {
    // Level 1
    otranto:      { name:"Otranto — Cathedral",              info:"the cathedral with medieval mosaics and the Chapel of the 800 Martyrs" },
    portobadisco: { name:"Porto Badisco — Inlet",            info:"the large turquoise cove surrounded by cliffs" },
    santacesarea: { name:"Santa Cesarea Terme",              info:"the sulfur baths and seaside Villa Sticchi" },
    castro:       { name:"Castro — Castrum Minervae",        info:"the Zinzulusa cave and the memory of Athena’s temple" },
    ciolo:        { name:"Il Ciolo",                         info:"the tiny fjord with the high road bridge" },
    leuca:        { name:"Santa Maria di Leuca",             info:"the tall lighthouse and the monumental Finibus Terrae cascade" },
    gallipoli:    { name:"Gallipoli",                        info:"the old town on an islet linked by a bridge" },
    portocesareo: { name:"Porto Cesareo",                    info:"clear beaches and the marine reserve" },
    nardo:        { name:"Nardò",                            info:"the baroque center and nearby Porto Selvaggio" },
    lecce:        { name:"Lecce",                            info:"baroque in pietra leccese, Santa Croce and the Duomo" },

    // Level 2
    galatina:      { name:"Galatina",            info:"the tarantella and the Basilica of Saint Catherine of Alexandria" },
    ugento:        { name:"Ugento",              info:"Messapian remains and sea winds" },
    santacaterina: { name:"Santa Caterina",      info:"Nardò’s marina, coves and cliffs" },
    maglie:        { name:"Maglie",              info:"the historic town and its palazzi" },
    melpignano:    { name:"Melpignano",          info:"the big pizzica square (La Notte della Taranta)" },
    tricase:       { name:"Tricase",             info:"millenary olive trees and the eastern coast" },
    torredellorso: { name:"Torre dell’Orso",     info:"the beach and the ‘Due Sorelle’ rocks" },
    soleto:        { name:"Soleto",              info:"the Gothic spire and ancient lanes" },
    copertino:     { name:"Copertino",           info:"the castle and Saint Joseph of Copertino" }
  },

  it: {
    // Livello 1
    otranto:      { name:"Otranto — Cattedrale",             info:"la cattedrale con i mosaici medievali e la Cappella dei 800 Martiri" },
    portobadisco: { name:"Porto Badisco — Cala",             info:"la grande cala turchese circondata da scogliere" },
    santacesarea: { name:"Santa Cesarea Terme",              info:"le terme sulfuree e la Villa Sticchi sul mare" },
    castro:       { name:"Castro — Castrum Minervae",        info:"la grotta Zinzulusa e il ricordo del tempio di Atena" },
    ciolo:        { name:"Il Ciolo",                         info:"il piccolo fiordo con l’alto ponte stradale" },
    leuca:        { name:"Santa Maria di Leuca",             info:"l’altissimo faro e la cascata monumentale del Finibus Terrae" },
    gallipoli:    { name:"Gallipoli",                        info:"il centro storico su un isolotto collegato da un ponte" },
    portocesareo: { name:"Porto Cesareo",                    info:"spiagge chiare e l’area marina protetta" },
    nardo:        { name:"Nardò",                            info:"il centro barocco e Porto Selvaggio vicino" },
    lecce:        { name:"Lecce",                            info:"barocco in pietra leccese, Santa Croce e il Duomo" },

    // Livello 2
    galatina:      { name:"Galatina",            info:"la taranta e la basilica di Santa Caterina d’Alessandria" },
    ugento:        { name:"Ugento",              info:"i resti messapi e i venti marini" },
    santacaterina: { name:"Santa Caterina",      info:"la marina di Nardò, calette e scogliere" },
    maglie:        { name:"Maglie",              info:"il borgo storico e i suoi palazzi" },
    melpignano:    { name:"Melpignano",          info:"la grande piazza della pizzica (Notte della Taranta)" },
    tricase:       { name:"Tricase",             info:"gli ulivi millenari e la costa orientale" },
    torredellorso: { name:"Torre dell’Orso",     info:"la spiaggia e le Due Sorelle" },
    soleto:        { name:"Soleto",              info:"la guglia gotica e i vicoli antichi" },
    copertino:     { name:"Copertino",           info:"il castello e San Giuseppe da Copertino" }
  },

  es: {
    // Nivel 1
    otranto:      { name:"Otranto — Catedral",               info:"la catedral con mosaicos medievales y la Capilla de los 800 Mártires" },
    portobadisco: { name:"Porto Badisco — Cala",             info:"la gran cala turquesa rodeada de acantilados" },
    santacesarea: { name:"Santa Cesarea Terme",              info:"los baños sulfurosos y la Villa Sticchi junto al mar" },
    castro:       { name:"Castro — Castrum Minervae",        info:"la cueva Zinzulusa y el recuerdo del templo de Atenea" },
    ciolo:        { name:"Il Ciolo",                         info:"el pequeño fiordo con el alto puente de carretera" },
    leuca:        { name:"Santa Maria di Leuca",             info:"el faro altísimo y la cascada monumental del Finibus Terrae" },
    gallipoli:    { name:"Gallipoli",                        info:"el casco antiguo en un islote unido por un puente" },
    portocesareo: { name:"Porto Cesareo",                    info:"playas claras y la reserva marina" },
    nardo:        { name:"Nardò",                            info:"el centro barroco y el cercano Porto Selvaggio" },
    lecce:        { name:"Lecce",                            info:"barroco en pietra leccese, Santa Croce y el Duomo" },

    // Nivel 2
    galatina:      { name:"Galatina",            info:"la tarantela y la basílica de Santa Catalina de Alejandría" },
    ugento:        { name:"Ugento",              info:"restos mesapios y vientos marinos" },
    santacaterina: { name:"Santa Caterina",      info:"la marina de Nardò, calas y acantilados" },
    maglie:        { name:"Maglie",              info:"el casco histórico y sus palacios" },
    melpignano:    { name:"Melpignano",          info:"la gran plaza de la pizzica (Notte della Taranta)" },
    tricase:       { name:"Tricase",             info:"olivos milenarios y la costa oriental" },
    torredellorso: { name:"Torre dell’Orso",     info:"la playa y las rocas ‘Due Sorelle’" },
    soleto:        { name:"Soleto",              info:"la aguja gótica y las callejuelas antiguas" },
    copertino:     { name:"Copertino",           info:"el castillo y San José de Copertino" }
  }
};

// ---------- Détection & gestion de langue ----------
const SUPPORTED = Object.keys(I18N);
const LOCALE_ALIASES = {
  "fr-ca":"fr","fr-ch":"fr","fr-be":"fr","fr-lu":"fr","fr-mc":"fr",
  "it-ch":"it",
  "es-419":"es","es-mx":"es","es-ar":"es","es-cl":"es","es-co":"es","es-pe":"es","es-es":"es",
  "en-gb":"en","en-us":"en","en-au":"en","en-ca":"en","en-nz":"en","en-ie":"en","en-in":"en"
};

function getLangOverride() {
  try{
    const url = new URL(location.href);
    const p = (url.searchParams.get("lang")||"").trim().toLowerCase();
    if (p) { localStorage.setItem("__lang__", p); return p; }
    const saved = (localStorage.getItem("__lang__")||"").trim().toLowerCase();
    if (saved) return saved;
  }catch(_){}
  return "";
}

export function detectLang() {
  const override = getLangOverride();
  const candidatesRaw = [];
  if (override) candidatesRaw.push(override);
  if (Array.isArray(navigator.languages)) candidatesRaw.push(...navigator.languages);
  if (navigator.language) candidatesRaw.push(navigator.language);
  if (navigator.userLanguage) candidatesRaw.push(navigator.userLanguage);
  candidatesRaw.push("en");

  for (let c of candidatesRaw){
    if (!c) continue;
    c = String(c).replace("_","-").toLowerCase();
    const alias = LOCALE_ALIASES[c];
    const primary = c.split("-")[0];
    const tryList = [c, alias, primary].filter(Boolean);
    for (const v of tryList){ if (SUPPORTED.includes(v)) return v; }
  }
  return "en";
}

export function setLang(langCode){
  const lc = String(langCode||"").trim().toLowerCase();
  const alias = LOCALE_ALIASES[lc] || lc.split("-")[0];
  const final = SUPPORTED.includes(alias) ? alias : "en";
  localStorage.setItem("__lang__", final);
  location.reload();
}

// ---------- Helpers d’accès ----------
export const LANG = detectLang();
export const t = I18N[LANG] || I18N.en;

export function poiPack(key, lang = LANG){
  const pack = POI_TEXT[lang] || POI_TEXT.en;
  const fr   = POI_TEXT.fr;
  return (pack && pack[key]) || (fr && fr[key]) || { name:key, info:key };
}
export function poiName(key, lang = LANG){ return poiPack(key, lang).name; }
export function poiInfo(key, lang = LANG){ const p = poiPack(key, lang); return p.info || p.name; }
