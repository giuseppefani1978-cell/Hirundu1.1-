import { boot as bootHunt } from '../level3/level3_game.js';
import { regionById, tr } from '../regions';
import { withBase } from '../../paths';

// Normalized positions on the illustrated map; spaced for the collision radius.
export const positions = [[0.34,0.25],[0.4,0.13],[0.56,0.19],[0.29,0.1],[0.19,0.18],[0.43,0.335],[0.23,0.35],[0.21,0.265],[0.12,0.35],[0.3,0.4]];
export function startLevel8(options = {}) {
  const region = regionById(8);
  return bootHunt({ ...options, region: {
    id: 8, key: 'messapia', token: '🏺', foeType: 'argillo',
    title: tr(region.title),
    subtitle: tr(['Dix lieux réels, dix découvertes, une bataille.','Dieci luoghi reali, dieci scoperte, una battaglia.','Ten real places, ten discoveries, one battle.','Diez lugares reales, diez descubrimientos, una batalla.']),
    mission: tr(['Guide Hirundu avec les flèches vers le lieu de chaque énigme. Évite les ennemis et ramasse les bonus.','Guida Hirundu con le frecce verso il luogo di ogni enigma. Evita i nemici e raccogli i bonus.','Guide Hirundu with the arrows to each clue’s place. Avoid enemies and collect bonuses.','Guía a Hirundu con las flechas hasta el lugar de cada enigma. Evita enemigos y recoge bonos.']),
    inventoryLabel: tr(["Amphores","Anfore","Amphorae","Ánforas"]),
    bossName: 'Argillo', bossSprite: withBase('assets/boss-9.svg'),
    backdrop: withBase('assets/battle_bg_messapia.png'),
    pois: region.places.map((p,i)=>({key:`messapia-${i}`,name:p.name,town:p.town,icon:p.icon,clue:tr(p.clue),x:positions[i][0],y:positions[i][1]})),
  }});
}
