import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

test('gameplay imports follow module boundaries and never browser or Three.js globals', async () => {
  const root = path.resolve('src');
  const rules = { core: ['core'], config: ['config'], sandbox: ['core', 'config', 'sandbox'],
    combat: ['core', 'config', 'combat'], character: ['core', 'config', 'physics', 'character'], range: ['core', 'config', 'combat', 'character', 'physics', 'range'],
    physics: ['core', 'config', 'range', 'physics'] };
  const domains = Object.keys(rules);
  for (const domain of domains) {
    for (const entry of await readdir(path.join(root, domain), { recursive: true })) {
      if (!entry.endsWith('.ts')) continue;
      const file = path.join(root, domain, entry);
      const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = node => {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
          const specifier = node.moduleSpecifier;
          if (specifier && ts.isStringLiteral(specifier)) {
            if (domain === 'physics' && entry === 'rapier-world.ts' && specifier.text === '@dimforge/rapier3d-compat') return;
            assert.ok(specifier.text.startsWith('.'), `${file}: external dependency ${specifier.text}`);
            const target = path.relative(root, path.resolve(path.dirname(file), specifier.text));
            assert.ok(rules[domain].includes(target.split(path.sep)[0]), `${file}: crosses domain boundary`);
            if (['range', 'character'].includes(domain) && target.split(path.sep)[0] === 'physics') assert.equal(path.basename(target), 'contracts.js', 'Gameplay must depend on the physics port, not Rapier');
          }
        }
        if (ts.isIdentifier(node)) assert.ok(!['window', 'document', 'requestAnimationFrame', 'THREE'].includes(node.text), `${file}: browser dependency ${node.text}`);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  }
});
