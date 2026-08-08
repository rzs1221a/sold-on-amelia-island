/* ==========================================================
   SOLD ON AMELIA ISLAND — app.js
   Kelly Marine (buyers) & Will Henderson (sellers)
   ========================================================== */

/* ----------------------------------------------------------
   LEAD ROUTING CONFIG
   Each completed flow POSTs to a Netlify Form (`formName`). In the
   Netlify dashboard (Forms → notifications) set that form's email
   recipient to each agent's BHHS Connect lead-import address — leads
   land in the CRM with full context. `crmEmail` documents the intended
   recipient / fallback inbox. See README for the go-live steps.
---------------------------------------------------------- */
const LEAD_ROUTING = {
  seller: {
    agent: 'Will Henderson',
    initial: 'W',
    avatarClass: 'will',
    photo: '/assets/img/will-henderson.jpg',
    title: 'Listing Specialist',
    phone: '9043216689',
    prettyPhone: '904-321-6689',
    crmEmail: 'Will@HeymannWilliamsRealty.com',
    formName: 'seller-lead',
    routedLabel: "Sent to Will's BHHS Connect — he'll follow up personally"
  },
  buyer: {
    agent: 'Kelly Marine',
    initial: 'K',
    avatarClass: 'kelly',
    photo: '/assets/img/kelly-marine.jpg',
    title: 'Buyer Specialist',
    phone: '6786770858',
    prettyPhone: '678-677-0858',
    crmEmail: 'KellyMarineRealtor@gmail.com',
    formName: 'buyer-lead',
    routedLabel: "Sent to Kelly's BHHS Connect — she'll follow up personally"
  }
};

// Respect users who ask for less motion.
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Flatten answer values (arrays → comma strings) for a readable CRM email.
function flatten(v) { return Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v)); }

// POST a lead to its Netlify form. Netlify emails it to the configured
// BHHS Connect recipient. Returns true even on network error so the
// visitor still sees the confirmation (their info is retried below).
async function submitLead(type, lead) {
  const route = LEAD_ROUTING[type];
  const fields = { 'form-name': route.formName, 'bot-field': '' };
  Object.keys(lead).forEach(k => { fields[k] = flatten(lead[k]); });
  const body = new URLSearchParams(fields).toString();
  console.info('[SoldOnAmeliaIsland] lead →', route.formName, fields);
  try {
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    return true;
  } catch (err) {
    console.warn('Lead submit failed (confirmation still shown):', err);
    return false;
  }
}

/* ---------- Preloader ---------- */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('preloader').classList.add('done'), 900);
});
setTimeout(() => document.getElementById('preloader').classList.add('done'), 3200); // failsafe

/* ---------- Scroll: progress bar, navbar, depth ---------- */
const navbar = document.getElementById('navbar');
const depthOverlay = document.getElementById('depth-pressure');
const progressBar = document.getElementById('scroll-progress');
let scrollY = window.scrollY, lastScrollY = scrollY, targetV = 0, currentV = 0;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  targetV = (scrollY - lastScrollY) * 0.4;
  lastScrollY = scrollY;

  navbar.classList.toggle('scrolled', scrollY > 40);

  const max = document.body.scrollHeight - window.innerHeight || 1;
  const depth = Math.min(scrollY / max, 1);
  depthOverlay.style.opacity = depth * 0.85;
  progressBar.style.width = (depth * 100) + '%';
}, { passive: true });

/* ---------- Sea mist particle canvas ---------- */
const canvas = document.getElementById('seaMistCanvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  particles = [];
  const count = Math.floor((W * H) / 14000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() * 2.2 + 0.4,
      op: Math.random() * 0.45 + 0.08,
      df: (Math.random() * 2.5 + 0.5) / 3,
      fern: Math.random() < 0.12
    });
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

if (prefersReduced) { canvas.style.display = 'none'; }
else (function animateMist() {
  ctx.clearRect(0, 0, W, H);
  currentV += (targetV - currentV) * 0.1;
  targetV *= 0.9;
  particles.forEach(p => {
    p.y -= 0.18 + currentV * p.df;
    if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
    else if (p.y > H + 20) { p.y = -20; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fillStyle = p.fern
      ? `rgba(138,169,84,${p.op})`
      : `rgba(255,255,255,${p.op})`;
    ctx.fill();
  });
  requestAnimationFrame(animateMist);
})();

/* ---------- Custom cursor ---------- */
const cursor = document.getElementById('custom-cursor');
let lastTouch = 0, cursorOn = false;
window.addEventListener('touchstart', () => {
  lastTouch = Date.now();
  if (cursorOn) { document.body.classList.remove('cursor-on'); cursor.style.opacity = '0'; cursorOn = false; }
}, { passive: true });
window.addEventListener('mousemove', e => {
  if (Date.now() - lastTouch < 500) return;
  if (!cursorOn) { document.body.classList.add('cursor-on'); cursor.style.opacity = '1'; cursorOn = true; }
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mouseover', e => {
  document.body.classList.toggle('cursor-hover',
    !!e.target.closest('a, button, input, .interactive'));
});

/* ---------- Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
setTimeout(() => {
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('active');
  });
}, 150);

/* ---------- Count-up stats ---------- */
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    countObserver.unobserve(el);
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1800, t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

/* ---------- Hero slideshow ---------- */
const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dotsWrap = document.getElementById('heroDots');
let slideIdx = 0, slideTimer;

slides.forEach((_, i) => {
  const d = document.createElement('button');
  d.className = 'hero-dot interactive' + (i === 0 ? ' active' : '');
  d.setAttribute('aria-label', 'Slide ' + (i + 1));
  d.onclick = () => { setSlide(i); restartSlideTimer(); };
  dotsWrap.appendChild(d);
});
const heroDots = Array.from(dotsWrap.children);

function setSlide(i) {
  slides[slideIdx].classList.remove('active');
  heroDots[slideIdx].classList.remove('active');
  slideIdx = i;
  slides[slideIdx].classList.add('active');
  heroDots[slideIdx].classList.add('active');
}
function restartSlideTimer() {
  clearInterval(slideTimer);
  if (prefersReduced) return; // no auto-advance for reduced motion
  slideTimer = setInterval(() => setSlide((slideIdx + 1) % slides.length), 7000);
}
restartSlideTimer();

/* ---------- Local time ---------- */
function tickTime() {
  const el = document.getElementById('localTime');
  if (el) el.textContent = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
  });
}
tickTime();
setInterval(tickTime, 15000);
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Mobile menu ---------- */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('navBurger');
  const open = menu.classList.toggle('open');
  burger.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ---------- Newsletter → Netlify "newsletter" form ---------- */
