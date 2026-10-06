import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Play.html embeds code, configuration and CSS without external startup dependencies', async () => {
  const html = await readFile(new URL('../Play.html', import.meta.url), 'utf8');
  assert.ok(html.includes('<style>'));
  assert.ok(html.includes('<script>'));
  assert.ok(html.includes('schemaVersion'));
  assert.doesNotMatch(html, /<script[^>]+src\s*=/i);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/i);
  assert.doesNotMatch(html, /<script[^>]+type="module"/i);
});
