/* ==========================================================
   SOLD ON AMELIA ISLAND — analytics.js
   Google Analytics 4 loader + conversion events. Shared by every page.

   ACTIVATION: paste the GA4 Measurement ID below. Until it is set, this
   file is a complete no-op — nothing is loaded and no data leaves the page.
   When it IS set, also update privacy.html (the "Cookies & analytics"
   paragraph currently states that analytics are not running).
   ========================================================== */
window.GA_MEASUREMENT_ID = ''; // e.g. 'G-XXXXXXXXXX'

(function analytics() {
  var id = window.GA_MEASUREMENT_ID;
  if (!id) return;

  var s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', id);

  function track(name, params) {
    try { gtag('event', name, params || {}); } catch (e) { /* analytics never breaks the page */ }
  }

  /* ---- Lead conversion --------------------------------------------------
     `generate_lead` fires the moment a visitor reaches the confirmation
     screen of the buyer or seller flow — i.e. the form has been validated,
     consent has been given, and both deliveries (Netlify Forms + the CRM
     dropbox) have been dispatched. This is the event to import into Google
     Ads as the conversion.

     Implemented by observing the two confirmation renderers that js/app.js
     exposes as globals, NOT by editing the lead path itself: the original
     renderer always runs first, exactly as before, and the event fires
     afterwards inside its own try/catch. If this file is missing or broken,
     the lead flow is unaffected. -------------------------------------- */
  function observe(fnName, leadType) {
    var original = window[fnName];
    if (typeof original !== 'function') return;
    window[fnName] = function () {
      var result = original.apply(this, arguments);
      track('generate_lead', { lead_type: leadType, method: 'site_form', agent: leadType === 'seller' ? 'Will Henderson' : 'Kelly Marine' });
      return result;
    };
  }

  function hook() {
    observe('renderSellerReveal', 'seller');
    observe('renderBuyerPortal', 'buyer');
  }
  // app.js is a classic script loaded before this one on index.html; other
  // pages (which link to the flows rather than hosting them) simply have
  // nothing to hook.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();

  // Newsletter signups are a secondary conversion.
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.getAttribute && f.getAttribute('name') === 'newsletter') track('sign_up', { method: 'newsletter' });
  }, true);
})();