function handleNewsletter(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button');
  const input = form.querySelector('input[type="email"]');
  const body = new URLSearchParams({ 'form-name': 'newsletter', 'bot-field': '', email: input.value }).toString();
  fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).catch(() => {});
  btn.textContent = 'Welcome Aboard ⛵';
  input.value = '';
  setTimeout(() => (btn.textContent = 'Subscribe'), 3500);
  return false;
}

/* ==========================================================
   LEAD FLOW ENGINE
   Seller (Will): address+property → contact → valuation reveal
   Buyer (Kelly): guided questionnaire → contact → curated portal
   ========================================================== */
const overlay = document.getElementById('flowOverlay');
const stage = document.getElementById('flowStage');
const progressFill = document.getElementById('flowProgressFill');
const progressBoat = document.getElementById('flowProgressBoat');
const agentChip = document.getElementById('flowAgentChip');
const textLink = document.getElementById('flowTextLink');

let flow = null; // { type, stepIndex, answers }

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Three quick taps + contact — "as easy as ordering a pizza" (client ask). */
const BUYER_STEPS = [
  {
    key: 'vision', kicker: 'Step 1 — The Vision',
    title: 'What are you looking for?',
    sub: 'In your own words — Kelly reads every one of these personally.',
    render: a => `
      <div class="flow-input-row">
        <input class="flow-nl-input" id="flowNL" placeholder="e.g. A porch, ocean air, room for the grandkids…" value="${esc(a.vision || '')}" autocomplete="off">
        <button class="flow-send interactive" onclick="flowNext()" aria-label="Continue">→</button>
      </div>
      <div class="chip-grid">
        ${['Oceanfront escape', 'Historic charmer', 'Golf &amp; club life', 'Marsh-view retreat', 'Investment / rental'].map(h =>
          `<button class="flow-chip interactive" onclick="pickNL(this)">${h}</button>`).join('')}
      </div>`,
    collect: () => {
      const v = document.getElementById('flowNL').value.trim();
      return v ? { vision: v } : null;
    }
  },
  {
    key: 'budget', kicker: 'Step 2 — The Budget',
    title: 'What feels comfortable?',
    sub: 'A range is perfect — Kelly will fine-tune with you.',
    chips: ['Under $500k', '$500k – $800k', '$800k – $1.2M', '$1.2M – $2M', '$2M+', 'Still deciding'],
    single: true
  },
  {
    key: 'timeline', kicker: 'Step 3 — The Timing',
    title: 'When would you like keys in hand?',
    sub: 'No pressure — this just helps Kelly pace the search.',
    chips: ['ASAP', '1–3 months', '3–6 months', '6–12 months', 'Just exploring'],
    single: true
  },
  { key: 'contact', contact: true }
];

const SELLER_STEPS = [
  {
    key: 'address', kicker: 'Step 1 — The Property',
    title: 'Where is your home?',
    sub: 'Will builds every valuation from live island comps.',
    render: a => `
      <div class="flow-input-row">
        <input class="flow-nl-input" id="flowNL" placeholder="Street address, city…" value="${esc(a.address || '')}" autocomplete="street-address">
        <button class="flow-send interactive" onclick="flowNext()" aria-label="Continue">→</button>
      </div>`,
    collect: () => {
      const v = document.getElementById('flowNL').value.trim();
      return v ? { address: v } : null;
    }
  },
  {
    key: 'ptype', kicker: 'Step 2 — The Details',
    title: 'What best describes it?',
    sub: 'Pick everything that applies.',
    chips: ['Single-family', 'Condo / townhome', 'Duplex / multi-unit', 'Oceanfront', 'Ocean view', 'Historic district', 'Golf community', 'Marsh front'],
    single: false
  },
  {
    key: 'timeline', kicker: 'Step 3 — The Timing',
    title: 'When are you thinking of selling?',
    sub: 'Strategy changes with the season — Will plans around yours.',
    chips: ['Ready now', '1–3 months', '3–6 months', 'Next year', 'Just curious about value'],
    single: true
  },
  { key: 'contact', contact: true }
];

function stepsFor(type) { return type === 'buyer' ? BUYER_STEPS : SELLER_STEPS; }

function openFlow(type, seed) {
  const route = LEAD_ROUTING[type];
  flow = { type, stepIndex: 0, answers: {} };
  if (seed) flow.answers.vision = type === 'buyer' ? `I'm interested in ${seed}` : seed;

  agentChip.innerHTML = `
    <div class="avatar ${route.avatarClass}">${route.photo
      ? `<img src="${route.photo}" alt="${esc(route.agent)}" width="46" height="46">`
      : route.initial}</div>
    <div class="meta"><strong>${route.agent}</strong><span>${route.title} · ${route.prettyPhone}</span></div>`;
  textLink.href = 'sms:' + route.phone;
  textLink.textContent = 'Text ' + route.agent.split(' ')[0] + ' Live';

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderStep();
}

function closeFlow() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  flow = null;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && flow) closeFlow(); });

