import { LANG } from '../../../i18n.js';
import messages from './messages.json';
export function bt(source: string): string {
  const entry = messages[source as keyof typeof messages];
  return entry?.[LANG as 'fr'|'it'|'en'|'es'] ?? source;
}
export { LANG };
