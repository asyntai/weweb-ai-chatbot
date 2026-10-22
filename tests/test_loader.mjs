// Tests for src/loader.js. Run with: node tests/test_loader.mjs
//
// package.json has no "type": "module" (the WeWeb CLI expects that), so the
// loader is imported from its source text as a data: URL.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/loader.js', import.meta.url), 'utf8');
const L = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('ok   ' + name);
  } catch (e) {
    console.log('FAIL ' + name);
    throw e;
  }
}

// A small stand-in for a DOM document: enough for loadWidget.
function fakeDocument() {
  const head = { children: [], appendChild(el) { this.children.push(el); return el; } };
  return {
    head,
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        attrs: {},
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) { return this.attrs[k]; },
      };
    },
    querySelector(sel) {
      if (sel !== 'script[data-asyntai-id]') throw new Error('unexpected selector ' + sel);
      return head.children.find((el) => el.tagName === 'SCRIPT' && 'data-asyntai-id' in el.attrs) || null;
    },
  };
}

test('widget ID: empty, spaces and non-strings are missing', () => {
  for (const v of ['', '   ', undefined, null, 42, {}]) {
    assert.equal(L.normalizeWidgetId(v).error, 'missing');
  }
});

test('widget ID: wrong shapes are invalid', () => {
  for (const v of ['1a2b3c', 'asyntai_', 'asyntai-123', 'asyntai_12 34', 'ASYNTAI_abc', 'asyntai_ab"c']) {
    const r = L.normalizeWidgetId(v);
    assert.equal(r.error, 'invalid', v);
  }
});

test('widget ID: a real ID is trimmed and accepted', () => {
  assert.deepEqual(L.normalizeWidgetId('  asyntai_1a2b3c4d5e6f '), { widgetId: 'asyntai_1a2b3c4d5e6f', error: null });
});

test('script URL: empty or unsafe falls back to the default', () => {
  for (const v of ['', '  ', undefined, 'javascript:alert(1)', '//evil.example/x.js', 'https://a b.js', 'https://x"y.js']) {
    assert.equal(L.normalizeScriptUrl(v), L.DEFAULT_SCRIPT_URL, String(v));
  }
});

test('script URL: http and https URLs are kept', () => {
  assert.equal(L.normalizeScriptUrl(' https://cdn.example.com/w.js '), 'https://cdn.example.com/w.js');
  assert.equal(L.normalizeScriptUrl('http://127.0.0.1:8000/static/js/chat-widget.js'), 'http://127.0.0.1:8000/static/js/chat-widget.js');
});

test('default script is the production widget', () => {
  assert.equal(L.DEFAULT_SCRIPT_URL, 'https://widget.asyntai.com/static/js/chat-widget.js');
});

test('user context: objects pass, empties and junk give null', () => {
  assert.deepEqual(L.normalizeUserContext({ name: 'Jane' }), { name: 'Jane' });
  assert.deepEqual(L.normalizeUserContext('{"plan":"Pro"}'), { plan: 'Pro' });
  for (const v of [null, undefined, '', '{}', {}, '[1,2]', [1], 'not json', 7, true]) {
    assert.equal(L.normalizeUserContext(v), null, JSON.stringify(v));
  }
});

test('applyUserContext sets, replaces and clears without touching other keys', () => {
  const win = { Asyntai: { openChat: 'keep-me', accessTags: 'keep-too' } };
  L.applyUserContext(win, { name: 'Jane' });
  assert.deepEqual(win.Asyntai.userContext, { name: 'Jane' });
  L.applyUserContext(win, '{"name":"Bob"}');
  assert.deepEqual(win.Asyntai.userContext, { name: 'Bob' });
  L.applyUserContext(win, '');
  assert.equal('userContext' in win.Asyntai, false);
  assert.equal(win.Asyntai.openChat, 'keep-me');
  assert.equal(win.Asyntai.accessTags, 'keep-too');
});

test('applyUserContext creates window.Asyntai when it is missing', () => {
  const win = {};
  L.applyUserContext(win, { id: 1 });
  assert.deepEqual(win.Asyntai, { userContext: { id: 1 } });
  L.applyUserContext(null, { id: 1 }); // no crash
});

test('loadWidget adds one script with the ID and async', () => {
  const doc = fakeDocument();
  assert.equal(L.loadWidget(doc, 'asyntai_abc123', ''), 'added');
  assert.equal(doc.head.children.length, 1);
  const s = doc.head.children[0];
  assert.equal(s.src, L.DEFAULT_SCRIPT_URL);
  assert.equal(s.async, true);
  assert.equal(s.getAttribute('data-asyntai-id'), 'asyntai_abc123');
});

test('loadWidget never adds a second script (SPA page changes remount the element)', () => {
  const doc = fakeDocument();
  L.loadWidget(doc, 'asyntai_abc123', '');
  assert.equal(L.loadWidget(doc, 'asyntai_abc123', ''), 'present');
  assert.equal(L.loadWidget(doc, 'asyntai_other', ''), 'present');
  assert.equal(doc.head.children.length, 1);
});

test('loadWidget uses a custom script URL', () => {
  const doc = fakeDocument();
  L.loadWidget(doc, 'asyntai_abc123', 'http://127.0.0.1:8000/static/js/chat-widget.js');
  assert.equal(doc.head.children[0].src, 'http://127.0.0.1:8000/static/js/chat-widget.js');
});

test('loadWidget skips when there is no document', () => {
  assert.equal(L.loadWidget(null, 'asyntai_abc123', ''), 'skipped');
  assert.equal(L.loadWidget({}, 'asyntai_abc123', ''), 'skipped');
});

function fakeWidgetWindow(initialized) {
  const calls = [];
  return {
    calls,
    AsyntaiWidget: {
      initialized,
      open() { calls.push('open'); },
      close() { calls.push('close'); },
    },
    Asyntai: { openChat(text) { calls.push('openChat:' + text); return true; } },
  };
}

test('openChat and closeChat return false until the widget is ready', () => {
  const win = fakeWidgetWindow(false);
  assert.equal(L.openChat(win, 'hi'), false);
  assert.equal(L.closeChat(win), false);
  assert.deepEqual(win.calls, []);
  assert.equal(L.openChat({}, ''), false);
  assert.equal(L.openChat(null, ''), false);
});

test('openChat without a message opens the widget', () => {
  const win = fakeWidgetWindow(true);
  assert.equal(L.openChat(win, ''), true);
  assert.equal(L.openChat(win, '   '), true);
  assert.equal(L.openChat(win, undefined), true);
  assert.deepEqual(win.calls, ['open', 'open', 'open']);
});

test('openChat with a message prefills through window.Asyntai.openChat', () => {
  const win = fakeWidgetWindow(true);
  assert.equal(L.openChat(win, '  Where is my order? '), true);
  assert.deepEqual(win.calls, ['openChat:Where is my order?']);
});

test('openChat with a message falls back to open() on an older widget', () => {
  const win = fakeWidgetWindow(true);
  delete win.Asyntai;
  assert.equal(L.openChat(win, 'hello'), true);
  assert.deepEqual(win.calls, ['open']);
});

test('closeChat closes a ready widget', () => {
  const win = fakeWidgetWindow(true);
  assert.equal(L.closeChat(win), true);
  assert.deepEqual(win.calls, ['close']);
});

console.log('\n' + passed + ' loader tests passed');