function setProgress() {
  const steps = stepsFor(flow.type);
  const pct = Math.min((flow.stepIndex / steps.length) * 100, 100);
  progressFill.style.width = pct + '%';
  progressBoat.style.left = pct + '%';
}

function renderStep() {
  const steps = stepsFor(flow.type);
  const step = steps[flow.stepIndex];
  setProgress();

  if (step.contact) return renderContact();

  let body;
  if (step.render) {
    body = step.render(flow.answers);
  } else {
    const chosen = flow.answers[step.key] || [];
    body = `
      <div class="chip-grid">
        ${step.chips.map(c => `
          <button class="flow-chip interactive ${chosen.includes(c) ? 'selected' : ''}"
            onclick="toggleChip(this, '${esc(step.key)}', ${step.single})">${esc(c)}</button>`).join('')}
      </div>`;
  }

  stage.innerHTML = `
    <div class="flow-step">
      <span class="flow-step-kicker">${step.kicker}</span>
      <h2>${step.title}</h2>
      <p class="flow-sub">${step.sub}</p>
      ${body}
      <div class="flow-nav">
        ${flow.stepIndex > 0 ? '<button class="flow-back interactive" onclick="flowBack()">← Back</button>' : ''}
        <button class="btn-accent btn-flow-next interactive" onclick="flowNext()">Continue</button>
      </div>
    </div>`;

  const nl = document.getElementById('flowNL');
  if (nl) {
    nl.addEventListener('keydown', e => { if (e.key === 'Enter') flowNext(); });
    setTimeout(() => nl.focus(), 350);
  }
}

function pickNL(el) {
  const nl = document.getElementById('flowNL');
  if (nl) { nl.value = el.textContent; }
  flowNext();
}

function toggleChip(el, key, single) {
  const current = flow.answers[key] || [];
  if (single) {
    flow.answers[key] = [el.textContent];
    el.parentElement.querySelectorAll('.flow-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    setTimeout(flowNext, 320); // single-select auto-advances
    return;
  }
  const i = current.indexOf(el.textContent);
  if (i >= 0) current.splice(i, 1); else current.push(el.textContent);
  flow.answers[key] = current;
  el.classList.toggle('selected');
}

function flowBack() {
  if (flow.stepIndex > 0) { flow.stepIndex--; renderStep(); }
}

function flowNext() {
  const steps = stepsFor(flow.type);
  const step = steps[flow.stepIndex];

  if (step.collect) {
    const got = step.collect();
    if (!got) { const nl = document.getElementById('flowNL'); if (nl) { nl.classList.add('error'); setTimeout(() => nl.classList.remove('error'), 600); nl.focus(); } return; }
    Object.assign(flow.answers, got);
  } else if (step.chips && !(flow.answers[step.key] || []).length) {
    return; // need at least one chip
  }

  flow.stepIndex++;
  renderStep();
}

/* ---------- Contact capture ---------- */
function renderContact() {
  const route = LEAD_ROUTING[flow.type];
  const isBuyer = flow.type === 'buyer';
  stage.innerHTML = `
    <div class="flow-step">
      <span class="flow-step-kicker">Last Step</span>
      <h2>${isBuyer ? 'Where should Kelly reach you?' : 'Where should Will reach you?'}</h2>
      <p class="flow-sub">${isBuyer
        ? 'Kelly will personally send handpicked matches and set up your search.'
        : 'Will will prepare your personalized market analysis and follow up.'}</p>
      <div class="flow-form">
        <div class="flow-field-row">
          <div class="flow-field"><label for="leadFirstName">First Name</label><input id="leadFirstName" autocomplete="given-name" placeholder="Jane"></div>
          <div class="flow-field"><label for="leadLastName">Last Name</label><input id="leadLastName" autocomplete="family-name" placeholder="Doe"></div>
        </div>
        <div class="flow-field"><label for="leadEmail">Email</label><input id="leadEmail" type="email" autocomplete="email" placeholder="jane@example.com"></div>
        <div class="flow-field"><label for="leadPhone">Phone</label><input id="leadPhone" type="tel" autocomplete="tel" placeholder="(904) 555-0123"></div>
        <label class="flow-consent-check" for="leadConsent">
          <input type="checkbox" id="leadConsent">
          <span id="leadConsentText">${consentLanguage(route.agent, isBuyer)}</span>
        </label>
        <div class="flow-privacy-note"><a href="/privacy.html" target="_blank" rel="noopener" class="interactive">How we handle your information &rarr;</a></div>
        <button class="btn-accent interactive" style="width:100%" onclick="submitContact()">${isBuyer ? 'Send to Kelly' : 'Send to Will'}</button>
        <div style="text-align:center"><span class="flow-route-note">Routes directly to ${route.agent.split(' ')[0]}'s BHHS Connect</span></div>
      </div>
      <div class="flow-nav"><button class="flow-back interactive" onclick="flowBack()">← Back</button></div>
    </div>`;
  const nameInput = document.getElementById('leadFirstName');
  setTimeout(() => { if (nameInput) nameInput.focus(); }, 350);
}

/**
 * Exact consent language shown to the visitor. Stored verbatim alongside the
 * submission — if consent is ever questioned, the record must show precisely
 * what was agreed to, not a paraphrase.
 */
function consentLanguage(agentName, isBuyer) {
  return `I agree that ${agentName} may contact me about my ` +
    `${isBuyer ? 'home search' : 'home valuation'} by phone, text, or email, ` +
    `including automated messages. Consent is not a condition of purchase. ` +
    `Message and data rates may apply.`;
}

function validateField(id, test) {
  const el = document.getElementById(id);
  const ok = test(el.value.trim());
  if (!ok) { el.classList.add('error'); setTimeout(() => el.classList.remove('error'), 600); }
  return ok;
}

async function submitContact() {
  const okFirst = validateField('leadFirstName', v => v.length > 0);
  const okLast = validateField('leadLastName', v => v.length > 0);
  const okEmail = validateField('leadEmail', v => /.+@.+\..+/.test(v));
  const okPhone = validateField('leadPhone', v => v.replace(/\D/g, '').length >= 7);

  // TCPA: consent is required and must be an affirmative action. Never
  // pre-checked, and submission is blocked without it.
  const consentEl = document.getElementById('leadConsent');
  const okConsent = !!(consentEl && consentEl.checked);
  if (!okConsent && consentEl) {
    const wrap = consentEl.closest('.flow-consent-check');
    if (wrap) { wrap.classList.add('error'); setTimeout(() => wrap.classList.remove('error'), 900); }
  }
  if (!okFirst || !okLast || !okEmail || !okPhone || !okConsent) return;

  const a = flow.answers;
  a.firstName = document.getElementById('leadFirstName').value.trim();
  a.lastName = document.getElementById('leadLastName').value.trim();
  a.name = `${a.firstName} ${a.lastName}`;
  a.email = document.getElementById('leadEmail').value.trim();
  a.phone = document.getElementById('leadPhone').value.trim();

  const isBuyer = flow.type === 'buyer';

  // 1) Netlify Forms — durable capture plus the agent's own notification, which
  //    carries the full questionnaire the CRM dropbox has no fields for.
  const lead = isBuyer
    ? { name: a.name, email: a.email, phone: a.phone, vision: a.vision, budget: a.budget, timeline: a.timeline }
    : { name: a.name, email: a.email, phone: a.phone, address: a.address, property_type: a.ptype, timeline: a.timeline };
  submitLead(flow.type, lead);

  // 2) BoldTrail Lead Dropbox via the server function, which creates the CRM
  //    contact. Kept separate from (1) on purpose: if the dropbox parse or the
  //    send fails, the lead still reached the agent through Netlify.
  const context = {};
  Object.entries(isBuyer
    ? { vision: a.vision, budget: a.budget, timeline: a.timeline }
    : { propertyType: a.ptype, timeline: a.timeline }
  ).forEach(([k, v]) => { const s = flatten(v); if (s) context[k] = s; });

  postLeadToDropbox({
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    phone: a.phone,
    dealType: isBuyer ? 'Buyer' : 'Seller',
    sellerAddress: isBuyer ? '' : flatten(a.address),
    consent: true,
    consentText: document.getElementById('leadConsentText')?.textContent?.trim() || '',
    consentTimestamp: new Date().toISOString(),
    sourceUrl: window.location.href,
    context,
    honeypot: ''
  });

  await showLoading(isBuyer
    ? ['Saving your search…', 'Sending it to Kelly…', 'Getting you set up…']
    : ['Saving your details…', 'Sending them to Will…', 'Getting your analysis started…']);

  if (isBuyer) renderBuyerPortal();
  else renderSellerReveal();
  sprinkleSparkles();
}

/**
 * Send the lead to the server function that writes it into BoldTrail.
 *
 * Deliberately does not block the confirmation screen: the visitor has already
 * been captured by (1) above, so a CRM hiccup should never look like a failed
 * submission to them. The correlation ID is logged so any missing contact can
 * be traced to an exact payload server-side.
 */
async function postLeadToDropbox(payload) {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (data.correlationId) {
      console.info('[SoldOnAmeliaIsland] lead ref', data.correlationId, res.ok ? '(delivered)' : '(recorded, delivery issue)');
    }
    if (!res.ok) console.warn('[SoldOnAmeliaIsland] CRM delivery reported a problem:', data.error || res.status);
  } catch (err) {
    console.warn('[SoldOnAmeliaIsland] CRM delivery could not be reached:', err);
  }
}

