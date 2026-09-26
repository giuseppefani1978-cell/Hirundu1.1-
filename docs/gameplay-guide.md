# HIRUNDU — règles de gameplay et base du futur tutoriel

Version de travail : branche d’améliorations, septembre 2026. Ce document décrit les règles à conserver et sert de référence pour écrire le guide joueur, les écrans d’aide et les tutoriels interactifs.

## 1. Principe général

HIRUNDU est une aventure mobile dans le Salento. Le joueur accompagne Aracne à travers neuf niveaux actuellement jouables. Chaque étape suit la même boucle :

1. entrer dans un territoire disponible ;
2. apprendre les commandes propres à sa famille de jeu ;
3. résoudre la chasse et découvrir dix lieux ;
4. affronter le boss du territoire ;
5. gagner le niveau, révéler sa carte culturelle et débloquer l’étape suivante ;
6. consulter ou rejouer librement les découvertes acquises.

La progression virtuelle, la collection de cartes et le passeport de visites réelles sont trois systèmes liés mais distincts. Une victoire n’atteste jamais une visite réelle. Posséder une carte n’atteste jamais une visite réelle.

## 2. Parcours et familles de jeu

| Niveaux | Famille | Commande principale | Objectif de chasse |
|---|---|---|---|
| 1, 2 et 9 | Classique | pavé directionnel | déplacer Aracne jusqu’au lieu correspondant à l’énigme |
| 3, 5 et 7 | Chasse à rebonds | barre, glissement et bouton Envol | faire rebondir Aracne, casser les murs et atteindre le bon lieu |
| 4, 6 et 8 | Vol | pavé directionnel maintenu | piloter Aracne pendant que le décor défile automatiquement |

Le parcours affiche les neuf étapes. Un niveau gagné reste rejouable. La reprise choisit le premier niveau disponible non terminé, y compris avec une ancienne sauvegarde non contiguë. Les territoires encore verrouillés restent secrets.

## 3. Règles communes aux chasses

- Lire l’énigme de Tarantula avant de choisir une cible.
- Atteindre la bonne cible pour enregistrer la découverte et poursuivre.
- Une mauvaise cible ne doit pas être validée comme découverte.
- Les ennemis et obstacles retirent de l’énergie selon les règles du moteur concerné.
- Les bonus alimentaires restaurent de l’énergie, protègent temporairement ou aident la progression selon le niveau.
- La chasse est terminée après dix découvertes ; la bataille du territoire s’ouvre alors.
- Pause, changement d’onglet, perte de focus et rotation doivent suspendre proprement les commandes pour éviter un mouvement bloqué.
- A09 a été retirée : aucun avertissement artificiel avant les ennemis, aucun bouton d’avance facultatif et aucune modification du rythme original ne doivent être réintroduits.

## 4. Tutoriel interactif A08

Le tutoriel doit faire agir, pas seulement faire lire.

### Classique

1. maintenir une flèche pour déplacer Aracne ;
2. lire l’indice ;
3. rejoindre la cible demandée ;
4. confirmer la réussite sans modifier la vraie progression.

### Chasse à rebonds

1. déplacer la barre avec les flèches ou en glissant le doigt ;
2. appuyer sur Envol pour lancer Aracne ;
3. réussir un rebond réel sur la barre ;
4. atteindre la cible demandée ;
5. autoriser un nouvel essai après une chute.

La barre est indispensable : Aracne doit rebondir dessus. Les bords de la barre orientent le rebond. Sa taille, ses collisions et sa physique approuvées ne doivent pas être remplacées par une commande générique.

### Vol

1. maintenir les flèches pour piloter Aracne ;
2. comprendre que le fond défile automatiquement ; toucher la carte ne déplace pas Aracne ;
3. éviter un obstacle ;
4. rejoindre la cible indiquée.

Le tutoriel peut être passé, revu depuis l’interface et mémorisé par famille. Il ne donne ni victoire, ni score, ni visite, ni carte.

## 5. Batailles

La bataille suit la chasse et conserve les moteurs déjà développés. Elle se joue en paysage lorsque l’interface le demande. Les commandes existantes — déplacement, saut, plongée, esquive, attaque et attaque spéciale selon le boss — restent celles du niveau ; il n’existe pas de commande de bataille générique qui remplace les capacités actuelles.

