/* ======= Topbar style “Module QR” ======= */
.bonus-index__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.bonus-index__backqr {
  font-weight: 700;
}

/* ======= Lisibilité header ======= */
.bonus-index__lead,
.bonus-index__intro {
  color: #0f172a !important;          /* slate-900 */
  font-weight: 600;
  line-height: 1.45;
  opacity: 1 !important;
  text-shadow: 0 1px 0 rgba(255,255,255,0.8);
}

/* ======= Résumé (KPIs) ======= */
.bonus-index__summary {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e3a8a;            /* indigo-800 */
  background: #eef2ff;       /* indigo-50 */
  border: 1px solid #c7d2fe; /* indigo-200 */
  border-radius: 12px;
  padding: 10px 14px;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.bonus-index__summary-badge {
  background: #e0e7ff;       /* indigo-100 */
  padding: 2px 8px;
  border-radius: 999px;
}

.bonus-index__summary-count {
  font-weight: 800;
  color: #1e3a8a;
}

.bonus-index__summary-divider {
  color: #1e3a8a;
  opacity: 0.6;
}

.bonus-index__summary-next {
  background: #ecfeff;   /* cyan-50 */
  color: #0e7490;        /* cyan-700 */
  border: 1px solid #a5f3fc;
  border-radius: 8px;
  padding: 4px 8px;
  font-weight: 700;
}

/* ======= Mobile tweaks ======= */
@media (max-width: 480px) {
  .bonus-index__topbar {
    flex-direction: column;
    align-items: stretch;
  }
  .bonus-index__lead,
  .bonus-index__intro {
    font-size: 15px;
  }
  .bonus-index__summary {
    font-size: 14px;
    padding: 8px 10px;
  }
}
