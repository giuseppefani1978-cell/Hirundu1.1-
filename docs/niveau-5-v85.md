# Niveau 5 — v8.5

Le Capo di Leuca utilise le moteur canvas des niveaux 3–4 : déplacement libre, dix croix anonymes, énigmes dans les quatre langues, énergie, ennemis, musique et collecte. Une découverte révèle une goutte et le nom du lieu. Les positions du sud sont adaptées au dessin et espacées ; ce ne sont pas des coordonnées GPS.

Dix communes distinctes : Castrignano del Capo (phare), Gagliano del Capo (Ciolo), Patù (Centopietre), Morciano di Leuca (Torre Vado), Salve (Pescoluse), Alessano (Palazzo Ducale), Tricase (Quercia Vallonea), Tiggiano (Palazzo Serafini-Sauli), Corsano (Vie del Sale), Ugento (musée archéologique).

Scirocco : moteur de bataille commun, rotation paysage, mouvements/saut/attaques, relance après défaite ; 300 PV, tirs toutes les 950–1550 ms, dégâts 18. Sprite provisoire existant conservé. Victoire : progression capo, découvertes puis carte Leaflet et passeport Santa Maria di Leuca. Les raccourcis chasse/bataille du niveau 5 ouvrent ces moteurs.

Décor : public/assets/battle_bg_leuca.png, créé avec le générateur intégré, référence https://www.lachiocciola-leuca.com/wp-content/uploads/2021/03/santa-maria-di-leuca-faro-1280x575.jpg ; style issu de battle_bg_acaya.png. Prompt : illustration 16:9 du port de Santa Maria di Leuca, phare blanc sur promontoire, digue courbe et port turquoise, ville blanche ; style peint cartoon ocre/teal des batailles existantes ; promenade plate libre sur les 20 % inférieurs ; sans personnages, texte ni interface.

Carte réelle centrée sur le phare 39.7959,18.36846, cercle 3 km. Référence https://mapcarta.com/29104140 . Comparaison du dessin avec la carte côtière https://www.salentoviaggi.it/public/editor/3_otranto-leuca.gif .

Validation : typecheck, build, 11 tests réussis dont les cinq chasses, raccourcis bataille, défaite/reprise, orientation et victoire dans quatre langues. Décor et démarrage vérifiés dans le navigateur. Pas de validation physique iPhone.
