import { boot as bootHunt } from '../level3/level3_game.js';
import { regionById } from '../regions';
import { withBase } from '../../paths';

// Hand-calibrated against the Salento coastal maps (see docs/niveau-4-v84.md).
// Normalized artwork positions, not GPS: preserve coastal/inland relationships
// while separating neighbouring villages for the hunt's collision radius.
export const positions = [[.63,.22],[.79,.30],[.93,.49],[.79,.48],[.845,.535],
  [.74,.565],[.87,.625],[.835,.71],[.75,.67],[.69,.625]];
export function startLevel4(options = {}) {
  const region = regionById(4);
  return bootHunt({ ...options, region: {
    title: region.title,
    subtitle: ['Dix lieux réels, dix coquillages, une bataille.','Dieci luoghi reali, dieci conchiglie, una battaglia.','Ten real places, ten shells, one battle.','Diez lugares reales, diez conchas, una batalla.'],
    mission: ['Guide Hirundu avec les flèches vers le lieu de chaque énigme. Évite les ennemis et ramasse les bonus.','Guida Hirundu con le frecce verso il luogo di ogni enigma. Evita i nemici e raccogli i bonus.','Guide Hirundu with the arrows to each clue’s place. Avoid enemies and collect bonuses.','Guía a Hirundu con las flechas hasta el lugar de cada enigma. Evita enemigos y recoge bonos.'],
    inventoryLabel: ['Coquillages','Conchiglie','Shells','Conchas'],
    bossName: 'Nacra', bossSprite: withBase('assets/boss-4.svg'),
    backdrop: withBase('assets/battle_bg_acaya.webp'),
    pois: region.places.map((p,i)=>({key:`adriatico-${i}`,name:p.name,town:p.town,icon:p.icon,clue:p.clue,x:positions[i][0],y:positions[i][1]})),
  }});
}
