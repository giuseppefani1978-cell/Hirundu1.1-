import { boot as bootHunt } from '../level3/level3_game.js';
import { regionById, tr } from '../regions';
import { withBase } from '../../paths';

// Normalized positions on the illustrated map; spaced for the collision radius.
export const positions = [[.20,.42],[.10,.265],[.33,.31],[.25,.255],[.21,.19],
  [.255,.09],[.165,.13],[.355,.135],[.355,.215],[.45,.15]];
export function startLevel6(options = {}) {
  const region = regionById(6);
  return bootHunt({ ...options, region: {
    id: 6, key: 'arneo', token: '🌲', foeType: 'resino',
    title: tr(region.title),
    subtitle: tr(['Dix lieux réels, dix pins, une bataille.','Dieci luoghi reali, dieci pini, una battaglia.','Ten real places, ten pines, one battle.','Diez lugares reales, diez pinos, una batalla.']),
    mission: tr(['Guide Hirundu avec les flèches vers le lieu de chaque énigme. Évite les ennemis et ramasse les bonus.','Guida Hirundu con le frecce verso il luogo di ogni enigma. Evita i nemici e raccogli i bonus.','Guide Hirundu with the arrows to each clue’s place. Avoid enemies and collect bonuses.','Guía a Hirundu con las flechas hasta el lugar de cada enigma. Evita enemigos y recoge bonos.']),
    inventoryLabel: tr(['Pins','Pini','Pines','Pinos']),
    bossName: 'Resino', bossSprite: withBase('assets/boss-6.svg'),
    backdrop: withBase('assets/battle_bg_copertino.png'),
    pois: region.places.map((p,i)=>({key:`arneo-${i}`,name:p.name,town:p.town,icon:p.icon,clue:tr(p.clue),x:positions[i][0],y:positions[i][1]})),
  }});
}