Une défaite permet de reprendre selon le flux du niveau. Une victoire enregistre le niveau gagné, ouvre l’étape suivante et présente la découverte culturelle. Les provisions transmises par les niveaux de vol sont conservées par le passage vers la bataille conformément au moteur actuel.

## 6. Orientation et mobile

- Les chasses restent dans l’orientation prévue par leur moteur.
- Les batailles utilisent le paysage lorsque demandé.
- Le jeu affiche une consigne de rotation sans effacer la progression en cours.
- Les zones tactiles doivent rester atteignables sur iPhone, y compris avec les encoches et les zones sûres.
- Le fond des niveaux de vol défile tout seul ; le joueur contrôle Aracne, pas le décor.
- Le niveau 8 conserve son défilement long sans miroir ni couture visible et ses obstacles au premier plan.

## 7. Audio et retours d’action A07

Les retours visuels et sonores signalent une collecte, une découverte, un dégât et une chasse terminée. Ils ne modifient ni collision, ni score, ni difficulté. Le son peut nécessiter une première interaction sur iPhone. Le test sonore des réglages permet de vérifier que le navigateur a autorisé l’audio.

Lorsque la musique ou les sons d’action sont coupés, le jeu respecte ce choix. En cas d’échec audio, un message explicite invite à retester ; l’action de jeu continue. Le niveau 3 doit suivre les mêmes règles de déverrouillage audio que les autres niveaux.

## 8. Décor A06 et accessibilité A13

Les animations de décor sont subtiles et décoratives. Elles ne changent pas les coordonnées, les obstacles ou la lisibilité. Le réglage « Réduire les animations » et la préférence système de mouvement réduit désactivent ou limitent ces effets, sans arrêter les mouvements indispensables au jeu : pilotage, rebond et défilement de la chasse.

Les réglages disponibles sont : musique, sons des actions, effets de découverte, réduction des animations décoratives et texte agrandi dans les menus. Ils s’appliquent sans transformer les règles des mini-jeux.

## 9. Découvertes et cartes A10–A11

Chaque territoire terminé révèle une carte culturelle avec :

- le lieu et son territoire ;
- une illustration ;
- une anecdote courte et sourcée ;
- un accès à la carte réelle du territoire ;
- une inscription dans la collection virtuelle.

La collection comprend neuf cartes de territoire. Les cartes verrouillées ne dévoilent ni l’image ni le nom du monument. Consulter une carte ne crée aucune récompense et ne valide aucune visite.

## 10. Provenance des cartes et quantité

Chaque exemplaire porte une provenance visible :

| Provenance | Ajoute une carte | Peut créer un double échangeable | Valide une visite réelle |
|---|---:|---:|---:|
| Découverte gagnée dans le jeu | oui | l’exemplaire souvenir reste protégé | non |
| QR partenaire autorisé sur place | oui | oui si la collection contient un double | oui, pour le lieu exact du QR |
| Carte physique d’un salon ou événement | oui | oui si la collection contient un double | non |
| Carte reçue par échange | oui | oui si elle devient un double | non |
| Bouton de test | oui | oui | non |
| Restauration d’une sauvegarde | restaure la collection autorisée | selon l’inventaire restauré | ne crée jamais une nouvelle validation réelle |

Règle centrale : **carte possédée ≠ lieu visité**. Seul un code partenaire émis pour un lieu précis et reconnu comme officiel peut écrire une validation QR dans le passeport.

## 11. QR partenaires et cartes physiques

Le lecteur HIRUNDU reconnaît trois familles de codes :

1. **QR partenaire** : ajoute la carte prévue et, si le code figure dans le registre officiel, valide uniquement le lieu associé ;
2. **QR de carte physique** : ajoute la carte promotionnelle, sans toucher au passeport ;
3. **QR d’échange** : transporte une offre ou son reçu entre deux téléphones, sans toucher au passeport.

La branche de test contient deux codes de démonstration autorisés : un parcours partenaire Otranto et une carte physique Lecce. Avant une ouverture publique, les codes partenaires devront être générés par un service contrôlé, signés, révocables et suivis contre la copie. Le prototype local ne doit pas être présenté comme une protection antifraude mondiale.

