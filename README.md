# SOLD ON AMELIA ISLAND — Kelly Marine & Will Henderson

A cinematic, conversion-focused site for Kelly Marine (buyer specialist) and Will
Henderson (listing specialist) of Berkshire Hathaway HomeServices Heymann Williams
Realty — *The Spouses Who Sell Houses*.

Static site: no build step, no framework. `index.html` + `css/site.css` + `js/app.js`.

## What it does

- **Seller path (Will)** — address + property details → contact capture (name,
  address, email, phone) → animated valuation reveal. Lead is packaged and routed
  to Will.
- **Buyer path (Kelly)** — guided questionnaire (vision, budget, size, areas,
  timeline) → contact capture (name, email, phone) → private portal reveal with
  curated matches. Lead is packaged and routed to Kelly.
- Featured property (2337 S Fletcher Ave), curated collection, Around Town
  events, The Coastal Edit newsletter signup, neighborhood tiles, testimonials.

## Lead routing → BHHS Connect

All routing lives in one place: `LEAD_ROUTING` at the top of `js/app.js`.

Each agent gets their own `endpoint` (a Formspree form or Zapier webhook works).
Point the form's notification/forward address at the agent's **BHHS Connect
email-to-lead parser address** and every submission lands in the right agent's
CRM with the full questionnaire context attached. Until an endpoint is set, the
site runs in demo mode (leads are logged to the browser console and the success
UI still plays).

## Deploy

1. Connect this repo to Netlify — build command blank, publish directory `/`.
2. Point the SoldOnAmeliaIsland.com domain at Netlify.

`netlify.toml` proxies `/details/*`, `/search/*`, and `/property/*` to the
BoldTrail-served `ameliaisland.heymannwilliams.com` host so property-alert email
links resolve on this domain.

## Swap-ins before launch

- Replace the monogram avatars (`K` / `W`) with real headshots.
- Replace Unsplash imagery with listing/island photography.
- Set both `endpoint` values in `LEAD_ROUTING`.
- Update the Around Town cards (or wire them to the weekly newsletter).
