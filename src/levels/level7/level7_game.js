import { boot as bootHunt } from '../level3/level3_game.js';
import { regionById, tr } from '../regions';
import { withBase } from '../../paths';

// Normalized positions on the illustrated map; spaced for the collision radius.
export const positions = [[0.32,0.4],[0.39,0.46],[0.52,0.41],[0.58,0.35],[0.7,0.36],[0.6,0.47],[0.38,0.59],[0.45,0.54],[0.47,0.64],[0.6,0.66]];
export function startLevel7(options = {}) {
  const region = regionById(7);
  return bootHunt({ ...options, region: {
    id: 7, key: 'nardo', token: '🫒', foeType: 'macina',
    title: tr(region.title),
    subtitle: tr(['Dix lieux réels, dix découvertes, une bataille.','Dieci luoghi reali, dieci scoperte, una battaglia.','Ten real places, ten discoveries, one battle.','Diez lugares reales, diez descubrimientos, una batalla.']),
    mission: tr(['Guide Hirundu avec les flèches vers le lieu de chaque énigme. Évite les ennemis et ramasse les bonus.','Guida Hirundu con le frecce verso il luogo di ogni enigma. Evita i nemici e raccogli i bonus.','Guide Hirundu with the arrows to each clue’s place. Avoid enemies and collect bonuses.','Guía a Hirundu con las flechas hasta el lugar de cada enigma. Evita enemigos y recoge bonos.']),
    inventoryLabel: tr(["Olives","Olive","Olives","Aceitunas"]),
    bossName: 'Macina', bossSprite: withBase('assets/boss-8.svg'),
    backdrop: withBase('assets/battle_bg_nardo.png'),
    pois: region.places.map((p,i)=>({key:`nardo-${i}`,name:p.name,town:p.town,icon:p.icon,clue:tr(p.clue),x:positions[i][0],y:positions[i][1]})),
  }});
}
