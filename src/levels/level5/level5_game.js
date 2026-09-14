import { boot as bootHunt } from '../level3/level3_game.js';
import { regionById, tr } from '../regions';
import { withBase } from '../../paths';

// Hand-calibrated against the Salento coastal maps (see docs/niveau-5-v85.md).
// Normalized artwork positions, not GPS: preserve coastal/inland relationships
// while separating neighbouring villages for the hunt's collision radius.
export const positions = [[.78,.92],[.81,.825],[.62,.84],[.57,.79],[.47,.745],
  [.57,.715],[.78,.62],[.73,.69],[.80,.755],[.33,.60]];
export function startLevel5(options = {}) {
  const region = regionById(5);
  return bootHunt({ ...options, region: {
    id: 5, key: 'capo', token: '💧', foeType: 'scirocco',
    title: tr(region.title),
    subtitle: tr(['Dix lieux réels, dix gouttes, une bataille.','Dieci luoghi reali, dieci gocce, una battaglia.','Ten real places, ten drops, one battle.','Diez lugares reales, diez gotas, una batalla.']),
    mission: tr(['Guide Hirundu avec les flèches vers le lieu de chaque énigme. Évite les ennemis et ramasse les bonus.','Guida Hirundu con le frecce verso il luogo di ogni enigma. Evita i nemici e raccogli i bonus.','Guide Hirundu with the arrows to each clue’s place. Avoid enemies and collect bonuses.','Guía a Hirundu con las flechas hasta el lugar de cada enigma. Evita enemigos y recoge bonos.']),
    inventoryLabel: tr(['Gouttes','Gocce','Drops','Gotas']),
    bossName: 'Scirocco', bossSprite: withBase('assets/boss-5.svg'),
    backdrop: withBase('assets/battle_bg_leuca.png'),
    pois: region.places.map((p,i)=>({key:`capo-${i}`,name:p.name,town:p.town,icon:p.icon,clue:tr(p.clue),x:positions[i][0],y:positions[i][1]})),
  }});
}
