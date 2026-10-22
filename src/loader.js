/**
 * Option handling and widget loading for the Asyntai AI Chatbot element.
 *
 * This file has no dependencies and never touches the global `window` or
 * `document` directly. The element passes in WeWeb's front window and front
 * document (in the Editor the app runs inside an iframe, so the globals of
 * this bundle are the wrong ones). That also lets the tests run it in Node
 * with a small fake document.
 */

export const DEFAULT_SCRIPT_URL = 'https://widget.asyntai.com/static/js/chat-widget.js';

const WIDGET_ID_PATTERN = /^asyntai_[A-Za-z0-9]+$/;

/** Trims the widget ID and checks its shape. */
export function normalizeWidgetId(value) {
  const widgetId = typeof value === 'string' ? value.trim() : '';
  if (!widgetId) {
    return { widgetId: '', error: 'missing' };
  }
  if (!WIDGET_ID_PATTERN.test(widgetId)) {
    return { widgetId, error: 'invalid' };
  }
  return { widgetId, error: null };
}

/** Uses the custom script address only when it is a real http(s) URL. */
export function normalizeScriptUrl(value) {
  const url = typeof value === 'string' ? value.trim() : '';
  if (/^https?:\/\/[^\s"'<>]+$/i.test(url)) {
    return url;
  }
  return DEFAULT_SCRIPT_URL;
}

/**
 * Accepts a bound object, or JSON typed into the text field.
 * Returns a plain object, or null when there is nothing usable.
 */
export function normalizeUserContext(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  let data = value;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return Object.keys(data).length ? data : null;
}

/**
 * Puts the user context where the widget reads it. The widget reads
 * `window.Asyntai.userContext` each time a visitor sends a message, so a
 * change here is used from the next message on. Other keys on
 * `window.Asyntai` (openChat, accessTags, ...) are kept.
 */
export function applyUserContext(win, value) {
  if (!win) return;
  const context = normalizeUserContext(value);
  win.Asyntai = win.Asyntai || {};
  if (context) {
    win.Asyntai.userContext = context;
  } else if ('userContext' in win.Asyntai) {
    delete win.Asyntai.userContext;
  }
}

/** True when an Asyntai widget script is already on the page. */
export function widgetScriptPresent(doc) {
  return !!(doc && doc.querySelector('script[data-asyntai-id]'));
}

/**
 * Adds the widget script once per page. WeWeb is a single-page app: the
 * element mounts again on every page change, and the widget must not load
 * twice. Returns 'added', 'present' or 'skipped'.
 */
export function loadWidget(doc, widgetId, scriptUrl) {
  if (!doc || !doc.head) return 'skipped';
  if (widgetScriptPresent(doc)) return 'present';
  const script = doc.createElement('script');
  script.src = normalizeScriptUrl(scriptUrl);
  script.async = true;
  script.setAttribute('data-asyntai-id', widgetId);
  doc.head.appendChild(script);
  return 'added';
}

/** True when the widget has finished its setup. */
export function widgetReady(win) {
  return !!(win && win.AsyntaiWidget && win.AsyntaiWidget.initialized);
}

/**
 * Opens the chat. With a message, it is put in the input box (the visitor
 * still presses send). Returns false when the widget is not ready yet.
 */
export function openChat(win, message) {
  if (!widgetReady(win)) return false;
  const text = typeof message === 'string' ? message.trim() : '';
  if (text && win.Asyntai && typeof win.Asyntai.openChat === 'function') {
    return win.Asyntai.openChat(text) !== false;
  }
  win.AsyntaiWidget.open();
  return true;
}

/** Closes the chat. Returns false when the widget is not ready yet. */
export function closeChat(win) {
  if (!widgetReady(win)) return false;
  win.AsyntaiWidget.close();
  return true;
}
