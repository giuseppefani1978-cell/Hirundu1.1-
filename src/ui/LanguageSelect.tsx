import React from 'react';
import { LANG, setLang } from '../i18n.js';
import { copy } from './copy.js';
import './LanguageSelect.css';
export default function LanguageSelect() {
  return <label className="language-select">{copy.language}
    <select value={LANG} onChange={(e) => setLang(e.target.value)}>
      <option value="fr">Français</option><option value="it">Italiano</option>
      <option value="en">English</option><option value="es">Español</option>
    </select>
  </label>;
}
