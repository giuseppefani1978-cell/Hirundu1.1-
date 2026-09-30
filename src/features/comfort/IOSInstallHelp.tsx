import React from 'react';
import { LANG } from '../../i18n.js';

const labels = {
  fr: { title: 'Installer HIRUNDU', help: 'Dans Safari sur iPhone ou iPad, ouvre Partager, puis choisis « Ajouter à l’écran d’accueil ».' },
  it: { title: 'Installa HIRUNDU', help: 'In Safari su iPhone o iPad, apri Condividi, poi scegli « Aggiungi alla schermata Home ».' },
  en: { title: 'Install HIRUNDU', help: 'In Safari on iPhone or iPad, open Share, then choose “Add to Home Screen”.' },
  es: { title: 'Instalar HIRUNDU', help: 'En Safari en iPhone o iPad, abre Compartir y elige « Añadir a la pantalla de inicio ».' },
};

export default function IOSInstallHelp() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone;
  if (!isIOS || standalone) return null;
  const text = labels[LANG as keyof typeof labels] || labels.fr;
  return (
    <section className="ios-install-help" aria-labelledby="ios-install-title">
      <h2 id="ios-install-title">{text.title}</h2>
      <p>{text.help}</p>
    </section>
  );
}
