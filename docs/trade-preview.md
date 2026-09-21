# Échanges de cartes — maquette isolée

Route `/trade-preview`, accessible depuis l’aperçu A10/A11. Inventaire entièrement fictif en mémoire, réinitialisé au rechargement. Aucun compte, réseau de transfert, lecture de sauvegarde ou écriture dans le passeport. La préférence de langue conserve son comportement habituel.

Parcours : Mes cartes → Mes doubles → offrir ou demander une carte → aperçu destinataire → accepter/refuser → résultat simulé. Un exemplaire souvenir est toujours conservé. Un échange accepté retire un double et ajoute une carte d’origine échange ; un refus ne change rien. Quatre langues, boutons tactiles et page défilante. Pas de faux QR ni de lien prétendument échangeable : leur transport reste à concevoir après le choix partage libre/registre minimal.

Les cartes « remise sur place » sont des exemples explicites, sans visite ni partenariat réel attribué. Recevoir une carte ne valide ni chasse, ni bataille, ni visite. Les futurs contrôles d’émission, de possession, de transfert atomique, anti-rejeu et de récupération d’appareil ne sont pas implémentés dans ce prototype.

Validation : parcours React en quatre langues, refus sans mutation, seuls les doubles transférables, conservation du souvenir, don et échange, état vide, réinitialisation et absence d’écriture de sauvegarde. Production et mini-jeux inchangés. Vérification visuelle/tactile sur iPhone à faire.
