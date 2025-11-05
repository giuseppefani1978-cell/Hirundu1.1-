// src/features/bonus/bonusNavigation.ts
import { BONUS_MAPS, type BonusKey } from "./bonusData";
import { getUnlockedKeys, unlockBonus } from "./bonusStorage";
import { withBase } from "../../paths";

const ORDERED_KEYS = Object.keys(BONUS_MAPS) as BonusKey[];

export function openBonusMap(key: BonusKey): void {
  const cfg = BONUS_MAPS[key];
  if (!cfg) {
    if (typeof window !== "undefined") {
      window.alert?.("Carte bonus inconnue.");
    }
    return;
  }

  unlockBonus(key);
  if (typeof window === "undefined") return;

  // ✅ URL préfixée par la base GitHub Pages + paramètre embed
  const url = withBase(`index.html?embed=1#/poi/${encodeURIComponent(key)}/realmap`);
  window.location.assign(url);
}

export function openBonusHub(): void {
  const unlocked = getUnlockedKeys();
  const orderedUnlocked = ORDERED_KEYS.filter((key) => unlocked.includes(key));

  if (!orderedUnlocked.length) {
    if (typeof window !== "undefined") {
      window.alert?.("Aucun bonus débloqué pour l’instant.");
    }
    return;
  }

  if (typeof window === "undefined") return;

  const win = window.open("", "_blank", "width=520,height=520,noopener");
  if (!win) return;

  // ✅ Pré-calcul des href corrects avec withBase
  const linksHtml = orderedUnlocked
    .map((k) => {
      const href = withBase(`index.html?embed=1#/poi/${encodeURIComponent(k)}/realmap`);
      return `
        <a class="btn" href="${href}" target="_blank" rel="noopener">
          ${BONUS_MAPS[k].title}
        </a>`;
    })
    .join("");

  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Cartes bonus</title>
        <style>
          body{margin:0;background:#0b0d10;color:#fff;font:14px system-ui}
          .box{
            max-width:460px;margin:30px auto;padding:16px 18px;border-radius:12px;
            background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
            border:1px solid rgba(255,255,255,.12)
          }
          h2{margin:.2rem 0 1rem 0;font:700 20px system-ui}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
          a.btn{
            display:block;text-align:center;padding:10px 12px;border-radius:10px;
            text-decoration:none;color:#fff;background:#1f2937
          }
          a.btn:hover{background:#374151}
        </style>
      </head>
      <body>
        <div class="box">
          <h2>Cartes bonus débloquées</h2>
          <div class="grid">
            ${linksHtml}
          </div>
        </div>
      </body>
    </html>
  `);
}
