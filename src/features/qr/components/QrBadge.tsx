import type { ReactNode } from "react";
import "./QrBadge.css";

type QrBadgeTone = "info" | "success" | "warning" | "danger" | "neutral";

export interface QrBadgeProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  tone?: QrBadgeTone;
  actionLabel?: string;
  onAction?: () => void;
}

export default function QrBadge({
  icon = "🔖",
  title,
  subtitle,
  meta,
  tone = "neutral",
  actionLabel,
  onAction,
}: QrBadgeProps) {
  return (
    <article className={`qr-badge qr-badge--${tone}`}>
      <div className="qr-badge__icon" aria-hidden>
        {icon}
      </div>
      <div className="qr-badge__content">
        <h4 className="qr-badge__title">{title}</h4>
        {subtitle ? <p className="qr-badge__subtitle">{subtitle}</p> : null}
        {meta ? <p className="qr-badge__meta">{meta}</p> : null}
      </div>
      {onAction && actionLabel ? (
        <button type="button" className="qr-badge__action app-button app-button--ghost" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
