export type InviteLanguage = "fr" | "it" | "en" | "es";
export type IssuedInvitation = {
  code: string;
  recipient: string;
  days: number;
  url: string;
};

export const LANGUAGES: { value: InviteLanguage; label: string }[] = [
  { value: "fr", label: "Français 🇫🇷" },
  { value: "it", label: "Italiano 🇮🇹" },
  { value: "en", label: "English 🇬🇧" },
  { value: "es", label: "Español 🇪🇸" }
];

const PUBLIC_BETA_URL = "https://play.myapuliatrip.com/";

export function createIssuedInvitation(code: string, recipient: string, days: number): IssuedInvitation {
  const normalized = code.toUpperCase();
  if (!/^[A-F0-9]{32}$/.test(normalized)) throw new Error("invalid_invite_response");
  if (!Number.isInteger(days) || days < 1 || days > 30) throw new Error("invalid_invite_duration");
  return {
    code: normalized,
    recipient: recipient.trim().slice(0, 80),
    days,
    // The code is in the fragment, not sent to Vercel as part of HTTP requests.
    url: PUBLIC_BETA_URL + "#beta=" + normalized
  };
}

export function invitationMessage(invite: IssuedInvitation, language: InviteLanguage): string {
  const name = invite.recipient;
  const d = invite.days;
  const url = invite.url;
  const code = invite.code;
  switch (language) {
    case "it":
      return `Ciao${name ? " " + name : ""}! 👋

Ti invito a provare in anteprima HIRUNDU, il gioco alla scoperta del Salento! 🕊️

🎮 Apri il gioco: ${url}

🔑 Il tuo codice personale: ${code}
⏳ Invito valido per ${d} giorni.

Apri il link sul telefono con cui vuoi giocare, scegli un nickname e attiva il tuo accesso. Il codice si attiva su un solo browser.

Durante il test puoi inviarci commenti e segnalazioni direttamente dal gioco. Grazie! 😊`;
    case "en":
      return `Hi${name ? " " + name : ""}! 👋

I'd like to invite you to try HIRUNDU, our game for discovering Salento! 🕊️

🎮 Open the game: ${url}

🔑 Your personal access code: ${code}
⏳ Invitation valid for ${d} days.

Open the link on the phone you'll use to play, choose a nickname and activate your access. The code can only be activated in one browser.

You can send feedback and bug reports directly from the game. Thank you! 😊`;
    case "es":
      return `¡Hola${name ? " " + name : ""}! 👋

¡Te invito a probar HIRUNDU, nuestro juego para descubrir Salento! 🕊️

🎮 Abre el juego: ${url}

🔑 Tu código personal: ${code}
⏳ Invitación válida durante ${d} días.

Abre el enlace en el móvil con el que jugarás, elige un apodo y activa tu acceso. El código solo puede activarse en un navegador.

Puedes enviarnos comentarios y avisos de errores directamente desde el juego. ¡Gracias! 😊`;
    default:
      return `Bonjour${name ? " " + name : ""} ! 👋

Je t'invite à découvrir en avant-première HIRUNDU, notre jeu pour explorer le Salento ! 🕊️

🎮 Accès à la bêta : ${url}

🔑 Ton code personnel : ${code}
⏳ Invitation valable ${d} jours.

Ouvre le lien sur le téléphone avec lequel tu veux jouer, choisis un pseudo et active ton accès. Le code ne peut être activé que sur un seul navigateur.

Pendant ton test, tu peux nous envoyer tes remarques et signaler les bugs directement dans le jeu. Merci ! 😊`;
  }
}

export function whatsappShareUrl(message: string): string {
  return "https://wa.me/?text=" + encodeURIComponent(message);
}
