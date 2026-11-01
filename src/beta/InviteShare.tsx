import type { InviteLanguage, IssuedInvitation } from "./invitationText";
import { LANGUAGES, whatsappShareUrl } from "./invitationText";

type Props = {
  issued: IssuedInvitation;
  language: InviteLanguage;
  shareText: string;
  shareStatus: string;
  copyInvite: (value: string, kind: string) => void;
};

export default function InviteShare({ issued, language, shareText, shareStatus, copyInvite }: Props) {
  return <section className="hb-invitelink hb-invite-result" aria-live="polite">
    <h3>✓ Invitation créée !</h3>
    <p>Envoie cette invitation maintenant : le code complet ne sera plus visible après fermeture de la page.</p>
    <label>Code personnel</label>
    <div className="hb-invite-copy-row">
      <input readOnly aria-label="Code personnel" value={issued.code} onFocus={e=>e.currentTarget.select()}/>
      <button type="button" onClick={()=>copyInvite(issued.code,"Code")}>Copier</button>
    </div>
    <label>Lien du jeu</label>
    <div className="hb-invite-copy-row">
      <input readOnly aria-label="Lien du jeu" value={issued.url} onFocus={e=>e.currentTarget.select()}/>
      <button type="button" onClick={()=>copyInvite(issued.url,"Lien")}>Copier</button>
    </div>
    <label>Message prêt à envoyer · {LANGUAGES.find(l=>l.value===language)?.label}</label>
    <textarea className="hb-message-preview" readOnly aria-label="Message WhatsApp" value={shareText} onFocus={e=>e.currentTarget.select()}/>
    <div className="hb-invite-actions">
      <a className="hb-whatsapp-button" href={whatsappShareUrl(shareText)} target="_blank" rel="noopener noreferrer">Envoyer par WhatsApp ↗</a>
      <button type="button" onClick={()=>copyInvite(shareText,"Message")}>Copier le message</button>
    </div>
    <p className="hb-share-status" role="status">{shareStatus}</p>
    <p className="hb-small">WhatsApp prépare le message. Sélectionne le destinataire et confirme l&apos;envoi. Chaque code est personnel.</p>
  </section>;
}
