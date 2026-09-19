import { withBase } from '../../paths';
import { LANG } from '../../i18n.js';
import { markLevelWin, unlockBonus } from '../../features/bonus/bonusStorage';
import { addHallOfFameEntry } from '../../hof/storage.js';
import { FLOW_PHASES, LANGUAGE_EVENT, PAUSE_EVENT, setGameFlowPhase, clearGameFlow } from '../../game_flow.js';
import { AUDIO_STATE_EVENT, isMusicOn } from '../../audio.js';

// Level 5 deliberately reuses the validated Level 3 rebound shell in an isolated iframe.
// Content, POIs, boss, backdrop and difficulty are Level-5-specific.
export function bootReboundLevel5(options = {}) {
  const frame = document.createElement('iframe');
  const url = new URL(withBase('level5-arkanoid/index.html'), window.location.href);
  url.searchParams.set('lang', LANG);
  url.searchParams.set('build', '20260918-feedback-v3');
  if (options.testBattle) url.searchParams.set('test', 'battle');

  frame.id = 'hirundu-level5-rebound';
  frame.title = 'HIRUNDU · Niveau 5 · Capo di Leuca';
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
    if (!data || data.source !== 'hirundu-level5') return;

    if (data.type === 'ready') {
      installState();
      musicState();
    }

    if (data.type === 'phase') {
      const phase = phaseMap[data.mode === 'paused' ? data.previous : data.mode];
      if (phase) setGameFlowPhase(phase, { level:5 });
      if (data.mode === 'ready' && won) {
        won = false;
        handledWin = false;
      }
    }

    if (data.type === 'victory' && !options.testBattle && !handledWin && data.leaves === 10 && finite(data.score) && finite(data.elapsed)) {
      handledWin = true;
      won = true;
      markLevelWin(5);
      unlockBonus('capo');
      try {
        window.localStorage.setItem('capo_bonus_unlocked','true');
        window.localStorage.setItem('bonus_capo_unlocked','true');
        addHallOfFameEntry({
          name:window.localStorage.getItem('player_name') || 'Aracne',
          score:Math.round(data.score),
          stars:10,
          time:Math.round(data.elapsed * 1000),
          hits:finite(data.misses) ? data.misses : 0,
          won:true,
          date:new Date().toISOString(),
        }, 'salento_hof_v5');
      } catch (error) {
        console.warn('Unable to record level 5 score', error);
      }
    }

    if (data.type === 'continue' && won) document.dispatchEvent(new Event('capo:unlocked'));
    if (data.type === 'discoveries') window.location.hash = '#/bonus/capo';
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
  const onLanguage = event => {
    const next = String(event.detail?.lang || '').slice(0,2).toLowerCase();
    if (next) send({ type:'language', lang:next });
  };

  window.addEventListener('message', onMessage);
  window.addEventListener(PAUSE_EVENT, onPause);
  window.addEventListener(LANGUAGE_EVENT, onLanguage);
  window.addEventListener('hirundu:pwa-install-state', installState);
  window.addEventListener(AUDIO_STATE_EVENT, musicState);

  setGameFlowPhase(FLOW_PHASES.LEVEL_INTRO, { level:5 });
  document.body.appendChild(frame);

  return () => {
    active = false;
    window.removeEventListener('message', onMessage);
    window.removeEventListener(PAUSE_EVENT, onPause);
    window.removeEventListener(LANGUAGE_EVENT, onLanguage);
    window.removeEventListener('hirundu:pwa-install-state', installState);
    window.removeEventListener(AUDIO_STATE_EVENT, musicState);
    frame.remove();
    clearGameFlow();
  };
}
