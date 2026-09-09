#!/usr/bin/env node
/**
 * Stamp a new neighborhood page from the template.
 *
 *   node tools/new-neighborhood.mjs "Amelia Island Plantation"
 *   node tools/new-neighborhood.mjs "Oyster Bay" oyster-bay   # explicit slug
 *
 * Creates:
 *   neighborhoods/<slug>/index.html      (noindex shell; flip when copy lands)
 *   content/neighborhoods/<slug>.json    (editable at /admin → Neighborhood Pages)
 *
 * The brief calls for THREE neighborhoods, chosen by the client, each written
 * from a client interview. This script builds the route; it does not write copy.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , name, slugArg] = process.argv;
if (!name) {
  console.error('Usage: node tools/new-neighborhood.mjs "<Neighborhood Name>" [slug]');
  process.exit(1);
}
const slug = (slugArg || name).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const root = resolve(new URL('..', import.meta.url).pathname);
const dir = resolve(root, 'neighborhoods', slug);
const htmlOut = resolve(dir, 'index.html');
const jsonOut = resolve(root, 'content', 'neighborhoods', `${slug}.json`);
if (existsSync(htmlOut) || existsSync(jsonOut)) {
  console.error(`Refusing to overwrite: ${htmlOut} or ${jsonOut} already exists.`);
  process.exit(1);
}

const escHtml = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const template = readFileSync(resolve(root, 'tools', 'neighborhood-template.html'), 'utf8');
const html = template.replace(/\{\{NAME\}\}/g, escHtml(name)).replace(/\{\{SLUG\}\}/g, slug);

const PH = '[PLACEHOLDER — replace with copy from the client interview before publishing] ';
const content = {
  draft: true,
  name,
  kicker: 'Amelia Island Neighborhoods',
  headline: `${name} Homes for Sale`,
  intro: PH + `One or two sentences that place ${name} on the island and say who it is for.`,
  hero_image: '',
  hero_alt: '',
  sections: [
    { heading: `What living in ${name} is actually like`, body: PH + 'From the client interview: the day-to-day, the feel of the streets, who the neighbors are.' },
    { heading: 'Housing stock and price range', body: PH + 'Types of homes, age, typical lot sizes, and a realistic price range with the date it was true.' },
    { heading: 'HOA, rental restrictions and flood considerations', body: PH + 'HOA (yes/no, what it covers), short-term rental rules, flood zone reality and what it means for insurance.' },
    { heading: 'Beach access, schools and getting around', body: PH + 'How you reach the beach, school zoning, drive time to downtown Fernandina and the mainland.' },
    { heading: 'Who it suits', body: PH + 'Honest fit: who loves it here and who would be happier elsewhere on the island.' }
  ],
  cta_label: `Search ${name} Homes with Kelly`,
  cta_blurb: 'Kelly curates a search for you and knows which streets to watch.'
};

mkdirSync(dir, { recursive: true });
writeFileSync(htmlOut, html);
writeFileSync(jsonOut, JSON.stringify(content, null, 2) + '\n');
console.log(`Created ${htmlOut}\nCreated ${jsonOut}\n\nPage is noindex and unlinked until copy lands — see the comment at the top of the HTML.`);
