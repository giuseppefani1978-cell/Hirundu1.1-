import React from "react";
import {
  formatHallOfFameBreakdown,
  formatHallOfFameTime,
  isHallOfFameStorageKey,
  loadAllHallOfFame,
} from "../../hof/storage";

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
    const metaMap: Record<string, { label: string; suffix: string }> = {
      salento_hof_v1: { label: "Niv. 1", suffix: "★" },
      salento_hof_v2: { label: "Niv. 2", suffix: "🌞" },
      salento_hof_v3: { label: "Niv. 3", suffix: "🍃" },
      salento_hof: { label: "Archive", suffix: "★" },
      salento_hof_v0: { label: "Archive", suffix: "★" },
      hof: { label: "Archive", suffix: "★" },
    };

    const data = loadAllHallOfFame();
    return data
      .flatMap(({ key, entries }) =>
        entries.map((entry) => ({
          ...entry,
          sourceKey: key,
          sourceLabel: metaMap[key]?.label ?? key,
          progressSuffix: metaMap[key]?.suffix ?? "★",
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
  const entryStats = React.useMemo(() => {
    const perSource = new Map<string, number>();
    const playerIds = new Set<string>();
    entries.forEach((entry) => {
      perSource.set(entry.sourceLabel, (perSource.get(entry.sourceLabel) ?? 0) + 1);
      const normalizedName = normalizePlayerName(entry.name);
      if (normalizedName) {
        playerIds.add(normalizedName);
      }
    });
    return {
      total: entries.length,
      players: playerIds.size,
      perSource: Array.from(perSource.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [entries]);
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
          {entryStats.total > 0 ? (
            <p className="bonus-index__hof-meta" aria-live="polite">
              {entryStats.total} partie{entryStats.total > 1 ? "s" : ""} enregistrée{entryStats.total > 1 ? "s" : ""}
              {entryStats.players > 0
                ? ` · ${entryStats.players} joueur${entryStats.players > 1 ? "s" : ""}`
                : ""}
              {entryStats.perSource.length > 0 ? " · " : ""}
              {entryStats.perSource.map(([label, count], index) => (
                <span key={label}>
                  {label}: {count}
                  {index < entryStats.perSource.length - 1 ? " • " : ""}
                </span>
              ))}
            </p>
          ) : null}
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

function normalizePlayerName(name?: string): string {
  if (!name) {
    return "";
  }
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default HallOfFameSection;
