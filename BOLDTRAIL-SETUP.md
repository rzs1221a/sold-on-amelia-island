# BoldTrail Setup — what to request, and where it plugs in

Two BoldTrail features are **built and waiting on credentials**. Nothing is broken
without them: the site currently links out to the working BoldTrail search page.
Once you have the values below, each is a copy-paste into `js/boldtrail.js`.

---

## 1. Live listings on the site (IDX)

### What to ask for

Send this to BoldTrail/kvCORE support (or check Will's BoldTrail admin under
**Settings → Web / Widgets / Marketing**):

> Hi — we run a BoldTrail site at `ameliaisland.heymannwilliams.com` for Berkshire
> Hathaway HomeServices Heymann Williams Realty. We've built an additional agent
> website for two of our agents (Kelly Marine and Will Henderson) and want to
> display live MLS listings on it.
>
> 1. Can you provide an embeddable listings/IDX widget (a `<script>` or `<iframe>`
>    snippet) we can place on an external site? If so, please send the snippet.
> 2. Does that widget support filtering — e.g. showing only oceanfront listings,
>    only a price range, or only our team's own listings?
> 3. Is the external domain required to be whitelisted for the widget to render?
>    Our domain is `soldonameliaisland.com`.
> 4. If an embeddable widget isn't available on our plan, what is required to get
>    an IDX feed for an external site (RETS/RESO Web API credentials, MLS
>    application, additional cost)?

### Where it goes

In `js/boldtrail.js`, fill **one** of these:

```js
embedHtml: '<script src="..."></script>',   // paste the snippet as-is
// or
iframeUrl: 'https://...',                    // if they give you a URL to embed
```

The widget replaces the three "browse by lifestyle" link cards automatically.
No other change needed.

### Note on "their own listings"

If Kelly & Will want **only their own listings** shown (rather than all island
inventory), ask BoldTrail specifically for a widget filtered to their agent IDs or
office. If they currently have no active listings, the widget may render empty —
in that case keep the lifestyle link cards, which always show live inventory.

---

## 2. Leads into BoldTrail CRM — Lead Dropbox (BUILT)

BoldTrail's Lead Dropbox is an **email parser**, not an API. Send a correctly
formatted plain-text email to an agent-scoped address and it creates a contact
owned by that agent (`Source: Email`, `Status: NEW LEAD`).

Implemented in **`netlify/functions/lead-submit.ts`**, exposed at **`/api/leads`**.

### The format is exact — and failure is silent

This is the part that cost hours of debugging. A malformed message is **discarded
with no bounce and no error**; the send still reports success. Netlify's default
form-notification email does *not* parse, which is why early tests vanished.

| Requirement | Value |
|---|---|
| Subject | exactly `Add Contact` — no prefix, suffix, or reply marker |
| Body | plain text only; an HTML wrapper breaks the line-based parse |
| Fields | one per line, `Field Name: value` |
| Extras | no signature, footer, tracking pixel, or quoted reply |

Known fields (**verify against the live account before trusting this list** —
Lead Engine → Lead Dropbox → Email Import Template; the public help article
renders incompletely, the in-account template wins):

```
First Name:  Last Name:  Email:  Phone:  Deal Type:  Seller Address:
```

Only these are sent. The questionnaire answers (budget, areas, timeline…) have no
matching parser field, so they are deliberately **excluded** from the dropbox
message — an unknown line risks silently voiding the whole lead. They're kept in
the durable log and reach the agent through the Netlify notification instead.

### Environment variables

Set in Netlify → Project configuration → Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `BOLDTRAIL_DROPBOX_EMAIL_BUYER` | Kelly's agent-scoped dropbox — buyer leads |
| `BOLDTRAIL_DROPBOX_EMAIL_SELLER` | Will's agent-scoped dropbox — seller leads |
| `RESEND_API_KEY` | Transport |
| `LEAD_FROM_EMAIL` | Verified sender, e.g. `leads@soldonameliaisland.com` |

**The dropbox addresses are unauthenticated write credentials.** Anyone holding one
can inject contacts into the live CRM — no sender check, no key, no signature.
Server-side env only; never in the client bundle, never committed. If one leaks,
rotate via Lead Engine → Lead Dropbox.

> Resend requires the sending domain to be verified (DNS records) before it will
> deliver to an outside address. Do that first or every send fails.

### Safeguards built in

- **Consent (TCPA)** — required, never pre-checked, blocks submit. The exact
  language shown, an ISO-8601 timestamp, and the source URL are stored with every
  submission. Nothing is sent unless consent is `true`.
- **Field-injection guard** — any value containing a line break is rejected
  outright. Without this, a newline could forge extra fields or a second contact.
- **Honeypot** — populated ⇒ HTTP 200 and silently dropped, so bots get no signal.
- **Rate limit** — 5 per IP per 10 minutes, backed by Netlify Blobs so it survives
  cold starts. Hashed IPs only. *Degrades open:* if Blobs isn't available the
  function logs `rate limit check failed` and allows the request — grep function
  logs for that string after deploy to confirm the limiter is actually live.
- **Traceability** — every submission is persisted to the `leads` blob store under
  a correlation ID with the exact payload and delivery result. Because the parser
  fails silently, a "sent" is never treated as proof of capture: if a contact is
  missing, look up its correlation ID to see exactly what was transmitted.

### Two independent paths (by design)

1. `/api/leads` → Lead Dropbox → creates the **CRM contact**
2. Netlify Forms → email notification → gives the **agent full questionnaire context**

They're deliberately decoupled: if the dropbox parse or the send fails, the lead
still reached the agent.

> **Action needed:** the `buyer-lead` / `seller-lead` Netlify notifications
> currently point at the kvCORE dropbox addresses, which never parsed. Repoint them
> to the agents' own inboxes (`KellyMarineRealtor@gmail.com`,
> `Will@HeymannWilliamsRealty.com`) so path 2 delivers the rich context while path 1
> handles the CRM.

---

## 3. Optional: dedicated map URL

If BoldTrail has a distinct map-view URL (different from the search page), set:

```js
mapUrl: 'https://...'
```

and the "Open the Interactive Island Map" button will use it.
