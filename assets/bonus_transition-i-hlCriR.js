const r="__victory_bonus_btn",s={otranto:{label:"🌟 BONUS → Carte",href:"/app.html#otranto",storageKeys:["bonus_unlocked","bonus_otranto_unlocked","otranto_bonus_unlocked"]},gallipoli:{label:"🌟 BONUS → Carte",href:"/app.html#gallipoli",storageKeys:["bonus_unlocked","bonus_gallipoli_unlocked","gallipoli_bonus_unlocked"]},lecce:{label:"🌟 BONUS → Carte",href:"/app.html#lecce",storageKeys:["bonus_unlocked","bonus_lecce_unlocked","lecce_bonus_unlocked"]}};let a=null;function u(){const e=document.getElementById(r);e&&e.parentNode&&e.parentNode.removeChild(e),a=null}function p(e){if(document.getElementById(r))return null;const t=s[e];if(!t)return null;const n=document.createElement("button");return n.id=r,n.type="button",n.textContent=t.label,n.style.cssText=`
    display:block; width:100%;
    margin-top:12px;
    background:#34d399; color:#0b3c2f;
    border:0; border-radius:14px;
    padding:12px 16px;
    font:700 14px/1 system-ui;
    box-shadow:0 6px 18px rgba(0,0,0,.25);
    cursor:pointer;
  `,n.addEventListener("click",()=>{try{t.storageKeys.forEach(o=>{localStorage.setItem(o,"true")})}catch{}window.location.href=t.href}),n}async function m(e=4e3){const t=performance.now();return new Promise(n=>{const o=()=>document.getElementById("overlayCard"),c=o();if(c)return n(c);const i=setInterval(()=>{const d=o();d?(clearInterval(i),n(d)):performance.now()-t>e&&(clearInterval(i),n(null))},80)})}async function l(e=a){if(!e||!s[e]||(a=e,window.location.pathname.endsWith("/")||window.location.pathname.endsWith("/index.html")||window.location.pathname==="/index.html"))return;const n=await m();if(!n||n.querySelector(`#${r}`))return;const o=p(e);o&&n.appendChild(o)}function f(){u(),window.addEventListener("otranto:unlocked",()=>{l("otranto")}),window.addEventListener("gallipoli:unlocked",()=>{l("gallipoli")}),window.addEventListener("lecce:unlocked",()=>{l("lecce")}),window.addEventListener("hashchange",()=>{!!document.getElementById("overlayCard")&&l()})}export{u as r,f as s};
