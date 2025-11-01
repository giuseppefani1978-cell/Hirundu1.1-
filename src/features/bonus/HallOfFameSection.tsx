import React from "react";
import {
  formatHallOfFameBreakdown,
  formatHallOfFameTime,
  isHallOfFameStorageKey,
  loadAllHallOfFame,
  loadHallOfFameSummary,
  normalizeHallOfFameName,
} from "../../hof/storage";

type SourceMeta = {
  key: string;
  label: string;
  suffix: string;
  alwaysShow?: boolean;
};

type SummaryTotals = {
  runs?: number;
  points?: number;
  bonuses?: {
    pasticciotto?: number;
    rustico?: number;
    caffe?: number;
  };
};

const SOURCE_META: SourceMeta[] = [
  { key: "salento_hof_v1", label: "Niv. 1", suffix: "★", alwaysShow: true },
  { key: "salento_hof_v2", label: "Niv. 2", suffix: "🌞", alwaysShow: true },
  { key: "salento_hof_v3", label: "Niv. 3", suffix: "🍃", alwaysShow: true },
  { key: "salento_hof", label: "Archive", suffix: "★" },
  { key: "salento_hof_v0", label: "Archive", suffix: "★" },
  { key: "hof", label: "Archive", suffix: "★" },
];

const SOURCE_META_MAP = new Map(SOURCE_META.map((meta) => [meta.key, meta]));
const SOURCE_LABEL_ORDER = new Map(
  SOURCE_META.map((meta, index) => [meta.label, index])
);
const DEFAULT_SUFFIX = "★";

export type HallOfFameEntry = {
  name: string;
  country?: { flag?: string; label?: string };
  score: number;
  stars: number;
  bonuses: number;
  bonusBreakdown?: Record<string, number>;
  hits: number;
  time: number;
  date: string;
  sourceKey: string;
  sourceLabel: string;
  progressSuffix: string;
};

function useHallOfFameEntries() {
  const readEntries = React.useCallback(() => {
    const data = loadAllHallOfFame();
    return data
      .flatMap(({ key, entries }) =>
        entries.map((entry) => ({
          ...entry,
          sourceKey: key,
          sourceLabel: SOURCE_META_MAP.get(key)?.label ?? key,
          progressSuffix: SOURCE_META_MAP.get(key)?.suffix ?? DEFAULT_SUFFIX,
        }))
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, []);

  const [entries, setEntries] = React.useState<HallOfFameEntry[]>(() => readEntries());

  React.useEffect(() => {
    setEntries(readEntries());
  }, [readEntries]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key && !isHallOfFameStorageKey(event.key)) {
        return;
      }
      setEntries(readEntries());
    };

    const handleBroadcast = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (detail?.key && !isHallOfFameStorageKey(detail.key)) {
        return;
      }
      setEntries(readEntries());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("hof:update", handleBroadcast as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("hof:update", handleBroadcast as EventListener);
    };
  }, [readEntries]);

  return entries;
}

type HallOfFameSectionProps = {
  highlight?: boolean;
};

