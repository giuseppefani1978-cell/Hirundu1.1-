import { boot as bootHunt } from '../level3/level3_game.js';
import { regionById, tr } from '../regions';
import { withBase } from '../../paths';

// Normalized positions on the illustrated map; spaced for the collision radius.
export const positions = [[0.53,0.2],[0.66,0.235],[0.73,0.31],[0.43,0.265],[0.38,0.155],[0.27,0.145],[0.27,0.23],[0.46,0.09],[0.2,0.18],[0.57,0.315]];
export function startLevel9(options = {}) {
  const region = regionById(9);
  return bootHunt({ ...options, region: {
    id: 9, key: 'itria', token: '💎', foeType: 'calcara',
    title: tr(region.title),
    subtitle: tr(['Dix lieux réels, dix découvertes, une bataille.','Dieci luoghi reali, dieci scoperte, una battaglia.','Ten real places, ten discoveries, one battle.','Diez lugares reales, diez descubrimientos, una batalla.']),
    mission: tr(['Guide Hirundu avec les flèches vers le lieu de chaque énigme. Évite les ennemis et ramasse les bonus.','Guida Hirundu con le frecce verso il luogo di ogni enigma. Evita i nemici e raccogli i bonus.','Guide Hirundu with the arrows to each clue’s place. Avoid enemies and collect bonuses.','Guía a Hirundu con las flechas hasta el lugar de cada enigma. Evita enemigos y recoge bonos.']),
    inventoryLabel: tr(["Cristaux","Cristalli","Crystals","Cristales"]),
    bossName: 'Calcara', bossSprite: withBase('assets/boss-8.svg'),
    backdrop: withBase('assets/battle_bg_ostuni.webp'),
    pois: region.places.map((p,i)=>({key:`itria-${i}`,name:p.name,town:p.town,icon:p.icon,clue:tr(p.clue),x:positions[i][0],y:positions[i][1]})),
  }});
}
