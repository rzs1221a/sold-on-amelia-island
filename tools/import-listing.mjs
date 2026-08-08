#!/usr/bin/env node
/* ==========================================================
   FEATURED-LISTING IMPORTER

   Turns a saved BHHS listing page into the site's featured block.

   1. Open the listing on bhhsheymannwilliams.com and save the page
      (Ctrl/Cmd+S → "Webpage, HTML Only" is enough).
   2. Run:  node tools/import-listing.mjs <saved-page.html> [--slug <name>]
            [--max <photos>] [--status "For Sale"] [--link <url>]
   3. Review the printed summary, tweak alts/chips in /admin or
      content/featured.json, then commit and push.

   Zero dependencies — needs Node 18+ (global fetch). Photos download
   from the listing CDN into assets/img/<slug>/NN.jpg; existing files
   are never overwritten unless --force is passed.
   ========================================================== */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- args ----------
const args = process.argv.slice(2);
const htmlPath = args.find(a => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const FORCE = args.includes('--force');
if (!htmlPath) {
  console.error('Usage: node tools/import-listing.mjs <saved-page.html> [--slug name] [--max 12] [--status "For Sale"] [--link url] [--force]');
  process.exit(1);
}

// ---------- read + unescape ----------
const unescapeHtml = s => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');
const raw = unescapeHtml(readFileSync(htmlPath, 'utf8'));

const first = (re, group = 1) => { const m = raw.match(re); return m ? m[group].trim() : ''; };

// ---------- extract ----------
// og:title → "96133 Oyster Bay Drive, Fernandina Beach, FL 32034 - MLS 2145358 - Berkshire…"
const ogTitle = first(/property="og:title"\s+content="([^"]+)"/);
const titleParts = ogTitle.split(/\s+-\s+/);
const fullAddress = titleParts[0] || '';
const street = fullAddress.split(',')[0].trim();
const cityStateZip = fullAddress.split(',').slice(1).join(',').trim();
const city = cityStateZip.replace(/,?\s*FL.*$/i, '').trim();

const mls = first(/-\s*MLS\s+([A-Za-z0-9]+)/) || first(/"mls[A-Za-z]*"\s*:\s*"?([A-Za-z0-9]{5,})/);
const price = first(/data-price="(\$[0-9,]+)"/) || (first(/"price"\s*:\s*"?([0-9]+)/) &&
  '$' + Number(first(/"price"\s*:\s*"?([0-9]+)/)).toLocaleString('en-US'));

// og:description → "See photos for this 3 Bath, 3 Bedroom property…"
const ogDesc = first(/property="og:description"\s+content="([^"]+)"/);
const beds = first(/([0-9]+)\s*bed/i) || (ogDesc.match(/([0-9]+)\s*Bedroom/i) || [])[1] || '';
const baths = first(/data-total-bath="([0-9.]+)"/) || (ogDesc.match(/([0-9.]+)\s*Bath/i) || [])[1] || '';
// Sqft and lot size both live in the "main-attributes-summary" specs line —
// e.g. "3 bed / 3 bath / 3,250 Sq. Ft. / 17,860 Sq. Ft., 0.41 acres lot size".
// Search filter widgets elsewhere on the page print range-slider labels like
// "500 Sq Ft" / "1,000 Sq Ft" that would otherwise match first, so this is
// scoped to the specs block specifically. Living-area sqft is the first
// "Sq. Ft." figure in that block, lot size the second.
let sqft = '', lot = '';
{
  const specsBlock = raw.match(/cmp-property-details-main-attributes-summary[\s\S]{0,1600}/);
  const matches = specsBlock ? [...specsBlock[0].matchAll(/([0-9][0-9,]{2,6})\s*(?:<[^>]+>\s*)*Sq\.?\s?F/gi)] : [];
  if (matches[0]) sqft = matches[0][1];
  if (matches[1]) lot = matches[1][1];
}
// Year built isn't on every BHHS template — best-effort only, never fabricated.
const year = first(/Year Built[^0-9]{0,40}([0-9]{4})/i) || first(/\bBuilt\b[^0-9]{0,10}([0-9]{4})/i);

// long description lives in .property-details-description__text > p[data-text-count]
let description = '';
{
  const m = raw.match(/property-details-description__text[\s\S]{0,200}?<p[^>]*>([^<]{80,2000})/);
  if (m) description = m[1].replace(/\s+/g, ' ').trim();
}

const status = opt('status',
  /\bComing Soon\b/.test(raw) ? 'Coming Soon'
  : /\bPending\b/.test(raw) ? 'Pending'
  : 'For Sale');

const link = opt('link', first(/property="og:url"\s+content="([^"]+)"/) || first(/rel="canonical"\s+href="([^"]+)"/));

// photos: data-images-to-load="[…]" on the gallery element
let photoUrls = [];
{
  const m = raw.match(/data-images-to-load="(\[[\s\S]*?\])"/);
  if (m) { try { photoUrls = JSON.parse(m[1]); } catch { /* fall through */ } }
  if (!photoUrls.length) {
    photoUrls = [...new Set(raw.match(/https:\/\/photos\.prod\.cirrussystem\.net\/[^\s"',)]+/g) || [])];
  }
  // full-size jpegs, not the webp thumbnails
  photoUrls = photoUrls.map(u => u.split('?')[0]);
}

const slug = opt('slug', street.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'featured');
const MAX = Number(opt('max', '12'));

console.log('── Parsed from', htmlPath);
console.table({ street, city, price, status, beds, baths, sqft, lot, year, mls, photos: photoUrls.length, slug });
if (!street || !photoUrls.length) {
  console.error('✗ Could not find an address or any photos — is this a saved BHHS listing page?');
  process.exit(1);
}

// ---------- download photos ----------
const dir = join(ROOT, 'assets', 'img', slug);
mkdirSync(dir, { recursive: true });
const kept = [];
for (let i = 0; i < Math.min(photoUrls.length, MAX); i++) {
  const n = String(i + 1).padStart(2, '0');
  const dest = join(dir, `${n}.jpg`);
  if (existsSync(dest) && !FORCE) {
    console.log(`  ${n}.jpg exists, keeping (use --force to redownload)`);
    kept.push(n); continue;
  }
  const res = await fetch(photoUrls[i]);
  if (!res.ok) { console.warn(`  ✗ photo ${n} → HTTP ${res.status}, skipped`); continue; }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`  ✓ ${n}.jpg  (${statSync(dest).size / 1024 | 0} KB)`);
  kept.push(n);
}

// ---------- write featured.json ----------
const featured = {
  kicker: city ? `${city}, Florida` : 'Amelia Island, Florida',
  title: street,
  status,
  price: price || '',
  beds, baths, sqft, lot, year, mls,
  description,
  photos: kept.map((n, i) => ({
    image: `/assets/img/${slug}/${n}.jpg`,
    alt: i === 0 ? `${street} — front view` : `${street} — photo ${i + 1}`
  })),
  image: '',
  badge: 'Featured Listing',
  chips: [],
  link: link || 'https://ameliaisland.heymannwilliams.com/search'
};
writeFileSync(join(ROOT, 'content', 'featured.json'), JSON.stringify(featured, null, 2) + '\n');

console.log(`\n✓ content/featured.json updated — ${kept.length} photos in assets/img/${slug}/`);
console.log('  Next: polish the photo alts + add feature chips in /admin (or the JSON),');
console.log('  then commit and push to deploy.');
