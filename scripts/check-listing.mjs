// Verifica i limiti di caratteri di App Store / Google Play per store-assets/listing.json.
import { readFile } from 'node:fs/promises';

const LIMITS = { name: 30, subtitle: 30, keywords: 100, promotionalText: 170, playShort: 80, description: 4000 };
const listing = JSON.parse(await readFile('store-assets/listing.json', 'utf8'));
let ok = true;
for (const [locale, fields] of Object.entries(listing)) {
  for (const [field, max] of Object.entries(LIMITS)) {
    const len = [...(fields[field] || '')].length;
    const bad = !len || len > max;
    if (bad) ok = false;
    console.log(`${bad ? '✗' : '✓'} ${locale.padEnd(6)} ${field.padEnd(16)} ${String(len).padStart(4)}/${max}`);
  }
  if (/\s,|,\s/.test(fields.keywords)) {
    ok = false;
    console.log(`✗ ${locale} keywords: niente spazi intorno alle virgole`);
  }
}
process.exit(ok ? 0 : 1);
