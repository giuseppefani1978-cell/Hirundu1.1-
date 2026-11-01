import React, { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, createIssuedInvitation, invitationMessage, whatsappShareUrl, type InviteLanguage, type IssuedInvitation } from "./invitationText";
import { activateBeta, betaConfigured, betaRpc, betaSession, type BetaDashboard, type BetaSession } from "./betaApi";
import "./betaPortal.css";

function errorText(error: unknown): string {
  const key = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    invalid_code: "Code ou pseudo invalide.", used_code: "Code déjà activé sur un autre appareil.",
    expired_code: "Invitation expirée.", revoked_code: "Invitation révoquée.",
    beta_required: "Accès personnel nécessaire.", denied: "Accès refusé.",
    secure_storage_unavailable: "Ce navigateur ne permet pas de conserver l'accès bêta.",
    secure_crypto_unavailable: "Ce navigateur n'offre pas les fonctions de sécurité requises.",
    beta_backend_not_configured: "La bêta sécurisée n'est pas encore configurée.",
    beta_denied: "Accès non autorisé."
  };
  return messages[key] || "Connexion impossible. Réessayez plus tard.";
}

function Gate({ onLogin, adminOnly }: { onLogin: (s: BetaSession) => void; adminOnly: boolean }) {
  const invite = useMemo(() => {
    const args = new URLSearchParams(location.hash.slice(1));
    const code = args.get("beta") || "";
    if (code) history.replaceState(null, "", location.pathname + location.search);
    return code.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 32);
  }, []);
  const [code, setCode] = useState(invite);
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const session = await activateBeta(code, nickname);
      if (adminOnly && !session.admin) { setMessage("Cet accès ne permet pas d'administrer Hirundu."); return; }
      onLogin(session);
    } catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }
  return <main className="hb-portal"><section className="hb-card hb-login">
    <span className="hb-mark">HIRUNDU <small>ACCÈS BÊTA PRIVÉ</small></span>
    <h1>{adminOnly ? "Administration bêta" : "Bienvenue dans la bêta."}</h1>
    <p>Tu as reçu une invitation personnelle ? Active-la sur cet appareil pour accéder au jeu.</p>
    {!betaConfigured && <p role="alert" className="hb-error">Préproduction non configurée : aucun accès ne peut être activé pour l&apos;instant.</p>}
    <form onSubmit={submit} className="hb-fields">
      <label>Pseudo de test<input required maxLength={60} autoComplete="nickname" value={nickname} onChange={e=>setNickname(e.target.value)} /></label>
      <label>Code reçu<input required autoComplete="off" spellCheck={false} maxLength={39} value={code.replace(/(.{8})(?=.)/g,"$1-")} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,"").slice(0,32))} placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"/></label>
      <button type="submit" disabled={!betaConfigured || busy}>{busy ? "Vérification…" : "Activer mon accès"}</button>
    </form>
    <p className="hb-error" role="alert">{message}</p>
    <p className="hb-small">Un code est personnel et ne peut être activé que sur un seul navigateur. Ne communique pas ton lien d&apos;invitation.</p>
  </section></main>;
}

