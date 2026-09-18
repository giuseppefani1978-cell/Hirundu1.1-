import { withBase } from '../../paths';
import { LANG } from '../../i18n.js';
import { markLevelWin, unlockBonus } from '../../features/bonus/bonusStorage';
import { addHallOfFameEntry } from '../../hof/storage.js';
import { FLOW_PHASES, PAUSE_EVENT, setGameFlowPhase, clearGameFlow } from '../../game_flow.js';
import { AUDIO_STATE_EVENT, isMusicOn } from '../../audio.js';

// Level 7 deliberately reuses the validated Level 3 rebound shell in an isolated iframe.
// Content, POIs, boss, backdrop and difficulty are Level-7-specific.
export function bootReboundLevel7(options = {}) {
  const frame = document.createElement('iframe');
  const url = new URL(withBase('level7-arkanoid/index.html'), window.location.href);
  url.searchParams.set('lang', LANG);
  if (options.testBattle) url.searchParams.set('test', 'battle');

  frame.id = 'hirundu-level7-rebound';
  frame.title = 'HIRUNDU · Niveau 7 · Nardò';
  frame.allow = 'fullscreen';
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100dvh;border:0;z-index:20000;background:#bfe2f8;';
  frame.src = url.href;

  let active = true;
  let won = false;
  let handledWin = false;

  const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const send = data => frame.contentWindow?.postMessage({ source:'hirundu-host', ...data }, window.location.origin);
  const installState = () => send({ type:'install-state', available:!!window.__HIRUNDU_PWA_INSTALL_AVAILABLE__ });
  const musicState = () => send({ type:'music-state', enabled:isMusicOn() });

  const phaseMap = {
    intro:FLOW_PHASES.LEVEL_INTRO,
    ready:FLOW_PHASES.HUNT,
    flying:FLOW_PHASES.HUNT,
    transition:FLOW_PHASES.HUNT,
    battleIntro:FLOW_PHASES.BATTLE_INTRO,
    battle:FLOW_PHASES.BATTLE,
    battleLost:FLOW_PHASES.DEFEAT,
    won:FLOW_PHASES.VICTORY,
  };

  const onMessage = event => {
    if (!active || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'hirundu-level7') return;

    if (data.type === 'ready') {
      installState();
      musicState();
    }

    if (data.type === 'phase') {
      const phase = phaseMap[data.mode === 'paused' ? data.previous : data.mode];
      if (phase) setGameFlowPhase(phase, { level:7 });
      if (data.mode === 'ready' && won) {
        won = false;
        handledWin = false;
      }
    }

    if (data.type === 'victory' && !options.testBattle && !handledWin && data.leaves === 10 && finite(data.score) && finite(data.elapsed)) {
      handledWin = true;
      won = true;
      markLevelWin(7);
      unlockBonus('nardo');
      try {
        window.localStorage.setItem('nardo_bonus_unlocked','true');
        window.localStorage.setItem('bonus_nardo_unlocked','true');
        addHallOfFameEntry({
          name:window.localStorage.getItem('player_name') || 'Aracne',
          score:Math.round(data.score),
          stars:10,
          time:Math.round(data.elapsed * 1000),
          hits:finite(data.misses) ? data.misses : 0,
          won:true,
          date:new Date().toISOString(),
        }, 'salento_hof_v7');
      } catch (error) {
        console.warn('Unable to record level 7 score', error);
      }
    }

    if (data.type === 'continue' && won) document.dispatchEvent(new Event('nardo:unlocked'));
    if (data.type === 'discoveries') window.location.hash = '#/bonus/nardo';
    if (data.type === 'exit') window.location.hash = '#/';
    if (data.type === 'install') {
      Promise.resolve(window.__HIRUNDU_INSTALL_APP__?.()).catch(()=>{}).finally(installState);
    }
    if (data.type === 'music-toggle') {
      document.getElementById('musicBtn')?.click();
    }
  };

  const onPause = event => {
    if (event.detail?.paused) send({ type:'pause' });
  };

  window.addEventListener('message', onMessage);
  window.addEventListener(PAUSE_EVENT, onPause);
  window.addEventListener('hirundu:pwa-install-state', installState);
  window.addEventListener(AUDIO_STATE_EVENT, musicState);

  setGameFlowPhase(FLOW_PHASES.LEVEL_INTRO, { level:7 });
  document.body.appendChild(frame);

  return () => {
    active = false;
    window.removeEventListener('message', onMessage);
    window.removeEventListener(PAUSE_EVENT, onPause);
    window.removeEventListener('hirundu:pwa-install-state', installState);
    window.removeEventListener(AUDIO_STATE_EVENT, musicState);
    frame.remove();
    clearGameFlow();
  };
}
