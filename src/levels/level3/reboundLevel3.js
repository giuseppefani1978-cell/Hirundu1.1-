import { withBase } from '../../paths';
import { LANG } from '../../i18n.js';
import { markLevelWin, unlockBonus } from '../../features/bonus/bonusStorage';
import { addHallOfFameEntry } from '../../hof/storage.js';
import { FLOW_PHASES, PAUSE_EVENT, setGameFlowPhase, clearGameFlow } from '../../game_flow.js';

// Keep the validated prototype in its own document: its canvas/CSS and listeners
// cannot alter the classic hunts used by levels 1, 2 and 4–9.
export function bootReboundLevel3(options = {}) {
  const frame = document.createElement('iframe');
  const url = new URL(withBase('level3-arkanoid/index.html'));
  url.searchParams.set('lang', LANG);
  if (options.testBattle) url.searchParams.set('test', 'battle');
  frame.id = 'hirundu-level3-rebound';
  frame.title = 'HIRUNDU · Niveau 3 · Lecce';
  frame.allow = 'fullscreen';
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100dvh;border:0;z-index:20000;background:#bfe2f8;';
  frame.src = url.href;
  let active = true, won = false, handledWin = false;
  const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const send = data => frame.contentWindow?.postMessage({source:'hirundu-host', ...data}, window.location.origin);
  const installState = () => send({type:'install-state', available:!!window.__HIRUNDU_PWA_INSTALL_AVAILABLE__});
  const phaseMap = {intro:FLOW_PHASES.LEVEL_INTRO,ready:FLOW_PHASES.HUNT,flying:FLOW_PHASES.HUNT,transition:FLOW_PHASES.HUNT,battleIntro:FLOW_PHASES.BATTLE_INTRO,battle:FLOW_PHASES.BATTLE,battleLost:FLOW_PHASES.DEFEAT,won:FLOW_PHASES.VICTORY};
  const onMessage = event => {
    if (!active || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'hirundu-level3') return;
    if (data.type === 'ready') installState();
    if (data.type === 'phase') {
      const phase = phaseMap[data.mode === 'paused' ? data.previous : data.mode];
      if (phase) setGameFlowPhase(phase, {level:3});
      // New run: permit recording a subsequent completed hunt.
      if (data.mode === 'ready' && won) {won=false;handledWin=false;}
    }
    if (data.type === 'victory' && !options.testBattle && !handledWin && data.leaves === 10 && finite(data.score) && finite(data.elapsed)) {
      handledWin=true;won=true;
      markLevelWin(3);unlockBonus('lecce');
      try {
        window.localStorage.setItem('lecce_bonus_unlocked','true');
        window.localStorage.setItem('bonus_lecce_unlocked','true');
        addHallOfFameEntry({name:window.localStorage.getItem('player_name')||'Aracne',score:Math.round(data.score),stars:10,time:Math.round(data.elapsed*1000),hits:finite(data.misses)?data.misses:0,won:true,date:new Date().toISOString()},'salento_hof_v3');
      } catch (error) { console.warn('Unable to record level 3 score',error); }
    }
    // The existing React level route owns navigation/progression to level 4.
    if (data.type === 'continue' && won) document.dispatchEvent(new Event('lecce:unlocked'));
    if (data.type === 'discoveries') window.location.hash='#/bonus/lecce';
    if (data.type === 'exit') window.location.hash='#/';
    if (data.type === 'install') {
      Promise.resolve(window.__HIRUNDU_INSTALL_APP__?.()).catch(()=>{}).finally(installState);
    }
    if (data.type === 'music-toggle') {
      document.getElementById('musicBtn')?.click();
    }
  };
  const onPause = event => { if(event.detail?.paused) send({type:'pause'}); };
  window.addEventListener('message',onMessage);
  window.addEventListener(PAUSE_EVENT,onPause);
  window.addEventListener('hirundu:pwa-install-state',installState);
  setGameFlowPhase(FLOW_PHASES.LEVEL_INTRO,{level:3});
  document.body.appendChild(frame);
  return () => {
    active=false;
    window.removeEventListener('message',onMessage);
    window.removeEventListener(PAUSE_EVENT,onPause);
    window.removeEventListener('hirundu:pwa-install-state',installState);
    frame.remove();
    clearGameFlow();
  };
}
