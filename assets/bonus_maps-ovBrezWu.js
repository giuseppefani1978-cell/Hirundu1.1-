import{B as l}from"./bonusData-CvYy_4sf.js";import{b as d,u as p}from"./bonusStorage-C0wZtBZH.js";import{w as f}from"./paths-D28l4vuO.js";const g=Object.keys(l);function m(o){var t,r;if(!l[o]){typeof window<"u"&&((t=window.alert)==null||t.call(window,"Carte bonus inconnue."));return}if(!d().includes(o)){typeof window<"u"&&((r=window.alert)==null||r.call(window,"Cette découverte n’est pas encore débloquée."));return}if(typeof window>"u")return;const i=f(`index.html?embed=1#/poi/${encodeURIComponent(o)}/realmap`);window.location.assign(i)}function s(){var t;const o=d(),n=g.filter(r=>o.includes(r));if(!n.length){typeof window<"u"&&((t=window.alert)==null||t.call(window,"Aucun bonus débloqué pour l’instant."));return}if(typeof window>"u")return;const e=window.open("","_blank","width=520,height=520,noopener");if(!e)return;const i=n.map(r=>`
        <a class="btn" href="${f(`index.html?embed=1#/poi/${encodeURIComponent(r)}/realmap`)}" target="_blank" rel="noopener">
          ${l[r].title}
        </a>`).join("");e.document.write(`
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
            ${i}
          </div>
        </div>
      </body>
    </html>
  `)}const a={otranto:"otranto",gallipoli:"gallipoli",lecce:"lecce",qr_bonus_otranto:"otranto",qr_bonus_gallipoli:"gallipoli",qr_bonus_lecce:"lecce",bonus_otranto:"otranto",bonus_gallipoli:"gallipoli",bonus_lecce:"lecce",otranto_bonus:"otranto",gallipoli_bonus:"gallipoli",lecce_bonus:"lecce"},h={otranto:["otranto_bonus_unlocked","bonus_otranto_unlocked"],gallipoli:["gallipoli_bonus_unlocked"],lecce:["lecce_bonus_unlocked","bonus_lecce_unlocked"]},_={otranto:"otranto:unlocked",gallipoli:"gallipoli:unlocked",lecce:"lecce:unlocked"};function b(o){for(let n=o.length-1;n>=0;n-=1){const e=o[n];if(typeof e!="string")continue;const i=e.trim();if(!i)continue;const t=i.toLowerCase();if(a[t])return a[t];const r=t.replace(/[^a-z0-9_]/g,"");if(a[r])return a[r];if(Object.prototype.hasOwnProperty.call(l,t))return t;if(Object.prototype.hasOwnProperty.call(l,r))return r}}function w(o){var e,i;if(typeof window>"u")return;const n=h[o];if(n!=null&&n.length)try{const t=window.localStorage;if(!t)return;n.forEach(c=>{var u;try{t.setItem(c,"true"),(u=window.dispatchEvent)==null||u.call(window,new StorageEvent("storage",{key:c,newValue:"true"}))}catch{}});try{const c=t.getItem("bonus_unlocked_v1");(e=window.dispatchEvent)==null||e.call(window,new StorageEvent("storage",{key:"bonus_unlocked_v1",newValue:c??""}))}catch{}const r=_[o];if(r)try{(i=document.dispatchEvent)==null||i.call(document,new Event(r))}catch{}}catch{}}function v(...o){const n=b(o);if(!n){console.warn("[bonus_maps] unlockBonus : clé inconnue",o);return}p(n),w(n)}function E(...o){const n=b(o);if(!n){console.warn("[bonus_maps] openBonusMap : clé inconnue",o);return}p(n),w(n);try{const e=`#/bonus/${n}`;window.location.hash!==e?(window.location.hash=e,console.log(`[bonus_maps] Navigation vers ${e}`)):m(n)}catch(e){console.error("[bonus_maps] Erreur openBonusMap SPA :",e);try{s==null||s(n)}catch{const i=`./index.html?embed=1#/${n}`;console.warn("[bonus_maps] Fallback vers legacy URL :",i),window.location.href=i}}}export{E as o,v as u};