export function HallOfFameSection({ highlight }: HallOfFameSectionProps) {
  const entries = useHallOfFameEntries();
  const summarySnapshot = React.useMemo(() => loadHallOfFameSummary(), [entries]);
  const summaryPlayersRaw = summarySnapshot?.players;
  const summaryTotalRaw = summarySnapshot?.total;
  const summaryPointsRaw = summarySnapshot?.points;
  const summaryBonusTotals: SummaryTotals["bonuses"] =
    (summarySnapshot?.bonuses as SummaryTotals["bonuses"]) ??
    ((summarySnapshot as { bonusTotals?: SummaryTotals["bonuses"] })?.bonusTotals);
  const summaryPlayers = typeof summaryPlayersRaw === "number" && summaryPlayersRaw > 0 ? summaryPlayersRaw : 0;
  const totalRuns =
    typeof summaryTotalRaw === "number" && summaryTotalRaw > 0 ? summaryTotalRaw : entries.length;
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat("fr-FR"), []);

  const fallbackTotals = React.useMemo(
    () =>
      entries.reduce(
        (acc, entry) => {
          const score = Number(entry?.score ?? 0);
          if (Number.isFinite(score)) {
            acc.points += score;
          }
          const breakdown = entry?.bonusBreakdown;
          if (breakdown && typeof breakdown === "object") {
            const add = (key: "pasticciotto" | "rustico" | "caffe") => {
              const value = Number((breakdown as Record<string, unknown>)[key]);
              if (Number.isFinite(value)) {
                acc[key] += value;
              }
            };
            add("pasticciotto");
            add("rustico");
            add("caffe");
          }
          return acc;
        },
        { points: 0, pasticciotto: 0, rustico: 0, caffe: 0 }
      ),
    [entries]
  );

  const aggregateTotals = React.useMemo(() => {
    const pick = (value: unknown, fallback: number) => {
      const num = Number(value);
      if (Number.isFinite(num) && (num > 0 || fallback <= 0)) {
        return num;
      }
      return fallback;
    };

    return {
      points: pick(summaryPointsRaw, fallbackTotals.points),
      pasticciotto: pick(summaryBonusTotals?.pasticciotto, fallbackTotals.pasticciotto),
      rustico: pick(summaryBonusTotals?.rustico, fallbackTotals.rustico),
      caffe: pick(summaryBonusTotals?.caffe, fallbackTotals.caffe),
    };
  }, [fallbackTotals, summaryBonusTotals, summaryPointsRaw]);

  const playersCount = React.useMemo(() => {
    if (summaryPlayers > 0) {
      return summaryPlayers;
    }
    if (entries.length === 0) {
      return 0;
    }
    const fallback = new Set<string>();
    entries.forEach((entry, index) => {
      const normalizedName = normalizeHallOfFameName(entry.name);
      const countryLabel = entry.country?.label ?? (typeof entry.country === "string" ? entry.country : "");
      const normalizedCountry = normalizeHallOfFameName(countryLabel);
      const fallbackId = normalizedName || normalizedCountry || `${entry.sourceKey}:${entry.date ?? index}`;
      fallback.add(fallbackId);
    });
    return fallback.size;
  }, [entries, summaryPlayers]);

  const entryStats = React.useMemo(() => {
    const perSource = new Map<string, { label: string; count: number; order: number; suffix: string }>();
    SOURCE_META.filter((meta) => meta.alwaysShow).forEach((meta) => {
      perSource.set(meta.label, {
        label: meta.label,
        count: 0,
        order: SOURCE_LABEL_ORDER.get(meta.label) ?? Number.MAX_SAFE_INTEGER,
        suffix: meta.suffix ?? DEFAULT_SUFFIX,
      });
    });

    const summaryPerKey: Record<string, SummaryTotals> =
      (summarySnapshot?.perKey as Record<string, SummaryTotals>) ?? {};

    Object.entries(summaryPerKey).forEach(([key, data]) => {
      const meta = SOURCE_META_MAP.get(key);
      const label = meta?.label ?? key;
      const suffix = meta?.suffix ?? DEFAULT_SUFFIX;
      const order =
        SOURCE_LABEL_ORDER.get(label) ??
        (meta ? SOURCE_META.indexOf(meta) : Number.MAX_SAFE_INTEGER);
      perSource.set(label, {
        label,
        count: data?.runs ?? 0,
        order,
        suffix,
      });
    });

    entries.forEach((entry) => {
      const knownMeta = SOURCE_META_MAP.get(entry.sourceKey);
      const label = knownMeta?.label ?? entry.sourceLabel;
      const suffix = knownMeta?.suffix ?? entry.progressSuffix ?? DEFAULT_SUFFIX;
      const order =
        SOURCE_LABEL_ORDER.get(label) ??
        (knownMeta ? SOURCE_META.indexOf(knownMeta) : Number.MAX_SAFE_INTEGER);
      const existing = perSource.get(label);
      if (existing) {
        existing.suffix = suffix;
        if (!Object.prototype.hasOwnProperty.call(summaryPerKey, entry.sourceKey)) {
          existing.count += 1;
        }
      } else {
        perSource.set(label, {
          label,
          count: 1,
          order,
          suffix,
        });
      }
    });

    const sorted = Array.from(perSource.values()).sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });

    return {
      total: totalRuns,
      players: playersCount,
      perSource: sorted,
      totals: aggregateTotals,
    };
  }, [aggregateTotals, entries, playersCount, summarySnapshot, totalRuns]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!highlight) {
      return;
    }
    const node = containerRef.current;
    if (!node) {
      return;
    }
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    node.classList.add("bonus-index__hof--pulse");
    const timer = window.setTimeout(() => {
      node.classList.remove("bonus-index__hof--pulse");
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [highlight]);

  return (
    <section
      id="bonus-hof"
      ref={containerRef}
      className={"surface-card bonus-index__hof" + (highlight ? " bonus-index__hof--highlight" : "")}
      aria-labelledby="bonus-hof-title"
    >
      <header className="bonus-index__hof-header">
        <div>
          <h2 id="bonus-hof-title" className="bonus-index__hof-title">
            🏆 Hall of Fame
          </h2>
          <p className="bonus-index__hof-lead">
            Les meilleurs scores de la chasse sont enregistrés sur cet appareil. Challenge accepté ?
          </p>
          <div className="bonus-index__hof-meta" aria-live="polite">
            <div className="bonus-index__hof-stat bonus-index__hof-stat--accent">
              <span className="bonus-index__hof-stat-label">Points cumulés</span>
              <strong className="bonus-index__hof-stat-value">
                {numberFormatter.format(Math.max(0, Math.round(entryStats.totals.points)))}
              </strong>
            </div>
            <div className="bonus-index__hof-stat bonus-index__hof-stat--bonus">
              <span className="bonus-index__hof-stat-label">Pasticciotti collectés</span>
              <strong className="bonus-index__hof-stat-value">
                {numberFormatter.format(Math.max(0, Math.round(entryStats.totals.pasticciotto)))}
                <span aria-hidden="true" className="bonus-index__hof-stat-suffix">
                  🥮
                </span>
              </strong>
            </div>
            <div className="bonus-index__hof-stat bonus-index__hof-stat--bonus">
              <span className="bonus-index__hof-stat-label">Rustici collectés</span>
              <strong className="bonus-index__hof-stat-value">
                {numberFormatter.format(Math.max(0, Math.round(entryStats.totals.rustico)))}
                <span aria-hidden="true" className="bonus-index__hof-stat-suffix">
                  🥟
                </span>
              </strong>
            </div>
            <div className="bonus-index__hof-stat bonus-index__hof-stat--bonus">
              <span className="bonus-index__hof-stat-label">Caffè leccesi dégustés</span>
              <strong className="bonus-index__hof-stat-value">
                {numberFormatter.format(Math.max(0, Math.round(entryStats.totals.caffe)))}
                <span aria-hidden="true" className="bonus-index__hof-stat-suffix">
                  ☕
                </span>
              </strong>
            </div>
            <div className="bonus-index__hof-stat">
              <span className="bonus-index__hof-stat-label">Parties enregistrées</span>
              <strong className="bonus-index__hof-stat-value">{entryStats.total}</strong>
            </div>
            <div className="bonus-index__hof-stat">
              <span className="bonus-index__hof-stat-label">Joueurs uniques</span>
              <strong className="bonus-index__hof-stat-value">{entryStats.players}</strong>
            </div>
            {entryStats.perSource.map(({ label, count, suffix }) => (
              <div key={label} className="bonus-index__hof-stat">
                <span className="bonus-index__hof-stat-label">{label}</span>
                <strong className="bonus-index__hof-stat-value">
                  {count}
                  <span aria-hidden="true" className="bonus-index__hof-stat-suffix">
                    {suffix}
                  </span>
                </strong>
              </div>
            ))}
          </div>
        </div>
      </header>

      {entries.length === 0 ? (
        <p className="bonus-index__hof-empty" role="status">
          Aucun score n’a encore été enregistré. Termine une chasse pour inaugurer le tableau d’honneur !
        </p>
      ) : (
        <div className="bonus-index__hof-table-wrapper" role="region" aria-live="polite">
          <table className="bonus-index__hof-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Niveau</th>
                <th scope="col">Pays</th>
                <th scope="col">Joueur</th>
                <th scope="col">Score</th>
                <th scope="col">Progression</th>
                <th scope="col">Bonus</th>
                <th scope="col">Détail bonus</th>
                <th scope="col">Coups</th>
                <th scope="col">Temps</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={`${entry.name}-${entry.date}-${entry.sourceKey}-${index}`}>
                  <td>{index + 1}</td>
                  <td className="bonus-index__hof-mode">{entry.sourceLabel}</td>
                  <td>{entry.country?.flag || "🏳️"}</td>
                  <td className="bonus-index__hof-player" title={entry.country?.label || undefined}>
                    {entry.name || "Joueur"}
                  </td>
                  <td className="bonus-index__hof-score">{entry.score}</td>
                  <td>{entry.stars}{entry.progressSuffix}</td>
                  <td>{entry.bonuses}</td>
                  <td>{formatHallOfFameBreakdown(entry.bonusBreakdown)}</td>
                  <td>{entry.hits}</td>
                  <td>{formatHallOfFameTime(entry.time)}</td>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="bonus-index__hof-footer">
        Les scores ne quittent jamais votre appareil : ils sont stockés localement dans le navigateur.
      </footer>
    </section>
  );
}

export default HallOfFameSection;
