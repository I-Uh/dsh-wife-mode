/**
 * Generates client.js from src/client.template.js by inlining the wallpaper as
 * a data URI. The browser bundle must stay a single self-contained module, so
 * the image is embedded rather than fetched from a route.
 *
 * Usage: node scripts/build-client.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const PLACEHOLDER = '__WALLPAPER_DATA_URI__';

const template = readFileSync(join(root, 'src', 'client.template.js'), 'utf8');
const base64 = readFileSync(join(root, 'assets', 'wallpaper.webp')).toString('base64');
const dataUri = 'data:image/webp;base64,' + base64;

if (!template.includes(PLACEHOLDER)) {
  throw new Error(`src/client.template.js is missing ${PLACEHOLDER}`);
}

const output = template.replace(PLACEHOLDER, dataUri);
writeFileSync(join(root, 'client.js'), output);

console.log(`client.js written: ${(output.length / 1024).toFixed(1)} KiB`);
