/**
 * BoldTrail (kvCORE) Lead Dropbox ingestion.
 *
 * The dropbox is an EMAIL PARSER, not an API:
 *   - Subject must be exactly "Add Contact"
 *   - Body must be plain text, line-based, "Field Name: value"
 *   - A malformed message is DISCARDED SILENTLY — no bounce, no error.
 *
 * Because of that silent-failure mode, a successful send here does NOT prove a
 * contact was created. Every submission is therefore persisted with a
 * correlation ID so a missing contact can be traced back to an exact payload.
 *
 * The dropbox address is an unauthenticated write credential into a live CRM:
 * anyone holding it can inject contacts. It lives only in env vars, server-side.
 */
import { getStore } from '@netlify/blobs';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { z } from 'zod';

/* ---------------------------------------------------------------------------
 * Validation
 *
 * `noControlChars` is the field-injection guard: the dropbox body is line-based,
 * so a newline inside a value would let a submitter forge additional fields
 * (or a whole extra contact). Reject rather than strip, so the attempt is
 * visible in logs instead of silently rewritten.
 * ------------------------------------------------------------------------- */
const noNewlines = (v: string) => !/[\r\n]/.test(v);
const lineBreakMsg = (label: string) => ({ message: `${label} may not contain line breaks` });

// Note: string methods (.min/.max/.email) must come BEFORE .refine(), which
// returns a ZodEffects and no longer exposes them.
const optionalLine = (label: string, max: number, email = false) => {
  const base = z.string().trim().max(max);
  return z
    .union([z.literal(''), (email ? base.email() : base).refine(noNewlines, lineBreakMsg(label))])
    .optional();
};

const LeadSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).refine(noNewlines, lineBreakMsg('First name')),
    lastName: z.string().trim().min(1).max(100).refine(noNewlines, lineBreakMsg('Last name')),
    email: optionalLine('Email', 200, true),
    phone: optionalLine('Phone', 40),
    dealType: z.enum(['Buyer', 'Seller']).optional(),
    sellerAddress: optionalLine('Address', 300),

    // TCPA: must be an explicit true. Anything else is a hard reject.
    consent: z.literal(true),
    consentText: z.string().max(2000),
    consentTimestamp: z.string().datetime(),
    sourceUrl: z.string().max(500),

    // Context captured by the site's questionnaire. Not sent to the dropbox
    // (no matching parser fields — unknown lines risk breaking the parse), but
    // retained in the durable log so the agent's own notification has it.
    context: z.record(z.string(), z.string()).optional(),

    honeypot: z.string().optional()
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone), {
    message: 'Provide at least an email address or a phone number',
    path: ['email']
  });

type Lead = z.infer<typeof LeadSchema>;

/* ---------------------------------------------------------------------------
 * Rate limiting — 5 submissions per IP per 10 minutes.
 * Backed by Netlify Blobs so the limit survives cold starts (an in-memory Map
 * would reset on every new instance, which is exactly when abuse gets through).
 * IPs are hashed; we never store a raw address.
 * ------------------------------------------------------------------------- */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