function showLoading(lines) {
  return new Promise(resolve => {
    stage.innerHTML = `
      <div class="flow-loading">
        <div class="flow-spinner"></div>
        <div class="flow-loading-text">${lines[0]}</div>
        <div class="flow-loading-steps" id="loadStep"></div>
      </div>`;
    progressFill.style.width = '100%';
    progressBoat.style.left = '100%';
    const textEl = stage.querySelector('.flow-loading-text');
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < lines.length) { textEl.textContent = lines[i]; }
      else { clearInterval(iv); resolve(); }
    }, 1100);
  });
}

/* ---------- Buyer confirmation → live search ---------- */
const SEARCH_URL = 'https://ameliaisland.heymannwilliams.com/search';
const BUYER_CATEGORIES = [
  { img: './assets/img/collect-1.jpg', label: 'Oceanfront & Beach', sub: 'See live oceanfront homes' },
  { img: './assets/img/collect-2.jpg', label: 'Historic Downtown', sub: 'See live Fernandina homes' },
  { img: './assets/img/area-3.jpg', label: 'New Construction', sub: 'See Yulee & Wildlight homes' }
];

function renderBuyerPortal() {
  const first = (flow.answers.name || 'there').split(' ')[0];
  stage.innerHTML = `
    <div class="flow-dash">
      <div class="flow-dash-head">
        <span class="flow-step-kicker">You're all set</span>
        <h2>Thank you, <span class="accent">${esc(first)}</span>.</h2>
        <p>Kelly will personally hand-pick homes for "${esc(flow.answers.vision || 'your search')}" and reach out within 24 hours.</p>
      </div>
      <div class="flow-routed-banner">${LEAD_ROUTING.buyer.routedLabel}</div>
      <p class="dash-subhead">While you wait — browse the current island inventory live:</p>
      <div class="dash-grid">
        ${BUYER_CATEGORIES.map(c => `
          <a class="dash-card glass-dark interactive" href="${SEARCH_URL}" target="_blank" rel="noopener">
            <div class="listing-img">
              <img src="${c.img}" alt="${esc(c.label)} listings" loading="lazy" decoding="async">
              <span class="match-badge">Live listings</span>
            </div>
            <div class="listing-info">
              <div class="listing-price serif">${c.label}</div>
              <div class="listing-meta"><span>${c.sub} &rarr;</span></div>
            </div>
          </a>`).join('')}
        <div class="dash-cta glass-dark">
          <h3>Want to talk it through now?</h3>
          <p>Kelly answers her own phone — reach her directly anytime.</p>
          <div class="dash-cta-row">
            <a href="tel:${LEAD_ROUTING.buyer.phone}" class="btn-accent interactive">Call Kelly</a>
            <a href="sms:${LEAD_ROUTING.buyer.phone}" class="btn-outline interactive">Text Kelly</a>
            <a href="${SEARCH_URL}" target="_blank" rel="noopener" class="btn-outline interactive">Browse All Listings</a>
          </div>
        </div>
      </div>
    </div>`;
}