function Admin({ nickname }: { nickname: string }) {
  const [dashboard, setDashboard] = useState<BetaDashboard | null>(null);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(14);
  const [issued, setIssued] = useState<IssuedInvitation | null>(null);
  const [recipient, setRecipient] = useState("");
  const [language, setLanguage] = useState<InviteLanguage>("fr");
  const [shareStatus, setShareStatus] = useState("");
  const shareRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function reload() {
    const result = await betaRpc("dashboard");
    setDashboard(result as BetaDashboard);
  }
  useEffect(() => { reload().catch(e => setError(errorText(e))); }, []);
  async function invite(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setIssued(null); setShareStatus("");
    try {
      const result = await betaRpc("admin_create_invite", {label: label.trim(), days});
      setIssued(createIssuedInvitation(String(result.code), recipient, days));
      setLabel("");
      await reload().catch(() => {});
      requestAnimationFrame(() => shareRef.current?.scrollIntoView({behavior:"smooth",block:"start"}));
    } catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  const shareText = issued ? invitationMessage(issued, language) : "";
  async function copyInvite(value: string, kind: string) {
    try {
      await navigator.clipboard.writeText(value);
      setShareStatus(kind + " copié !");
    } catch {
      setShareStatus("Copie automatique indisponible. Appuie longuement sur le texte pour le sélectionner.");
    }
  }
  async function revoke(id: string) {
    if (!confirm("Révoquer cet accès Hirundu ?")) return;
    setError(""); try { await betaRpc("admin_revoke_invite",{id}); await reload(); } catch(e){setError(errorText(e));}
  }
  async function updateFeedback(id: string, status: string) {
    setError(""); try { await betaRpc("admin_feedback_status",{id,status}); await reload(); } catch(e){setError(errorText(e));}
  }
  const testers = dashboard?.testers || [];
  const feedback = dashboard?.feedback || [];
  return <main className="hb-portal hb-admin">
    <header className="hb-top"><span className="hb-mark">HIRUNDU <small>ADMINISTRATION BÊTA</small></span><span>Administrateur : {nickname}</span></header>
    <h1>Testeurs et retours</h1><p>Accès attribués exclusivement par l&apos;administrateur. Les cartes et les voyages Aracne ne sont pas gérés ici.</p>
    <div className="hb-stats"><section><b>{testers.length}</b><small>Invitations</small></section><section><b>{testers.filter(x=>!!x.activated_at&&!x.revoked_at).length}</b><small>Actives</small></section><section><b>{testers.filter(x=>!x.activated_at&&!x.revoked_at).length}</b><small>En attente</small></section><section><b>{feedback.length}</b><small>Retours</small></section></div>
    <section className="hb-card"><h2>Créer une invitation</h2>
      <form className="hb-invite-form" onSubmit={invite}>
        <label>Référence interne<input required maxLength={80} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Testeur Android 01"/></label>
        <label>Prénom (facultatif)<input maxLength={80} value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Marco"/></label>
        <label>Langue<select value={language} onChange={e=>setLanguage(e.target.value as InviteLanguage)}>{LANGUAGES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select></label>
        <label>Durée<select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 jours</option><option value={14}>14 jours</option><option value={30}>30 jours</option></select></label>
        <button type="submit" disabled={busy}>{busy ? "Création…" : "Créer invitation"}</button>
      </form>
      {issued && <p>Invitation créée</p>}
      {error && <p role="alert" className="hb-error">{error}</p>}
    </section>
    <section className="hb-card"><div className="hb-inline"><h2>Accès</h2><button type="button" onClick={()=>reload().catch(e=>setError(errorText(e)))}>Actualiser</button></div>
      <div className="hb-scroll"><table><thead><tr><th>Testeur</th><th>Code</th><th>État</th><th>Créé</th><th>Action</th></tr></thead><tbody>{testers.map(t=><tr key={t.id}>
      <td>{t.nickname || "—"}</td><td>••••{t.suffix}</td><td>{t.revoked_at?"Révoqué":t.activated_at?"Activé":new Date(t.expires_at).getTime()<Date.now()?"Expiré":"En attente"}</td><td>{new Date(t.created_at).toLocaleDateString()}</td><td><button type="button" disabled={!!t.revoked_at} onClick={()=>revoke(t.id)}>Révoquer</button></td>
      </tr>)}</tbody></table></div>
    </section>
    <section className="hb-card"><h2>Retours bêta</h2><div className="hb-scroll"><table><thead><tr><th>Testeur</th><th>Niveau</th><th>Catégorie</th><th>Message</th><th>Statut</th></tr></thead><tbody>{feedback.map(f=><tr key={f.id}><td>{f.nickname||"—"}</td><td>{f.level||"—"}</td><td>{f.category}</td><td>{f.message}</td><td><select value={f.status} onChange={e=>updateFeedback(f.id,e.target.value)}><option value="new">Nouveau</option><option value="progress">En cours</option><option value="resolved">Résolu</option></select></td></tr>)}</tbody></table></div></section>
    <section className="hb-card"><h2>Partenaires</h2><p>Module commercial réservé à une version ultérieure. Aucune action active pendant la bêta.</p></section>
    <p className="hb-small"><a href="/">Retour au jeu</a> · Les droits administrateur sont vérifiés par le serveur, pas par cette interface.</p>
  </main>;
}

export default function BetaPortal() {
  const adminOnly = new URLSearchParams(location.search).has("admin") || /^\/admin\/?$/.test(location.pathname);
  const [session, setSession] = useState<BetaSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(()=>{ betaSession().then(s=>setSession(s)).catch(()=>setSession(null)).finally(()=>setReady(true)); },[]);
  if(!ready) return <main className="hb-portal"><p>Vérification de l&apos;accès Hirundu…</p></main>;
  if(!session || (adminOnly&&!session.admin)) return <Gate onLogin={setSession} adminOnly={adminOnly}/>;
  if(adminOnly) return <Admin nickname={session.nickname}/>;
  return <AuthorizedGameShell />;
}

const AuthorizedGame = React.lazy(()=>import("./BetaGame"));
function AuthorizedGameShell(){return <React.Suspense fallback={<main className="hb-portal">Chargement du jeu…</main>}><AuthorizedGame/></React.Suspense>;}
