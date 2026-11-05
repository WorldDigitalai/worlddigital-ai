// Lets Node tests import modules that Wrangler bundles text files into (rules: Text for .md/.txt/.html), and JSON.
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export async function load(url, ctx, next) {
  if (/\\.(md|txt|html)$/.test(url)) return { format: 'module', shortCircuit: true,
    source: 'export default ' + JSON.stringify(await readFile(fileURLToPath(url), 'utf8')) };
  // JSON modules (Wrangler bundles them without an import attribute)
  if (/\\.json$/.test(url)) return { format: 'module', shortCircuit: true,
    source: 'export default ' + await readFile(fileURLToPath(url), 'utf8') };
  return next(url, ctx);
}`));