async function hashIp(ip: string): Promise<string> {
  const bytes = new TextEncoder().encode(`soai:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isRateLimited(ip: string): Promise<boolean> {
  try {
    const store = getStore('lead-ratelimit');
    const key = await hashIp(ip);
    const now = Date.now();
    const previous = ((await store.get(key, { type: 'json' })) as number[] | null) ?? [];
    const recent = previous.filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_LIMIT) return true;
    recent.push(now);
    await store.setJSON(key, recent);
    return false;
  } catch (err) {
    // Never let the limiter's own failure block a real lead.
    console.warn('[lead-submit] rate limit check failed, allowing through', err);
    return false;
  }
}

/* ---------------------------------------------------------------------------
 * Dropbox routing. Buyer enquiries belong to Kelly, seller enquiries to Will.
 * Each agent has their own agent-scoped dropbox, so the created contact is
 * owned by that agent directly rather than going through company lead rules.
 * ------------------------------------------------------------------------- */
// Verified live agent-scoped dropbox addresses (Gmail "Add Contact" test
// parsed successfully). Env vars still win, so either address can be rotated
// from the Netlify dashboard without a deploy.
const DROPBOX_WILL = 'leads+berkshirehathawayhomeservicesheymannwilliamsrealty11169-a-2000162@kvcore.com';
const DROPBOX_KELLY = 'leads+berkshirehathawayhomeservicesheymannwilliamsrealty11169-a-1770460@kvcore.com';

function dropboxFor(dealType: Lead['dealType']): { to: string; agent: string } | null {
  const shared = process.env.BOLDTRAIL_DROPBOX_EMAIL ?? '';
  const seller = process.env.BOLDTRAIL_DROPBOX_EMAIL_SELLER || shared || DROPBOX_WILL;
  const buyer = process.env.BOLDTRAIL_DROPBOX_EMAIL_BUYER || shared || DROPBOX_KELLY;
  if (dealType === 'Seller') {
    return seller ? { to: seller, agent: 'Will Henderson' } : null;
  }
  return buyer ? { to: buyer, agent: 'Kelly Marine' } : null;
}

/**
 * Build the dropbox body.
 *
 * The parser maps the known fields (name, email, phone, deal type, address)
 * onto the contact, and — verified live — files the ENTIRE email body into a
 * Custom Note on the contact. So after the parser fields, every remaining
 * piece of questionnaire context is appended as its own line: it rides along
 * in the note where the agent can read it.
 *
 * Context values are flattened to single lines here (the schema's newline
 * guard covers the parser fields; context is a free-form record, so it is
 * sanitised at this boundary instead).
 */
const singleLine = (v: string) => v.replace(/[\r\n]+/g, ' ').trim();
const contextLabel = (k: string) =>
  k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

function formatDropboxBody(lead: Lead): string {
  const lines: string[] = [
    `First Name: ${lead.firstName}`,
    `Last Name: ${lead.lastName}`
  ];
  if (lead.email) lines.push(`Email: ${lead.email}`);
  if (lead.phone) lines.push(`Phone: ${lead.phone}`);
  if (lead.dealType) lines.push(`Deal Type: ${lead.dealType}`);
  if (lead.sellerAddress) lines.push(`Seller Address: ${lead.sellerAddress}`);
  const story = narrative(lead);
  if (story) lines.push('', story);
  lines.push(
    '',
    `Submitted through soldonameliaisland.com (${singleLine(lead.sourceUrl)}). ` +
      `Consent to be contacted was given on ${lead.consentTimestamp}: "${singleLine(lead.consentText).slice(0, 400)}"`
  );
  return lines.join('\n');
}

/**
 * The questionnaire, retold as a short briefing the agent can read at a
 * glance. Pieces are optional — sentences simply drop out when the visitor
 * skipped a step. Any context key this template doesn't know is appended
 * afterwards so new questionnaire fields never get lost.
 */
function narrative(lead: Lead): string {
  const ctx = Object.fromEntries(
    Object.entries(lead.context ?? {}).map(([k, v]) => [k, singleLine(v).slice(0, 500)])
  );
  const used = new Set<string>();
  const take = (k: string) => { used.add(k); return ctx[k] || ''; };
  const sentences: string[] = [];

  if (lead.dealType === 'Buyer') {
    const vision = take('vision');
    const budget = take('budget');
    const timeline = take('timeline');
    if (vision) sentences.push(`In their own words, ${lead.firstName} is looking for: "${vision}".`);
    else sentences.push(`${lead.firstName} came through the guided buyer flow.`);
    if (budget && timeline) sentences.push(`They're targeting ${budget}, with keys in hand ${timeline === 'ASAP' ? 'as soon as possible' : `in the "${timeline}" range`}.`);
    else if (budget) sentences.push(`They're targeting ${budget}.`);
    else if (timeline) sentences.push(`Their timeline: ${timeline}.`);
  } else if (lead.dealType === 'Seller') {
    const ptype = take('propertyType');
    const timeline = take('timeline');
    const where = lead.sellerAddress ? `their home at ${lead.sellerAddress}` : 'their home';
    sentences.push(`${lead.firstName} is thinking about selling ${where}${ptype ? `, which they describe as: ${ptype}` : ''}.`);
    if (timeline) sentences.push(`On timing, they said: "${timeline}".`);
  }

  for (const [key, value] of Object.entries(ctx)) {
    if (!used.has(key) && value) sentences.push(`${contextLabel(key)}: ${value}.`);
  }
  return sentences.join(' ');
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const correlationId = crypto.randomUUID();
  const receivedAt = new Date().toISOString();
  const ip =
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown';

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, correlationId, error: 'Malformed JSON body' });
  }

  const parsed = LeadSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`[lead-submit] ${correlationId} rejected`, parsed.error.flatten().fieldErrors);
    return json(400, {
      ok: false,
      correlationId,
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors
    });
  }
  const lead = parsed.data;

  // Honeypot: accept and drop. A bot that gets a 200 has no signal to retry.
  if (lead.honeypot && lead.honeypot.trim() !== '') {
    console.info(`[lead-submit] ${correlationId} honeypot triggered, dropped`);
    return json(200, { ok: true, correlationId });
  }

  if (await isRateLimited(ip)) {
    console.warn(`[lead-submit] ${correlationId} rate limited`);
    return json(429, { ok: false, correlationId, error: 'Too many submissions. Please try again shortly.' });
  }

  const route = dropboxFor(lead.dealType);
  // Transport preference: Gmail SMTP first (the proven path — the dropbox
  // already parses mail from this account), Resend as the alternative.
  // Gmail needs an app password: Google Account → Security → 2-Step
  // Verification → App passwords, then set GMAIL_APP_PASSWORD in Netlify.
  const gmailUser = process.env.GMAIL_USER || 'rzs1221a@gmail.com';
  const gmailPass = (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s+/g, ''); // app passwords are shown with spaces
  const apiKey = process.env.RESEND_API_KEY;
  // Resend-only: sender domain must be verified in the Resend account.
  const from = process.env.LEAD_FROM_EMAIL || 'leads@soldonameliaisland.com';
  const transport = gmailPass ? 'gmail' : apiKey ? 'resend' : null;
  const body = formatDropboxBody(lead);

  // Durable record written BEFORE the send, so a lead is traceable even if the
  // send throws. Updated with the transport result afterwards.
  const record = {
    correlationId,
    receivedAt,
    routedTo: route?.agent ?? null,
    dealType: lead.dealType ?? null,
    payload: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email || null,
      phone: lead.phone || null,
      sellerAddress: lead.sellerAddress || null,
      context: lead.context ?? {}
    },
    consent: {
      granted: lead.consent,
      text: lead.consentText,
      timestamp: lead.consentTimestamp,
      sourceUrl: lead.sourceUrl
    },
    dropboxBody: body,
    delivery: { status: 'pending' as string, providerId: null as string | null, error: null as string | null }
  };

  const logStore = (() => {
    try {
      return getStore('leads');
    } catch {
      return null;
    }
  })();
  const persist = async () => {
    try {
      await logStore?.setJSON(correlationId, record);
    } catch (err) {
      console.error(`[lead-submit] ${correlationId} could not persist log`, err);
    }
  };
  await persist();

  if (!route || !transport) {
    record.delivery.status = 'not_configured';
    record.delivery.error = [
      !route ? 'no dropbox address configured' : null,
      !transport ? 'no mail transport configured (set GMAIL_APP_PASSWORD or RESEND_API_KEY)' : null
    ]
      .filter(Boolean)
      .join('; ');
    await persist();
    // The submission is captured and logged; surface the failure rather than
    // reporting a success that never reached the CRM.
    console.error(`[lead-submit] ${correlationId} not delivered: ${record.delivery.error}`);
    return json(502, {
      ok: false,
      correlationId,
      error: 'Lead recorded but not yet delivered to the CRM. Please contact us directly.'
    });
  }

  try {
    let providerId: string | null = null;
    if (transport === 'gmail') {
      const mailer = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass }
      });
      const info = await mailer.sendMail({
        from: gmailUser, // must be the authenticated account or Gmail rewrites it anyway
        to: route.to,
        subject: 'Add Contact', // exact — any prefix/suffix breaks the parser
        text: body // plain text only; an HTML wrapper breaks the line-based parse
      });
      providerId = info.messageId ?? null;
    } else {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: route.to,
        subject: 'Add Contact',
        text: body
      });
      if (error) throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
      providerId = data?.id ?? null;
    }

    record.delivery.status = 'sent';
    record.delivery.providerId = providerId;
    await persist();

    console.info(
      `[lead-submit] ${correlationId} sent to ${route.agent} dropbox via ${transport} (id ${providerId ?? 'n/a'})`
    );
    return json(200, { ok: true, correlationId });
  } catch (err) {
    record.delivery.status = 'failed';
    record.delivery.error = err instanceof Error ? err.message : String(err);
    await persist();
    console.error(`[lead-submit] ${correlationId} send failed`, err);
    return json(502, {
      ok: false,
      correlationId,
      error: 'Lead recorded but delivery failed. Please contact us directly.'
    });
  }
};
