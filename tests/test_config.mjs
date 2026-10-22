// Checks that ww-config.js and src/wwElement.vue agree with each other.
// Run with: node tests/test_config.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const configSource = readFileSync(new URL('../ww-config.js', import.meta.url), 'utf8');
const config = (await import('data:text/javascript;base64,' + Buffer.from(configSource).toString('base64'))).default;
const vue = readFileSync(new URL('../src/wwElement.vue', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

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

test('listing name carries the searched words', () => {
  assert.equal(config.editor.label.en, 'Asyntai AI Chatbot');
  assert.equal(pkg.name, 'weweb-ai-chatbot');
});

test('every content.X used in the element is defined in ww-config.js', () => {
  const used = new Set([...vue.matchAll(/content\.([A-Za-z]+)/g)].map((m) => m[1]));
  assert.ok(used.size >= 4, 'expected several content properties, got ' + [...used]);
  for (const key of used) {
    assert.ok(config.properties[key], 'content.' + key + ' has no property in ww-config.js');
  }
});

test('every property in ww-config.js is used by the element', () => {
  for (const key of Object.keys(config.properties)) {
    assert.ok(vue.includes('content.' + key), key + ' is defined but never read');
  }
});

test('every workflow action is a method of the element', () => {
  assert.deepEqual(config.actions.map((a) => a.action).sort(), ['closeChat', 'openChat']);
  for (const a of config.actions) {
    assert.ok(new RegExp('\\n        ' + a.action + '\\(').test(vue), a.action + ' method is missing');
  }
});

test('every trigger event is emitted by the element', () => {
  for (const ev of config.triggerEvents) {
    assert.ok(vue.includes("name: '" + ev.name + "'"), ev.name + ' is never emitted');
  }
});

test('widget ID is bindable and empty by default', () => {
  const p = config.properties.widgetId;
  assert.equal(p.bindable, true);
  assert.equal(p.defaultValue, '');
  assert.equal(p.type, 'Text');
});

test('the chat stays off in the Editor unless switched on', () => {
  assert.equal(config.properties.loadInEditor.defaultValue, false);
  assert.match(vue, /wwEditor:start \*\/\s*if \(!this\.content\.loadInEditor\) return false;\s*\/\* wwEditor:end/);
});

test('editor-only markup and code sit inside wwEditor blocks', () => {
  const template = vue.slice(0, vue.indexOf('</template>'));
  assert.match(template, /<!-- wwEditor:start -->[\s\S]*Paste your widget ID[\s\S]*<!-- wwEditor:end -->/);
  assert.match(vue, /created\(\) \{\s*\/\* wwEditor:start \*\/\s*this\.isEditor = true;\s*\/\* wwEditor:end \*\//);
});

test('the element only uses the front window and document', () => {
  const script = vue.slice(vue.indexOf('<script>'), vue.indexOf('</script>'));
  const bare = script
    .replace(/typeof wwLib !== 'undefined' \? wwLib\.getFrontWindow\(\) : window/, '')
    .replace(/typeof wwLib !== 'undefined' \? wwLib\.getFrontDocument\(\) : document/, '');
  assert.doesNotMatch(bare, /\bwindow\./);
  assert.doesNotMatch(bare, /\bdocument\./);
});

console.log('\n' + passed + ' config tests passed');
