/**
 * i18n.js - Internationalisation module for TetriNET
 *
 * Detects the browser language and defaults to English.
 * Provides:
 *   - t(key, params)   → returns translated string with optional {param} interpolation
 *   - applyTranslations() → sets all DOM elements with data-i18n* attributes
 */
const I18N = (() => {
  const LANGS = {
    en: typeof LANG_EN !== 'undefined' ? LANG_EN : {},
    fr: typeof LANG_FR !== 'undefined' ? LANG_FR : {},
  };

  // Detect browser language; default to 'en'
  const browserLang = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
  const currentLang = LANGS[browserLang] ? browserLang : 'en';
  const strings = LANGS[currentLang] || LANGS.en;

  /**
   * Translate a key, with optional parameter interpolation.
   * Usage: t('playerJoinedRoom', { name: 'Alice' }) → "Alice joined the room"
   */
  function t(key, params) {
    let str = strings[key] !== undefined ? strings[key] : (LANGS.en[key] !== undefined ? LANGS.en[key] : key);
    if (params) {
      Object.keys(params).forEach(p => {
        str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
      });
    }
    return str;
  }

  /**
   * Walk the DOM and apply translations based on data-i18n attributes:
   *   data-i18n="key"              → sets textContent
   *   data-i18n-placeholder="key"  → sets placeholder
   *   data-i18n-title="key"        → sets title attribute
   *   data-i18n-html="key"         → sets innerHTML (use sparingly)
   */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
  }

  return { t, applyTranslations, currentLang };
})();
