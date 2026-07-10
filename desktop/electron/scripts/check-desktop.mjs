import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const required = ['main.cjs', 'preload.cjs', 'package.json'];
let ok = true;
for (const file of required) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    console.error(`Missing ${file}`);
    ok = false;
  }
}
const main = fs.readFileSync(path.join(root, 'main.cjs'), 'utf8');
for (const requiredSnippet of [
  'nodeIntegration: false',
  'contextIsolation: true',
  'sandbox: true',
  'function isAllowedExternalUrl',
  "parsed.protocol === 'http:' || parsed.protocol === 'https:'",
  'module.exports = { isAllowedExternalUrl, resolveFrontendUrl }',
]) {
  if (!main.includes(requiredSnippet)) {
    console.error(`Desktop shell is missing required snippet: ${requiredSnippet}`);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log('Desktop shell spike files look valid.');
