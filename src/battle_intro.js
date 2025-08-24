// src/battleIntro.js
export function enterBattleIntro(cityName="Trento", onContinue){
  const overlay = document.createElement('div');
  overlay.id = '__battle_intro__';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:10005;
    background:#000; color:#fff; display:flex; align-items:center; justify-content:center;
    font:700 28px system-ui; text-align:center;
    animation:fadeIn 1s forwards;
  `;
  overlay.innerHTML = `<div>⚔️ Bataille de ${cityName}</div>`;
  document.body.appendChild(overlay);

  setTimeout(()=>{
    overlay.addEventListener('click', ()=> {
      overlay.remove();
      onContinue?.();
    });
  }, 800);

  // Auto-continue après 3s
  setTimeout(()=>{
    if (document.body.contains(overlay)){
      overlay.remove();
      onContinue?.();
    }
  }, 3000);
}
