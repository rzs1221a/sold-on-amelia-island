# Sold on Amelia Island — Kelly Marine & Will Henderson

Production website for Kelly Marine (buyer specialist) & Will Henderson (listing
specialist), Berkshire Hathaway HomeServices Heymann Williams Realty —
*The Spouses Who Sell Houses*.

Static site, no build step: `index.html` + `css/site.css` + `js/app.js` + `assets/`.

## Features

- **Seller flow (Will):** address → property details → timeline → contact → honest
  "we're preparing your analysis" confirmation. Lead emailed to Will's BHHS Connect.
- **Buyer flow (Kelly):** guided questionnaire → contact → confirmation + live MLS
  search links. Lead emailed to Kelly's BHHS Connect.
- **Live BoldTrail listing/map links**, **working newsletter**,
  cinematic hero, self-hosted imagery, full SEO/OG/schema, reduced-motion + a11y.

## How leads are delivered (Netlify Forms → BHHS Connect)

Both flows POST to **Netlify Forms** (`buyer-lead`, `seller-lead`) plus a `newsletter`
form. Netlify captures every submission and emails it to whatever recipient you set.
No third-party account, no server code.

Field mapping is in `LEAD_ROUTING` / `submitLead()` at the top of `js/app.js`.

## GO-LIVE CHECKLIST (~20 min)

1. **Deploy:** Netlify → *Add new project* → import `sold-on-amelia-island` →
   Deploy (build command blank, publish directory `/`). Netlify auto-detects the forms.
2. **Route leads to BHHS Connect:** Netlify → *Forms* → select `buyer-lead`, add an
   **email notification** to Kelly's BHHS Connect lead-import address (and her
   `KellyMarineRealtor@gmail.com` as backup). Repeat for `seller-lead` → Will's BHHS
   Connect address + `Will@HeymannWilliamsRealty.com`. Add `newsletter` → whoever manages
   the list. *(Don't have the BHHS Connect import addresses handy? Point them at the
   agents' direct emails now and swap in the CRM addresses anytime — no redeploy needed.)*
3. **Domain:** Netlify → *Domain settings* → add `soldonameliaisland.com`, follow the DNS
   steps, enable HTTPS. (If the domain differs, update the canonical/OG/sitemap URLs.)
4. **Analytics (optional):** paste a GA4 Measurement ID into `window.GA_MEASUREMENT_ID`
   near the top of `index.html`.
5. **Spam (optional):** Netlify → Forms → enable reCAPTCHA if volume warrants (honeypot
   is already active).


## Kelly & Will edit the site themselves (`/admin`)

The site has a built-in editor so they don't have to ask you for content changes.

**They go to `soldonameliaisland.com/admin`, log in, edit, and hit Publish.**
Changes appear on the live site within a minute or two — no code, no deploys.

What they can change:
- **Top of Page** — headline, tagline, rotating background photos
- **About Kelly & Will** — names, titles, bios, phone, email, and optional real
  headshots (drop one in and it replaces the K/W monogram automatically)
- **Featured Property** — title, description, photo, feature tags, link
- **Listing Cards** — the three "search by lifestyle" cards (On Island, Amelia
  Island Plantation, Nassau County) and their BoldTrail links
- **Neighborhoods** — the four area tiles and the interactive-map button link
- **Why Kelly & Will + Testimonials** — selling points, and real client testimonials
  (the testimonial block stays hidden until they add one)

Contact details edited here also update the footer and the lead-flow screens
automatically, so phone numbers can never fall out of sync.

### Turning it on (one-time, ~3 minutes)

1. Netlify → **Site configuration → Identity** → **Enable Identity**
2. Identity → **Registration** → set to **Invite only**
3. Identity → **Services → Git Gateway** → **Enable Git Gateway**
4. Identity → **Invite users** → invite Kelly's and Will's email addresses
5. They click the emailed invite, set a password, and land in the editor

Content lives in `content/*.json`; the editor config is `admin/config.yml`.
You can still edit those files directly in git — both paths work.

## BoldTrail (live listings + direct CRM leads)

Built and waiting on credentials — see **`BOLDTRAIL-SETUP.md`** for the exact
requests to send BoldTrail (including how leads get assigned to Kelly vs Will) and
where each value plugs into `js/boldtrail.js`. The site works today without them,
linking out to the live BoldTrail search.

## Swap in real assets anytime

- Headshots: replace the `K`/`W` monogram avatars.
- Photography: drop real listing/island photos into `assets/img/` (same filenames).
- Testimonials: real quotes go in the marked slot in the "trust" section of `index.html`.
- Featured/collection cards link to the live Heymann Williams BoldTrail search.

## Notes

- `netlify.toml` proxies `/details/*`, `/search/*`, `/property/*` to
  `ameliaisland.heymannwilliams.com`, and sets security + asset-cache headers.
- All content is intentionally honest — no fabricated stats, testimonials, or per-home
  valuations — appropriate for a licensed agent's public site.
