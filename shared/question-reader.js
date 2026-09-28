/* Read the complete current clue through the existing pause UI. No auto-resume. */
(() => {
 const question=document.getElementById('question');
 const container=document.querySelector('.question, .speech');
 const cover=document.getElementById('cover');
 if(!question||!container||!cover)return;
 const words={fr:['Lire','Lire la question complète'],it:['Leggi','Leggi la domanda completa'],en:['Read','Read the full question'],es:['Leer','Leer la pregunta completa']};
 const button=document.createElement('button');button.type='button';button.className='hirundu-question-reader';
 const label=document.createElement('span');label.setAttribute('aria-hidden','true');button.append(label);container.append(button);
 function update(){const w=words[document.documentElement.lang]||words.en;label.textContent=w[0];button.setAttribute('aria-label',w[1]+': '+question.textContent);button.hidden=!(cover.hidden||cover.classList.contains('hidden'))||document.body.classList.contains('battle-active')||!question.textContent.trim();}
 button.addEventListener('click',e=>{e.stopPropagation();if(button.hidden)return;if(window.hirunduReadQuestion?.(question.textContent)){const resume=document.getElementById('play')||document.getElementById('start');resume?.focus({preventScroll:true});}});
 const observer=new MutationObserver(update);observer.observe(question,{childList:true,characterData:true,subtree:true});observer.observe(cover,{attributes:true,attributeFilter:['class','hidden']});observer.observe(document.body,{attributes:true,attributeFilter:['class']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});update();
})();
