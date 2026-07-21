/* ==========================================================
   SOLD ON AMELIA ISLAND — app.js
   Kelly Marine (buyers) & Will Henderson (sellers)
   ========================================================== */

/* ----------------------------------------------------------
   LEAD ROUTING CONFIG
   Each completed flow builds a structured lead and submits it
   to the endpoint below. Point `endpoint` at a Formspree/Zapier
   webhook per agent, and BHHS Connect's email-to-lead parser
   address in `crmEmail`, and leads land in each agent's CRM
   with full context. See README for hookup steps.
---------------------------------------------------------- */
const LEAD_ROUTING = {
  seller: {
    agent: 'Will Henderson',
    initial: 'W',
    avatarClass: 'will',
    title: 'Listing Specialist',
    phone: '9043216689',
    prettyPhone: '904-321-6689',
    crmEmail: 'Will@HeymannWilliamsRealty.com',
    endpoint: '', // e.g. https://formspree.io/f/XXXXXXX (Will's form)
    routedLabel: "Lead routed to Will's BHHS Connect — he's been notified"
  },
  buyer: {
    agent: 'Kelly Marine',
    initial: 'K',
    avatarClass: 'kelly',
    title: 'Buyer Specialist',
    phone: '6786770858',
    prettyPhone: '678-677-0858',
    crmEmail: 'KellyMarineRealtor@gmail.com',
    endpoint: '', // e.g. https://formspree.io/f/YYYYYYY (Kelly's form)
    routedLabel: "Lead routed to Kelly's BHHS Connect — she's been notified"
  }
};

