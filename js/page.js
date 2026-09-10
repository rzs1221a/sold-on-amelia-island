/* ==========================================================
   SOLD ON AMELIA ISLAND — page.js
   Hydrates a standalone page from its JSON in /content (edited
   at /admin), exactly the way index.html hydrates from
   /content/*.json. The HTML ships with the same copy baked in,
   so the page reads correctly even if the fetch fails.

   The page declares which file to read:
     <body data-content="/content/pages/sell.json">
   ========================================================== */
(function hydratePage() {
  const src = document.body.getAttribute('data-content');
  if (!src) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const setText = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.textContent = val; };
  // Blank lines separate paragraphs; a line starting with "- " becomes a bullet.
  const richText = text => {
    const blocks = String(text || '').trim().split(/\n\s*\n/);
    return blocks.map(b => {
      const lines = b.split('\n');
      if (lines.every(l => /^\s*-\s+/.test(l))) return `<ul>${lines.map(l => `<li>${esc(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
      return `<p>${esc(b).replace(/\n/g, '<br>')}</p>`;
    }).join('');
  };

  fetch(src, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(d => {
    if (!d) return;

    const banner = document.getElementById('draftBanner');
    if (banner) banner.hidden = d.draft === false;

    setText('#pageKicker', d.kicker);
    setText('#pageHeadline', d.headline);
    setText('#pageIntro', d.intro);

    const fig = document.getElementById('pageHeroFigure');
    if (fig) {
      const img = fig.querySelector('img');
      if (d.hero_image && img) { img.src = d.hero_image; img.alt = d.hero_alt || ''; fig.hidden = false; }
      else fig.hidden = true;
    }

    const body = document.getElementById('pageSections');
    if (body && Array.isArray(d.sections) && d.sections.length) {
      body.innerHTML = d.sections.map(sec => `
        <section class="pg-section">
          ${sec.heading ? `<h2>${esc(sec.heading)}</h2>` : ''}
          ${richText(sec.body)}
        </section>`).join('');
    }

    const cta = document.getElementById('pageCta');
    if (cta && d.cta_label) cta.textContent = d.cta_label;
    setText('#pageCtaBlurb', d.cta_blurb);
  }).catch(() => { /* baked-in copy stays */ });
})();