/* ---------- Seller confirmation (honest — no fabricated numbers) ---------- */
function renderSellerReveal() {
  const first = (flow.answers.name || 'there').split(' ')[0];
  const addr = flow.answers.address || 'your home';
  stage.innerHTML = `
    <div class="flow-dash">
      <div class="flow-dash-head">
        <span class="flow-step-kicker">Request Received</span>
        <h2>Thank you, <span class="accent">${esc(first)}</span>.</h2>
        <p>Will is preparing your personalized market analysis for ${esc(addr)}.</p>
      </div>
      <div class="flow-routed-banner">${LEAD_ROUTING.seller.routedLabel}</div>
      <div class="dash-steps">
        <div class="dash-step glass-dark"><span class="dash-step-n serif">1</span><h4>He studies your home</h4><p>Will reviews recent comparable island sales and current demand for a home like yours.</p></div>
        <div class="dash-step glass-dark"><span class="dash-step-n serif">2</span><h4>He builds your strategy</h4><p>A custom pricing &amp; marketing plan tuned to today's Amelia Island market.</p></div>
        <div class="dash-step glass-dark"><span class="dash-step-n serif">3</span><h4>He calls you</h4><p>Will personally walks you through the numbers — complimentary, no obligation.</p></div>
      </div>
      <div class="dash-cta glass-dark">
        <h3>Prefer to talk now?</h3>
        <p>Will answers his own phone — reach him directly anytime.</p>
        <div class="dash-cta-row">
          <a href="tel:${LEAD_ROUTING.seller.phone}" class="btn-accent interactive">Call Will</a>
          <a href="sms:${LEAD_ROUTING.seller.phone}" class="btn-outline interactive">Text Will</a>
          <a href="mailto:${LEAD_ROUTING.seller.crmEmail}" class="btn-outline interactive">Email Will</a>
        </div>
      </div>
    </div>`;
}

