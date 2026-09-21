// A09 advisory UI: only the explicit advance callback may shorten an optional wait.
const rhythmCopy={
fr:['Annoncer les dangers','⚠ Ennemis bientôt','Question suivante','Voir les cibles'],
it:['Annuncia i pericoli','⚠ Nemici in arrivo','Prossima domanda','Mostra le risposte'],
en:['Announce dangers','⚠ Enemies approaching','Next question','Show targets'],
es:['Anunciar peligros','⚠ Se acercan enemigos','Siguiente pregunta','Mostrar objetivos']
};
export function mountRhythm({host,canvas,advance}){
 const label=document.createElement('label'),check=document.createElement('input'),caption=document.createElement('span');
 check.type='checkbox';try{check.checked=localStorage.getItem('hirundu_alerts_v1')!=='off';}catch{check.checked=true;}
 label.append(check,caption);host.append(label);
 const warning=document.createElement('div'),button=document.createElement('button');
 warning.className='hirundu-danger';warning.setAttribute('role','status');warning.style.pointerEvents='none';
 button.className='hirundu-advance';button.type='button';button.hidden=true;warning.hidden=true;document.body.append(warning,button);
 let current=null;
 check.onchange=()=>{try{localStorage.setItem('hirundu_alerts_v1',check.checked?'on':'off');}catch{}};
 button.onclick=()=>{if(current?.playing&&current.canAdvance&&advance){advance();button.hidden=true;current=null;}};
 function update(s){
  current=s;const t=rhythmCopy[(document.documentElement.lang||'fr').slice(0,2)]||rhythmCopy.fr;caption.textContent=t[0];
  const alert=s.playing&&!document.hidden&&check.checked&&s.dangerIn>0&&s.dangerIn<=.8;
  const ready=s.playing&&!document.hidden&&s.canAdvance&&!!advance;
  warning.hidden=!alert;button.hidden=!ready;
  if(alert||ready){const rect=canvas.getBoundingClientRect(),question=document.getElementById('tarTop')?.getBoundingClientRect();
   const top=Math.max(rect.top+8,question?.bottom?question.bottom+8:0),left=rect.left+rect.width*.5;
   for(const el of [warning,button]){el.style.left=left+'px';el.style.top=top+'px';}
   if(alert){warning.textContent=t[1];button.style.top=(top+32)+'px';}
   if(ready)button.textContent=t[s.advanceKind==='targets'?3:2];
  }
 }
 return {update,dispose(){label.remove();warning.remove();button.remove();}};
}
