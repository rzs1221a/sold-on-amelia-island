/* ==========================================================
   BOLDTRAIL / kvCORE INTEGRATION
   ----------------------------------------------------------
   Everything BoldTrail-related lives here so it can be switched
   on without touching the rest of the site.

   Nothing here is active until the values below are filled in.
   Until then the site links out to the BoldTrail search page,
   which already works.

   See BOLDTRAIL-SETUP.md for exactly what to request and where
   to find each value.
   ========================================================== */

const BOLDTRAIL = {
  // The public BoldTrail-hosted search site. Already live and working.
  searchUrl: 'https://ameliaisland.heymannwilliams.com/search',

  // Optional: a dedicated map-view URL, if BoldTrail gives you one that
  // differs from the search URL above.
  mapUrl: '',

  // ---- LIVE LISTINGS EMBED -------------------------------------------
  // Paste the widget/embed snippet BoldTrail generates (Settings → Web →
  // Widgets, or from BoldTrail support). Two supported shapes:
  //
  //   embedHtml:   a raw <script>/<iframe> snippet — injected as-is.
  //   iframeUrl:   a URL to embed in a responsive iframe.
  //
  // Leave both empty to keep the current "browse live listings" link cards.
  embedHtml: '',
  iframeUrl: '',
  iframeHeight: 900,

  // ---- DIRECT LEAD POSTING (optional) --------------------------------
  // If BoldTrail provides an API endpoint / webhook for lead capture,
  // set these. When `endpoint` is set, leads POST here IN ADDITION to
  // the Netlify form (so nothing is ever lost if the API call fails).
  //
  // agentIds: BoldTrail's internal agent identifiers, used so a lead is
  // assigned to the right person. Ask BoldTrail which field their API
  // expects for agent assignment (commonly `agent_id`, `agent_email`,
  // or a routing/round-robin setting on their side) — see the setup doc.
  lead: {
    endpoint: '',        // e.g. https://api.boldtrail.com/v1/leads
    apiKey: '',          // provided by BoldTrail
    agentIdField: 'agent_id',
    agentIds: {
      kelly: '',         // Kelly's BoldTrail agent ID
      will: ''           // Will's BoldTrail agent ID
    }
  }
};

/* ---------- Live listings embed ---------- */
(function mountListingsEmbed() {
  const slot = document.getElementById('boldtrail-listings');
  if (!slot) return;

  if (BOLDTRAIL.embedHtml) {
    slot.innerHTML = BOLDTRAIL.embedHtml;
    // Snippets injected via innerHTML don't execute their <script> tags;
    // re-create them so BoldTrail's widget actually boots.
    slot.querySelectorAll('script').forEach(old => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
      s.text = old.text;
      old.replaceWith(s);
    });
    slot.hidden = false;
    document.querySelectorAll('[data-listings-fallback]').forEach(el => el.remove());
  } else if (BOLDTRAIL.iframeUrl) {
    const f = document.createElement('iframe');
    f.src = BOLDTRAIL.iframeUrl;
    f.title = 'Live Amelia Island listings';
    f.loading = 'lazy';
    f.style.cssText = `width:100%;height:${BOLDTRAIL.iframeHeight}px;border:0;border-radius:1.6rem;`;
    slot.appendChild(f);
    slot.hidden = false;
    document.querySelectorAll('[data-listings-fallback]').forEach(el => el.remove());
  }
})();

/* ---------- Optional direct lead push ---------- */
// Called alongside the Netlify form submission in app.js.
async function pushLeadToBoldTrail(type, lead) {
  const cfg = BOLDTRAIL.lead;
  if (!cfg.endpoint || !cfg.apiKey) return false; // not configured — no-op
  const who = type === 'buyer' ? 'kelly' : 'will';
  const payload = {
    ...lead,
    source: 'SoldOnAmeliaIsland.com',
    type: type === 'buyer' ? 'Buyer' : 'Seller'
  };
  if (cfg.agentIds[who]) payload[cfg.agentIdField] = cfg.agentIds[who];
  try {
    await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('BoldTrail lead push failed (Netlify form still captured it):', err);
    return false;
  }
}

// Apply configured BoldTrail URLs to the site's outbound links.
(function applyBoldTrailLinks() {
  if (BOLDTRAIL.mapUrl) {
    document.querySelectorAll('.areas-map-cta a').forEach(a => { a.href = BOLDTRAIL.mapUrl; });
  }
})();