## 12. Échange direct entre deux joueurs

L’échange ne demande ni compte ni base de données dans le prototype.

1. L’expéditeur possède au moins deux exemplaires d’une carte.
2. Il crée un QR d’offre, valable quinze minutes.
3. Le destinataire scanne l’offre et confirme la réception.
4. Son téléphone ajoute un exemplaire provenant d’un échange et affiche un QR reçu.
5. L’expéditeur scanne ce reçu ; son double est alors retiré.

La carte souvenir gagnée dans le jeu n’est jamais supprimée. Une même offre ne peut pas être acceptée deux fois sur le même appareil. Un échange ne débloque aucun niveau et ne valide aucune visite. Sans serveur, le système ne peut pas empêcher toutes les copies ou réutilisations entre appareils réinitialisés ; cette limite doit rester visible tant qu’un registre sécurisé n’existe pas.

## 13. Passeport réel

Le passeport distingue :

- progression virtuelle des niveaux ;
- visites déclarées, non vérifiées ;
- validations obtenues par QR autorisé ;
- cartes possédées dans la collection.

La victoire, la carte culturelle, la carte physique, le QR d’échange, la consultation d’une carte et une restauration ne peuvent pas se transformer en validation réelle. Une validation partenaire vise un identifiant de lieu appartenant au territoire concerné ; les identifiants étrangers sont ignorés.

## 14. Sauvegarde, export et restauration A14

La progression est locale au navigateur et à l’adresse du site. Elle n’est pas automatiquement synchronisée entre téléphones. Le joueur peut télécharger un fichier de sauvegarde et le restaurer sur la branche qui prend en charge l’import.

La restauration doit vérifier le format avant toute écriture, préserver l’état existant si le fichier est invalide et ne jamais importer de nouvelles validations du passeport réel. Le pseudo, les scores, les niveaux, les réglages et les éléments virtuels autorisés peuvent être restaurés selon le format de sauvegarde. Une bataille ou une position exacte interrompue n’est pas reprise image par image.

## 15. Rejeu et objectifs A12

Un niveau terminé peut être rejoué. Les objectifs de rejeu s’appuient sur les scores réellement conservés ; ils ne doivent pas inventer un record. Rejouer ne retire ni carte, ni victoire, ni visite. Une nouvelle récompense n’est accordée que si la règle du système concerné le prévoit explicitement.

## 16. Langues

Les interfaces et tutoriels existent en français, italien, anglais et espagnol. Changer de langue ne recharge pas la chasse et ne remet pas le niveau à zéro. Les noms propres, les anecdotes et les messages de sécurité doivent rester cohérents dans les quatre langues.

## 17. Découpage conseillé du futur tutoriel

Le guide joueur peut être présenté en six écrans courts :

1. **Ton voyage** — neuf territoires, trois familles de jeu ;
2. **Apprendre en jouant** — exercice interactif adapté à la famille ;
3. **Chasse puis bataille** — dix découvertes, boss et victoire ;
4. **Tes cartes** — révélation culturelle, provenance et doubles ;
5. **Le monde réel** — QR partenaire, carte physique et passeport distinct ;
6. **Échanger** — offre, confirmation par reçu, limites du prototype.

Chaque écran doit proposer « Continuer », « Passer » et « Revoir plus tard ». Les exercices ne doivent jamais écrire dans la vraie progression. Les règles de sécurité — notamment la différence entre carte et visite — doivent apparaître au moment de l’action, pas uniquement dans une page juridique séparée.

## 18. Checklist avant fusion vers la version stable

- vérifier les trois familles sur un iPhone réel ;
- vérifier l’audio du niveau 3 après une interaction ;
- scanner les deux QR terrain de test avec un second téléphone ;
- confirmer qu’un QR physique ne modifie pas le passeport ;
- confirmer qu’un QR partenaire ne valide que son lieu ;
- terminer un échange aller-retour et tester l’expiration ;
- exporter puis restaurer une sauvegarde sans créer de visite réelle ;
- contrôler les quatre langues et le mouvement réduit ;
- exécuter la suite automatisée complète ;
- ne fusionner qu’après validation explicite de la branche de test.