/* ---------- Sparkles ---------- */
function sprinkleSparkles() {
  if (prefersReduced) return;
  const glyphs = ['✦', '✧', '⋆'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = 10 + Math.random() * 80 + 'vw';
    s.style.top = 8 + Math.random() * 30 + 'vh';
    s.style.color = i % 3 ? 'rgba(138,169,84,.9)' : 'rgba(186,216,225,.9)';
    s.style.fontSize = 0.7 + Math.random() * 0.9 + 'rem';
    s.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}

/* ==========================================================
   PHOTO LIGHTBOX
   Full-screen listing gallery. Built for the listing appointment:
   Will opens the site with a seller and walks the whole house on a
   big screen. Every photo is shown whole — contained, never cropped
   — and neighbours are preloaded so paging never flashes a blank.
   ========================================================== */
const Lightbox = (() => {
  const el = document.getElementById('lightbox');
  if (!el) return { load() {}, open() {} };

  const imgEl = document.getElementById('lightboxImg');
  const capEl = document.getElementById('lightboxCaption');
  const countEl = document.getElementById('lightboxCounter');
  const railEl = document.getElementById('lightboxRail');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const closeBtn = document.getElementById('lightboxClose');

  let photos = [], title = '', idx = 0, isOpen = false, lastFocus = null;

  // Keep the next/previous frames warm so paging is instant on stage.
  function preloadAround(i) {
    [i - 1, i + 1].forEach(n => {
      const p = photos[(n + photos.length) % photos.length];
      if (p) { const im = new Image(); im.src = p.image; }
    });
  }

  function render(i, animate = true) {
    if (!photos.length) return;
    idx = (i + photos.length) % photos.length;
    const ph = photos[idx];
    const apply = () => {
      imgEl.src = ph.image;
      imgEl.alt = ph.alt || title;
      el.classList.remove('swapping');
    };
    if (animate && !prefersReduced) {
      el.classList.add('swapping');
      setTimeout(apply, 180);
    } else apply();

    capEl.textContent = ph.alt || '';
    countEl.textContent = `${idx + 1} / ${photos.length}`;
    railEl.querySelectorAll('button').forEach((b, bi) => {
      const on = bi === idx;
      b.classList.toggle('active', on);
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    preloadAround(idx);
  }

  const next = () => render(idx + 1);
  const prev = () => render(idx - 1);

  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Tab') {
      // Simple focus trap across the control set.
      const f = [closeBtn, prevBtn, nextBtn].filter(b => b && b.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  function open(i = 0, trigger) {
    if (!photos.length) return;
    lastFocus = trigger || document.activeElement;
    el.classList.add('open');
    isOpen = true;
    document.body.style.overflow = 'hidden';
    render(i, false);
    closeBtn.focus();
  }

  function close() {
    el.classList.remove('open');
    isOpen = false;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function load(list, listingTitle) {
    photos = Array.isArray(list) ? list.filter(p => p && p.image) : [];
    title = listingTitle || '';
    railEl.innerHTML = photos.map((ph, i) => `
      <button type="button" class="interactive${i === 0 ? ' active' : ''}" aria-label="Photo ${i + 1} of ${photos.length}">
        <img src="${esc(ph.image)}" alt="" loading="lazy" decoding="async">
      </button>`).join('');
    railEl.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => render(i)));
    const many = photos.length > 1;
    prevBtn.hidden = nextBtn.hidden = !many;
  }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  closeBtn.addEventListener('click', close);
  // Clicking the dark surround closes; clicking the photo itself does not.
  el.addEventListener('click', e => {
    if (e.target === el || e.target.classList.contains('lightbox-stage') || e.target.classList.contains('lightbox-figure')) close();
  });
  document.addEventListener('keydown', onKey);

  // Swipe — Will may be presenting from an iPad.
  let touchX = null;
  el.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
    touchX = null;
  }, { passive: true });

  return { load, open };
})();

// Seed the lightbox from the page's static defaults immediately, so the
// gallery still opens even if the CMS content fetch below fails or is slow.
// hydrateFromCMS() calls Lightbox.load() again once real data arrives.
(function seedLightboxDefaults() {
  const strip = document.getElementById('featuredGallery');
  const main = document.getElementById('featuredMainPhoto');
  const frame = document.getElementById('featuredPhotoBtn');
  if (!main || !frame) return;
  const photos = strip
    ? Array.from(strip.querySelectorAll('img')).map(img => ({ image: img.getAttribute('src'), alt: img.alt }))
    : [{ image: main.getAttribute('src'), alt: main.alt }];
  Lightbox.load(photos.length ? photos : [{ image: main.getAttribute('src'), alt: main.alt }], main.alt || '');
  frame.addEventListener('click', () => {
    const activeThumb = strip && strip.querySelector('.featured-thumb.active');
    const thumbs = strip ? Array.from(strip.querySelectorAll('.featured-thumb')) : [];
    const idx = activeThumb ? thumbs.indexOf(activeThumb) : 0;
    Lightbox.open(Math.max(idx, 0), frame);
  });
})();

/* ==========================================================
   FEATURED-DESCRIPTION "READ MORE" (mobile)
   The clamp itself is CSS, scoped to the mobile breakpoint. This just
   decides whether the paragraph actually overflows three lines and,
   if so, shows the toggle. Re-checked after CMS hydration (description
   text can change) and on resize (crossing the breakpoint).
   ========================================================== */
const FeaturedDescClamp = (() => {
  const desc = document.getElementById('featuredDesc');
  const toggle = document.getElementById('featuredDescToggle');
  if (!desc || !toggle) return { check() {} };

  let expanded = false;

  function check() {
    if (expanded) return; // don't yank an open toggle shut mid-read
    desc.classList.add('clamped');
    // Clamping only applies under the mobile breakpoint (CSS-scoped); above
    // it, clamped has no visual effect and scrollHeight === clientHeight.
    const overflowing = desc.scrollHeight - desc.clientHeight > 2;
    toggle.hidden = !overflowing;
    if (!overflowing) desc.classList.remove('clamped');
  }

  toggle.addEventListener('click', () => {
    expanded = !expanded;
    desc.classList.toggle('clamped', !expanded);
    toggle.textContent = expanded ? 'Read less' : 'Read more';
    toggle.setAttribute('aria-expanded', String(expanded));
  });

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(check, 200);
  });

  return { check };
})();
// Seed from the static default text once the page (and web fonts) settle;
// hydrateFromCMS() re-checks again if the description changes.
window.addEventListener('load', () => FeaturedDescClamp.check());

/* ==========================================================
   CMS CONTENT HYDRATION
   Reads /content/*.json (edited by Kelly & Will at /admin) and
   applies it to the page. The HTML ships with sensible defaults,
   so the site still renders correctly if a fetch fails.
   ========================================================== */
