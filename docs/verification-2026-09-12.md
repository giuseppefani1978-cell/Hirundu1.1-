# HIRUNDU — vérifications du 12 septembre 2026

## Corrections
- Autorisation explicite du nom du serveur de prévisualisation dans Vite.
- Pseudo saisi dans l'écran de départ, sans fenêtre native bloquante.
- Traduction des libellés du HUD et du bouton Rejouer.
- État du bouton musique lié à l'état réel du contexte audio ; reprise après interruption en un clic.
- Un échec d'initialisation audio ne doit pas interrompre les effets de collecte.
- Annulation du démarrage différé d'une bataille lorsqu'on quitte son niveau ; suppression des écouteurs d'orientation associés.

## Vérifié
- `npm run typecheck` et `npm run build` passent.
- `npm test` : neuf tests passent.
- Démarrage des trois modules de chasse dans les quatre langues avec un DOM simulé.
- Anciens textes de transition ignorés au profit de la langue courante.
- Fin de bataille simulée dans le chargeur de test uniquement, puis clic sur le vrai bouton : un seul callback, progression enregistrée et route `/bonus/<lieu>`.
- Audio simulé : interruption/reprise, annulation d'un démarrage en attente, absence de support audio sans exception sur les effets.
- Navigateur réel : accueil et écran de départ de la chasse 1 ouverts ; mélange de libellés anglais/français constaté avant correction.

## Non validé
Le navigateur a cessé de répondre lors du clic sur Démarrer avant la suppression du prompt natif. Le mécanisme de dialogue et une tentative de nouvel onglet ont également expiré. La cause exacte de ce blocage du navigateur n'est pas établie.

Aucune partie complète, écoute réelle, fluidité mobile, reprise après suspension iOS ou couverture exhaustive des textes QR/dialogues n'est certifiée. Le DOM simulé ne remplace pas ces vérifications.

Ces corrections ne sont pas déployées. La PR reste en brouillon ; la version principale et sa sauvegarde sont préservées.