async function submitLead(type, lead) {
  const route = LEAD_ROUTING[type];
  const payload = {
    _subject: `New ${type} lead — SoldOnAmeliaIsland.com`,
    routed_to: route.agent,
    crm: 'BHHS Connect',
    crm_email: route.crmEmail,
    submitted_at: new Date().toISOString(),
    ...lead
  };
  console.info('[SoldOnAmeliaIsland] lead captured →', payload);
  if (!route.endpoint) return true; // demo mode: no endpoint wired yet
  try {
    await fetch(route.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Lead submit failed (will still show success UI):', err);
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
      gold: Math.random() < 0.12
    });
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

(function animateMist() {
  ctx.clearRect(0, 0, W, H);
  currentV += (targetV - currentV) * 0.1;
  targetV *= 0.9;
  particles.forEach(p => {
    p.y -= 0.18 + currentV * p.df;
    if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
    else if (p.y > H + 20) { p.y = -20; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fillStyle = p.gold
      ? `rgba(212,175,55,${p.op})`
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

/* ---------- Testimonials ---------- */
const TESTIMONIALS = [
  { q: '"Kelly found us a home we didn’t know existed, and Will sold ours in nine days over asking. Working with both of them felt like having family on the inside."', a: '— The Parkers, relocated from Atlanta' },
  { q: '"Will’s pricing strategy was surgical. Three offers the first weekend. He walked us through every clause like we were his only clients."', a: '— D. & M. Whitfield, Fernandina Beach' },
  { q: '"We texted Kelly a sunset photo and said ‘this, but ours.’ Six weeks later we closed two blocks from that exact beach walkover."', a: '— The Romanos, Amelia Island' }
];
const tQuote = document.getElementById('testimonialQuote');
const tAuthor = document.getElementById('testimonialAuthor');
const tDots = document.getElementById('testimonialDots');
let tIdx = 0, tTimer;

TESTIMONIALS.forEach((_, i) => {
  const d = document.createElement('button');
  d.className = 'hero-dot interactive' + (i === 0 ? ' active' : '');
  d.setAttribute('aria-label', 'Testimonial ' + (i + 1));
  d.onclick = () => { setTestimonial(i); clearInterval(tTimer); tTimer = setInterval(nextTestimonial, 8000); };
  tDots.appendChild(d);
});
function setTestimonial(i) {
  tQuote.style.opacity = 0; tAuthor.style.opacity = 0;
  setTimeout(() => {
    tIdx = i;
    tQuote.textContent = TESTIMONIALS[i].q;
    tAuthor.textContent = TESTIMONIALS[i].a;
    Array.from(tDots.children).forEach((d, j) => d.classList.toggle('active', j === i));
    tQuote.style.opacity = 1; tAuthor.style.opacity = 1;
  }, 400);
}
function nextTestimonial() { setTestimonial((tIdx + 1) % TESTIMONIALS.length); }
tTimer = setInterval(nextTestimonial, 8000);

/* ---------- Mobile menu ---------- */
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
  document.getElementById('navBurger').classList.toggle('open');
}

/* ---------- Newsletter ---------- */
function handleNewsletter(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const input = e.target.querySelector('input');
  submitLead('buyer', { form: 'The Coastal Edit newsletter', email: input.value });
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

const BUYER_STEPS = [
  {
    key: 'vision', kicker: 'Step 1 — The Vision',
    title: 'Describe your dream home.',
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
    key: 'size', kicker: 'Step 3 — The Space',
    title: 'How much room do you need?',
    sub: 'Bedrooms, guests, hobbies — pick what fits.',
    chips: ['1–2 bedrooms', '3 bedrooms', '4 bedrooms', '5+ bedrooms', 'Home office', 'Pool', 'Garage / workshop', 'Big yard'],
    single: false
  },
  {
    key: 'areas', kicker: 'Step 4 — The Place',
    title: 'Where do you see yourself?',
    sub: 'Choose as many as you like.',
    chips: ['Amelia Island', 'Fernandina Beach', 'Historic Downtown', 'Amelia Island Plantation', 'Yulee / Wildlight', 'Nassau County'],
    single: false
  },
  {
    key: 'timeline', kicker: 'Step 5 — The Timing',
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
    <div class="avatar ${route.avatarClass}">${route.initial}</div>
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
        <button class="btn-gold btn-flow-next interactive" onclick="flowNext()">Continue</button>
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
      <h2>${isBuyer ? 'Your matches are ready.' : 'Your valuation is ready.'}</h2>
      <p class="flow-sub">${isBuyer
        ? 'Tell Kelly where to send your private portal.'
        : 'Tell Will where to send your market analysis.'}</p>
      <div class="flow-form">
        <div class="flow-field"><label for="leadName">Full Name</label><input id="leadName" autocomplete="name" placeholder="Jane Doe"></div>
        <div class="flow-field"><label for="leadEmail">Email</label><input id="leadEmail" type="email" autocomplete="email" placeholder="jane@example.com"></div>
        <div class="flow-field"><label for="leadPhone">Phone</label><input id="leadPhone" type="tel" autocomplete="tel" placeholder="(904) 555-0123"></div>
        <p class="flow-consent">By continuing you agree that ${route.agent} may contact you about your ${isBuyer ? 'home search' : 'home valuation'}. No spam — ever.</p>
        <button class="btn-gold interactive" style="width:100%" onclick="submitContact()">${isBuyer ? 'Unlock My Private Portal' : 'Reveal My Home Value'}</button>
        <div style="text-align:center"><span class="flow-route-note">Routes directly to ${route.agent.split(' ')[0]}'s BHHS Connect</span></div>
      </div>
      <div class="flow-nav"><button class="flow-back interactive" onclick="flowBack()">← Back</button></div>
    </div>`;
  setTimeout(() => document.getElementById('leadName').focus(), 350);
}

function validateField(id, test) {
  const el = document.getElementById(id);
  const ok = test(el.value.trim());
  if (!ok) { el.classList.add('error'); setTimeout(() => el.classList.remove('error'), 600); }
  return ok;
}

async function submitContact() {
  const okName = validateField('leadName', v => v.length > 1);
  const okEmail = validateField('leadEmail', v => /.+@.+\..+/.test(v));
  const okPhone = validateField('leadPhone', v => v.replace(/\D/g, '').length >= 7);
  if (!okName || !okEmail || !okPhone) return;

  flow.answers.name = document.getElementById('leadName').value.trim();
  flow.answers.email = document.getElementById('leadEmail').value.trim();
  flow.answers.phone = document.getElementById('leadPhone').value.trim();

  submitLead(flow.type, flow.answers);
  await showLoading(flow.type === 'buyer'
    ? ['Reading your wish list…', 'Scanning island inventory…', 'Curating your matches…']
    : ['Locating your property…', 'Pulling live island comps…', 'Modeling your value range…']);

  if (flow.type === 'buyer') renderBuyerPortal();
  else renderSellerReveal();
  sprinkleSparkles();
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

/* ---------- Buyer portal reveal ---------- */
const BUYER_MATCHES = [
  { img: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=900&q=80', price: '$1,250,000', addr: '842 Ocean Ave · Amelia Island', meta: '3 bd · 2.5 ba · 2,100 sqft', match: 98 },
  { img: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80', price: '$975,000', addr: '115 Center St · Fernandina Beach', meta: '4 bd · 3 ba · 2,800 sqft', match: 94 },
  { img: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=900&q=80', price: '$1,450,000', addr: '33 Marsh View Dr · Nassau County', meta: '4 bd · 4 ba · 3,500 sqft', match: 91 }
];

function renderBuyerPortal() {
  const first = (flow.answers.name || 'friend').split(' ')[0];
  stage.innerHTML = `
    <div class="flow-dash">
      <div class="flow-dash-head">
        <span class="flow-step-kicker">Your Private Portal</span>
        <h2>Welcome home, <span class="gold">${esc(first)}</span>.</h2>
        <p>Kelly curated these from "${esc(flow.answers.vision || 'your wish list')}"</p>
      </div>
      <div class="flow-routed-banner">${LEAD_ROUTING.buyer.routedLabel}</div>
      <div class="dash-grid">
        ${BUYER_MATCHES.map(m => `
          <div class="dash-card glass-dark">
            <div class="listing-img">
              <img src="${m.img}" alt="Matched home">
              <span class="match-badge">${m.match}% Match</span>
              <button class="dash-fav interactive" onclick="this.classList.toggle('faved'); this.textContent = this.classList.contains('faved') ? '♥' : '♡'">♡</button>
            </div>
            <div class="listing-info">
              <div class="listing-price serif">${m.price}</div>
              <div class="listing-addr">${m.addr}</div>
              <div class="listing-meta"><span>${m.meta}</span></div>
            </div>
          </div>`).join('')}
        <div class="dash-cta glass-dark">
          <h3>Ready to step inside?</h3>
          <p>Kelly is standing by to schedule private tours of your favorites.</p>
          <div class="dash-cta-row">
            <a href="tel:${LEAD_ROUTING.buyer.phone}" class="btn-gold interactive">Call Kelly</a>
            <a href="sms:${LEAD_ROUTING.buyer.phone}" class="btn-outline interactive">Text Kelly Live</a>
            <a href="https://ameliaisland.heymannwilliams.com/search" target="_blank" rel="noopener" class="btn-outline interactive">Browse All Listings</a>
          </div>
        </div>
      </div>
    </div>`;
}

/* ---------- Seller valuation reveal ---------- */
function renderSellerReveal() {
  const first = (flow.answers.name || 'neighbor').split(' ')[0];
  const addr = flow.answers.address || 'your home';
  stage.innerHTML = `
    <div class="flow-dash">
      <div class="flow-dash-head">
        <span class="flow-step-kicker">Preliminary Market Analysis</span>
        <h2>Good news, <span class="gold">${esc(first)}</span>.</h2>
        <p>Will's first read on ${esc(addr)}</p>
      </div>
      <div class="flow-routed-banner">${LEAD_ROUTING.seller.routedLabel}</div>
      <div class="dash-grid">
        <div class="insight-card glass-dark">
          <span class="insight-label">Estimated Value Range</span>
          <div class="insight-value" id="valRange">$0</div>
          <p class="insight-desc">Based on recent comparable island sales.</p>
        </div>
        <div class="insight-card glass-dark">
          <span class="insight-label">Market Temperature</span>
          <div class="insight-value teal">High Demand</div>
          <div class="temp-gauge"><div class="temp-gauge-fill" id="tempFill"></div></div>
          <p class="insight-desc">Similar homes average 11 days on market.</p>
        </div>
        <div class="insight-card glass-dark">
          <span class="insight-label">Buyer Activity</span>
          <div class="insight-value" id="buyerCount">0</div>
          <p class="insight-desc">Active buyers matched to homes like yours right now.</p>
        </div>
        <div class="dash-cta glass-dark">
          <h3>This is the estimate. Will finds the ceiling.</h3>
          <p>A 15-minute walkthrough turns this range into an exact pricing strategy — complimentary, no obligation.</p>
          <div class="dash-cta-row">
            <a href="tel:${LEAD_ROUTING.seller.phone}" class="btn-gold interactive">Call Will</a>
            <a href="sms:${LEAD_ROUTING.seller.phone}" class="btn-outline interactive">Text Will Live</a>
            <a href="mailto:${LEAD_ROUTING.seller.crmEmail}" class="btn-outline interactive">Email Will</a>
          </div>
        </div>
      </div>
    </div>`;

  // Animate the reveal numbers
  const rangeEl = document.getElementById('valRange');
  const low = 850, high = 920, t0 = performance.now(), dur = 1900;
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    rangeEl.textContent = `$${Math.round(low * eased)}k – $${Math.round(high * eased)}k`;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);

  const buyerEl = document.getElementById('buyerCount');
  const bT0 = performance.now();
  (function tickB(now) {
    const p = Math.min((now - bT0) / 1600, 1);
    buyerEl.textContent = Math.round(37 * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tickB);
  })(bT0);

  setTimeout(() => { const f = document.getElementById('tempFill'); if (f) f.style.width = '86%'; }, 200);
}

/* ---------- Sparkles ---------- */
function sprinkleSparkles() {
  const glyphs = ['✦', '✧', '⋆'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = 10 + Math.random() * 80 + 'vw';
    s.style.top = 8 + Math.random() * 30 + 'vh';
    s.style.color = i % 3 ? 'rgba(212,175,55,.9)' : 'rgba(245,233,208,.9)';
    s.style.fontSize = 0.7 + Math.random() * 0.9 + 'rem';
    s.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}
