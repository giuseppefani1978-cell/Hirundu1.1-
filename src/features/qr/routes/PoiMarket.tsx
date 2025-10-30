import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QrBadge from "../components/QrBadge";
import { BONUS_MAPS, type BonusKey } from "../../bonus/bonusData";
import {
  findPartnerById,
  type Partner,
  type PartnerCategory,
  type PartnerReward,
} from "../services/partners";
import { getEnrichedPois, type EnrichedPoi } from "../services/pois";
import "./PoiMarket.css";

interface MarketEntry {
  partner: Partner;
  poi?: EnrichedPoi;
}

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  monument: "Monument",
  restaurant: "Restaurant",
  bar: "Bar",
  hotel: "Hôtel",
  shop: "Boutique",
  beach: "Plage",
};

export default function PoiMarket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const key = (id?.toLowerCase() as BonusKey) || ("otranto" as BonusKey);
  const cfg = BONUS_MAPS[key] ?? BONUS_MAPS.otranto;

  const allPois = useMemo(() => getEnrichedPois(), []);
  const entries = useMemo<MarketEntry[]>(() => {
    const ids = cfg.partnerIds ?? [];
    if (!ids.length) return [];
    return ids
      .map((partnerId) => {
        const partner = findPartnerById(partnerId);
        if (!partner) return undefined;
        const poi = allPois.find((p) => p.partner?.id === partner.id);
        return { partner, poi } satisfies MarketEntry;
      })
      .filter((entry): entry is MarketEntry => Boolean(entry));
  }, [allPois, cfg.partnerIds]);

  const summary = useMemo(() => {
    if (!entries.length) return null;
    const categories = new Set(entries.map((entry) => entry.partner.type));
    return {
      count: entries.length,
      categories: Array.from(categories).map((category) => CATEGORY_LABELS[category]),
    };
  }, [entries]);

  const goToMap = () => navigate(`/poi/${encodeURIComponent(key)}/realmap`);
  const goToScanner = () => navigate("/qr");

  return (
    <section className="app-section poi-market">
      <header className="poi-market__header">
        <div className="poi-market__header-copy">
          <h1 className="poi-market__title">🛒 Marché de {cfg.title}</h1>
          <p className="poi-market__subtitle">
            Retrouve ici tous les partenaires fictifs associés à la carte bonus et leurs récompenses
            pour préparer les tests terrain.
          </p>
          {summary ? (
            <p className="poi-market__summary">
              {summary.count} partenaire{summary.count > 1 ? "s" : ""} — {summary.categories.join(", ")}
            </p>
          ) : (
            <p className="poi-market__summary poi-market__summary--empty">
              Aucun partenaire n’est encore défini pour cette carte.
            </p>
          )}
        </div>
        <div className="poi-market__header-actions">
          <button type="button" className="app-button app-button--ghost" onClick={goToScanner}>
            ↩︎ Retour au scanner
          </button>
          <button type="button" className="app-button app-button--dark" onClick={goToMap}>
            🗺️ Voir la carte
          </button>
        </div>
      </header>

      {!entries.length ? (
        <div className="surface-card poi-market__empty" role="status">
          Ajoute des partenaires à la configuration pour alimenter cette vue marché.
        </div>
      ) : (
        <div className="poi-market__grid">
          {entries.map((entry) => (
            <PartnerCard key={entry.partner.id} entry={entry} onOpenMap={goToMap} />
          ))}
        </div>
      )}
    </section>
  );
}

interface PartnerCardProps {
  entry: MarketEntry;
  onOpenMap: () => void;
}

function PartnerCard({ entry, onOpenMap }: PartnerCardProps) {
  const { partner, poi } = entry;
  const tone: "info" | "success" = partner.reward.type === "bonus" ? "success" : "info";

  return (
    <article className="surface-card poi-market__card">
      <header className="poi-market__card-header">
        <div>
          <h2 className="poi-market__card-title">{partner.name}</h2>
          <span className="poi-market__card-type">{CATEGORY_LABELS[partner.type]}</span>
        </div>
        <span className="poi-market__qr-id">{partner.qr_id}</span>
      </header>

      <p className="poi-market__card-description">{partner.description}</p>

      <QrBadge
        icon={partner.reward.type === "bonus" ? "🎁" : partner.reward.type === "stars" ? "⭐" : "🏆"}
        title={rewardTitle(partner.reward)}
        subtitle={rewardSubtitle(partner.reward)}
        tone={tone}
      />

      <dl className="poi-market__details">
        {poi ? (
          <div>
            <dt>Localisation</dt>
            <dd>
              {poi.label}
              <span aria-hidden> · </span>
              {poi.lat.toFixed(4)} / {poi.lng.toFixed(4)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>QR à scanner</dt>
          <dd>{partner.qr_id}</dd>
        </div>
      </dl>

      <div className="poi-market__card-actions">
        <button type="button" className="app-button app-button--ghost" onClick={onOpenMap}>
          📍 Voir sur la carte
        </button>
      </div>
    </article>
  );
}

function rewardTitle(reward: PartnerReward): string {
  switch (reward.type) {
    case "stars":
      return `${reward.value} étoile${reward.value > 1 ? "s" : ""} à gagner`;
    case "score":
      return `+${reward.value} points de score`;
    case "bonus":
      return `${reward.value}× ${reward.item}`;
    default:
      return "Récompense partenaire";
  }
}

function rewardSubtitle(reward: PartnerReward): string {
  switch (reward.type) {
    case "stars":
      return "Fais progresser ta guilde dans la chasse au trésor.";
    case "score":
      return "Ajoute du score à ton équipe principale.";
    case "bonus":
      return "Débloque un bonus utilisable en jeu.";
    default:
      return "Avantage fourni par le partenaire.";
  }
}

