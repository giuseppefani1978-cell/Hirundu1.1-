import { LANG } from '../../../i18n.js';

const translations = {
  fr: {level:'Niveau actuel',points:'Validations QR',done:'validé',next:'Prochain niveau',steps:'Progression virtuelle',completed:'Niveau gagné',available:'Disponible',locked:'À débloquer',visits:'Lieux réels',hint:'Une victoire virtuelle ne valide jamais une visite. Un QR de démonstration reste une validation de test.',validated:'Validé via QR',declared:'Visite déclarée — non vérifiée',pending:'Aucune validation réelle',consulted:'Carte consultée',scan:'Scanner un QR',tiers:['Découvreur','Connaisseur','Touriste','Touriste responsable','Passionné','Local','Salentino 100%']},
  it: {level:'Livello attuale',points:'Convalide QR',done:'convalidato',next:'Prossimo livello',steps:'Progressione virtuale',completed:'Livello vinto',available:'Disponibile',locked:'Da sbloccare',visits:'Luoghi reali',hint:'Una vittoria virtuale non convalida mai una visita. Un QR dimostrativo resta una convalida di test.',validated:'Convalidato tramite QR',declared:'Visita dichiarata — non verificata',pending:'Nessuna convalida reale',consulted:'Mappa consultata',scan:'Scansiona un QR',tiers:['Esploratore','Conoscitore','Turista','Turista responsabile','Appassionato','Locale','Salentino 100%']},
  en: {level:'Current level',points:'QR validations',done:'validated',next:'Next level',steps:'Virtual progress',completed:'Level won',available:'Available',locked:'Locked',visits:'Real places',hint:'A virtual win never validates a visit. A demo QR remains a test validation.',validated:'Validated via QR',declared:'Visit declared — not verified',pending:'No real validation',consulted:'Map consulted',scan:'Scan a QR code',tiers:['Explorer','Connoisseur','Tourist','Responsible tourist','Enthusiast','Local','Salentino 100%']},
  es: {level:'Nivel actual',points:'Validaciones QR',done:'validado',next:'Próximo nivel',steps:'Progreso virtual',completed:'Nivel ganado',available:'Disponible',locked:'Por desbloquear',visits:'Lugares reales',hint:'Una victoria virtual nunca valida una visita. Un QR de demostración sigue siendo una validación de prueba.',validated:'Validado por QR',declared:'Visita declarada — no verificada',pending:'Sin validación real',consulted:'Mapa consultado',scan:'Escanear un QR',tiers:['Explorador','Conocedor','Turista','Turista responsable','Apasionado','Local','Salentino 100%']},
};

export const passportCopy = { ...(translations[LANG as keyof typeof translations] ?? translations.fr) };

function refreshPassportCopy() {
  Object.assign(passportCopy, translations[LANG as keyof typeof translations] ?? translations.fr);
}

if (typeof window !== 'undefined') {
  window.addEventListener('hirundu:language', refreshPassportCopy);
}