(function hydrateFromCMS() {
  const get = path => fetch(path, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null);
  const setText = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.textContent = val; };

  // --- Hero ---
  get('/content/hero.json').then(d => {
    if (!d) return;
    const namesEl = document.querySelector('.masthead-names');
    if (namesEl && d.names_line) {
      // Preserve the ampersand + script "are" styling by rebuilding the line.
      const m = d.names_line.match(/^(.*?)\s*&\s*(.*?)(\s+are)?$/i);
      namesEl.innerHTML = m
        ? `${esc(m[1])} <span class="masthead-amp">&amp;</span> ${esc(m[2])}${m[3] ? ' <span class="masthead-are">are</span>' : ''}`
        : esc(d.names_line);
    }
    const h1 = document.querySelector('.masthead-title');
    if (h1 && d.headline_line_1) {
      h1.innerHTML = `${esc(d.headline_line_1)}<br>${esc(d.headline_line_2 || '')}<span class="masthead-dot">.com</span>`;
    }
    setText('.masthead-tag', d.tagline);

    if (Array.isArray(d.slides) && d.slides.length) {
      const wrap = document.getElementById('heroSlides');
      const dots = document.getElementById('heroDots');
      if (wrap && dots) {
        wrap.innerHTML = d.slides.map((s, i) =>
          `<div class="hero-slide${i === 0 ? ' active' : ''}" role="img" aria-label="${esc(s.alt || '')}" style="background-image:url('${esc(s.image)}')"></div>`
        ).join('');
        dots.innerHTML = '';
        rebuildHeroSlides();
      }
    }
  });

  // --- Agents ---
  get('/content/agents.json').then(d => {
    if (!d) return;
    [['kelly', 0], ['will', 1]].forEach(([key, idx]) => {
      const a = d[key]; if (!a) return;
      const card = document.querySelectorAll('.duo-card')[idx];
      if (card) {
        setTextIn(card, '.duo-role', a.role);
        setTextIn(card, 'h3', a.name);
        setTextIn(card, '.duo-script', a.script);
        setTextIn(card, '.duo-bio', a.bio);
        const links = card.querySelectorAll('.duo-contact');
        if (links[0] && a.phone) links[0].href = 'tel:' + a.phone;
        if (links[1] && a.phone) links[1].href = 'sms:' + a.phone;
        if (links[2] && a.email) links[2].href = 'mailto:' + a.email;
        // Optional real headshot replaces the monogram.
        const portrait = card.querySelector('.duo-portrait');
        if (portrait && a.photo) {
          portrait.style.backgroundImage = `url('${a.photo}')`;
          portrait.style.backgroundSize = 'cover';
          portrait.style.backgroundPosition = 'center';
          const initial = portrait.querySelector('.duo-initial');
          if (initial) initial.style.display = 'none';
        }
      }
      // Footer + lead routing stay in sync with edited contact details.
      const foot = document.querySelectorAll('.footer-agent')[idx];
      if (foot) {
        setTextIn(foot, 'strong', a.name);
        setTextIn(foot, 'span', `${a.role} · Realtor®`);
        const fl = foot.querySelectorAll('a');
        if (fl[0] && a.phone) { fl[0].href = 'tel:' + a.phone; fl[0].textContent = formatPhone(a.phone); }
        if (fl[1] && a.email) { fl[1].href = 'mailto:' + a.email; fl[1].textContent = a.email; }
      }
      const route = LEAD_ROUTING[key === 'kelly' ? 'buyer' : 'seller'];
      if (route) {
        if (a.name) route.agent = a.name;
        if (a.role) route.title = a.role;
        if (a.phone) { route.phone = a.phone; route.prettyPhone = formatPhone(a.phone); }
        if (a.email) route.crmEmail = a.email;
      }
    });
  });

  // --- Featured property ---
  get('/content/featured.json').then(d => {
    if (!d) return;
    const sec = document.querySelector('#listings .featured-inner'); if (!sec) return;
    setTextIn(sec, '.kicker', d.kicker);
    setTextIn(sec, 'h2', d.title);
    setTextIn(sec, '.featured-desc', d.description);
    FeaturedDescClamp.check();
    setTextIn(sec, '.featured-badge', d.badge || d.status);

    // Photos: `photos[]` is the real-listing gallery; `image` is the single-photo
    // fallback so existing content keeps working untouched.
    const gallery = Array.isArray(d.photos) && d.photos.length
      ? d.photos
      : (d.image ? [{ image: d.image, alt: d.title || '' }] : []);
    const main = sec.querySelector('#featuredMainPhoto');
    const frame = sec.querySelector('#featuredPhotoBtn');
    // The section's ambient glow is a blurred copy of the displayed photo —
    // keep it in step whenever the photo changes.
    const backdrop = document.getElementById('featuredBackdrop');
    const echo = document.getElementById('featuredPhotoEcho');
    const setBackdrop = src => {
      if (!src) return;
      if (backdrop) backdrop.style.backgroundImage = `url('${src}')`;
      if (echo) echo.style.backgroundImage = `url('${src}')`;
    };
    if (main && gallery.length) {
      main.src = gallery[0].image;
      main.alt = gallery[0].alt || d.title || main.alt;
      setBackdrop(gallery[0].image);
    }

    // Hand the gallery to the lightbox and keep the inline photo in step with it.
    // The lightbox trigger (wired once in seedLightboxDefaults) reads whichever
    // thumbnail carries .active at click time, so it stays correct here too.
    Lightbox.load(gallery, d.title || '');
    const showInline = i => {
      const ph = gallery[i]; if (!ph || !main) return;
      const apply = () => {
        main.src = ph.image;
        main.alt = ph.alt || d.title || '';
        setBackdrop(ph.image);
        if (frame) frame.classList.remove('swapping');
      };
      // Crossfade, unless the visitor asked for less motion.
      if (frame && !prefersReduced) {
        frame.classList.add('swapping');
        setTimeout(apply, 220);
      } else apply();
      if (strip) strip.querySelectorAll('.featured-thumb').forEach((b, bi) => b.classList.toggle('active', bi === i));
    };

    const strip = sec.querySelector('#featuredGallery');
    if (strip) {
      if (gallery.length > 1) {
        strip.innerHTML = gallery.map((ph, i) => `
          <button class="featured-thumb${i === 0 ? ' active' : ''} interactive" type="button"
            aria-label="View photo ${i + 1} of ${gallery.length}">
            <img src="${esc(ph.image)}" alt="" loading="lazy" decoding="async">
          </button>`).join('');
        strip.hidden = false;
        strip.querySelectorAll('.featured-thumb').forEach((btn, i) => {
          btn.addEventListener('click', () => showInline(i));
        });
      } else {
        strip.hidden = true;
      }
    }

    // Price / specs / MLS render only when supplied — an empty value stays hidden
    // rather than printing a blank or placeholder figure.
    const priceEl = sec.querySelector('#featuredPrice');
    if (priceEl) {
      const bits = [d.price, d.status].filter(Boolean);
      priceEl.innerHTML = d.price
        ? `<span class="featured-price-value">${esc(d.price)}</span>` +
          (d.status ? `<span class="featured-status">${esc(d.status)}</span>` : '')
        : '';
      priceEl.hidden = !bits.length;
    }
    const specsEl = sec.querySelector('#featuredSpecs');
    if (specsEl) {
      const specs = [
        ['Beds', d.beds], ['Baths', d.baths], ['Sq Ft', d.sqft],
        ['Lot', d.lot], ['Built', d.year]
      ].filter(([, v]) => v);
      specsEl.innerHTML = specs.map(([label, v]) =>
        `<div class="spec-cell"><span class="spec-label">${esc(label)}</span><span class="spec-value">${esc(v)}</span></div>`
      ).join('');
      specsEl.hidden = !specs.length;
    }
    const mlsEl = sec.querySelector('#featuredMls');
    if (mlsEl) {
      mlsEl.textContent = d.mls ? `MLS# ${d.mls}` : '';
      mlsEl.hidden = !d.mls;
    }

    const chips = sec.querySelector('.featured-chips');
    if (chips && Array.isArray(d.chips)) chips.innerHTML = d.chips.map(c => `<span>${esc(c)}</span>`).join('');
    const seeAll = sec.querySelector('.featured-ctas a');
    if (seeAll && d.link) seeAll.href = d.link;
    // Seed the enquiry with whichever property is currently featured, so the
    // CTA follows the listing without a second field to keep in sync.
    const cta = sec.querySelector('#featuredCta');
    if (cta && d.title) cta.setAttribute('onclick', `openFlow('buyer', ${JSON.stringify(d.title)})`);
  });

  // --- Listing cards ---
  get('/content/listings.json').then(d => {
    if (!d || !Array.isArray(d.cards)) return;
    const grid = document.querySelector('.collection-grid'); if (!grid) return;
    grid.innerHTML = d.cards.map((c, i) => `
      <a class="listing-card glass-dark interactive reveal${i ? ' delay-' + (i * 100) : ''}" href="${esc(c.link)}" target="_blank" rel="noopener">
        <div class="listing-img">
          <img src="${esc(c.image)}" alt="${esc(c.title)} listings" width="1000" height="667" loading="lazy" decoding="async">
          <span class="listing-tag">${esc(c.tag)}</span>
        </div>
        <div class="listing-info">
          <div class="listing-price serif">${esc(c.title)}</div>
          <div class="listing-addr">${esc(c.subtitle)}</div>
          <div class="listing-meta"><span>View live listings &rarr;</span></div>
        </div>
      </a>`).join('');
    reobserveReveals(grid);
  });

  // --- Newsletter CTA block ---
  get('/content/newsletter.json').then(d => {
    if (!d) return;
    setText('#newsCtaHeading', d.heading);
    setText('#newsCtaSub', d.sub);
    const btn = document.getElementById('newsCtaButton');
    if (btn) {
      if (d.button_label) btn.textContent = d.button_label;
      if (d.link) {
        btn.href = d.link;
        // External newsletter links open in a new tab; in-page anchors don't.
        const external = /^https?:\/\//i.test(d.link);
        if (external) { btn.target = '_blank'; btn.rel = 'noopener'; }
        else { btn.removeAttribute('target'); btn.removeAttribute('rel'); }
      }
    }
  });

  // --- Neighborhood tiles ---
  get('/content/areas.json').then(d => {
    if (!d) return;
    const grid = document.querySelector('.areas-grid');
    if (grid && Array.isArray(d.tiles)) {
      grid.innerHTML = d.tiles.map((t, i) => `
        <a class="area-tile interactive reveal${i ? ' delay-' + Math.min(i * 100, 300) : ''}" href="${esc(t.link)}" target="_blank" rel="noopener">
          <div class="area-bg" style="background-image:url('${esc(t.image)}')"></div>
          <div class="area-label"><h3 class="serif">${esc(t.name)}</h3><span>${esc(t.blurb)}</span></div>
        </a>`).join('');
      reobserveReveals(grid);
    }
    const mapBtn = document.querySelector('.areas-map-cta a');
    if (mapBtn && d.map_link) mapBtn.href = d.map_link;
  });

  // --- Trust points + optional real testimonials ---
  get('/content/trust.json').then(d => {
    if (!d) return;
    const stage = document.querySelector('.trust-stage'); if (!stage) return;
    const h2 = stage.querySelector('h2');
    if (h2 && d.heading) {
      const words = d.heading.trim().split(/\s+/);
      const last = words.pop();
      h2.innerHTML = `${esc(words.join(' '))} <span class="amp-script accent">${esc(last)}</span>`;
    }
    const grid = stage.querySelector('.trust-grid');
    if (grid && Array.isArray(d.items)) {
      grid.innerHTML = d.items.map(it => `
        <div class="trust-item">
          <div class="trust-icon" aria-hidden="true">${esc(it.icon || '')}</div>
          <h4>${esc(it.title)}</h4>
          <p>${esc(it.body)}</p>
        </div>`).join('');
    }
    // Only render testimonials once real ones are added in the CMS.
    const existing = stage.querySelector('.trust-quotes');
    if (existing) existing.remove();
    if (Array.isArray(d.testimonials) && d.testimonials.length) {
      const wrap = document.createElement('div');
      wrap.className = 'trust-quotes';
      wrap.innerHTML = d.testimonials.map(t => `
        <figure class="trust-quote">
          <blockquote>${esc(t.quote)}</blockquote>
          <figcaption>— ${esc(t.author)}</figcaption>
        </figure>`).join('');
      stage.appendChild(wrap);
    }
  });

  function setTextIn(root, sel, val) { const el = root.querySelector(sel); if (el && val) el.textContent = val; }
  function formatPhone(p) {
    const d = String(p).replace(/\D/g, '');
    return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}` : p;
  }
  function reobserveReveals(root) {
    root.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('active');
      else revealObserver.observe(el);
    });
  }
})();

// Rebuild the hero slideshow after CMS slides replace the markup.
function rebuildHeroSlides() {
  const newSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const dotsWrap = document.getElementById('heroDots');
  if (!newSlides.length || !dotsWrap) return;
  slides.length = 0; newSlides.forEach(s => slides.push(s));
  dotsWrap.innerHTML = '';
  newSlides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'hero-dot interactive' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.onclick = () => { setSlide(i); restartSlideTimer(); };
    dotsWrap.appendChild(d);
  });
  heroDots.length = 0;
  Array.from(dotsWrap.children).forEach(d => heroDots.push(d));
  slideIdx = 0;
  restartSlideTimer();
}
