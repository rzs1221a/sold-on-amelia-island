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

## 2. Leads posting directly into BoldTrail CRM

**This is the chosen path — no API integration needed.** BHHS Connect
(kvCORE/BoldTrail) already gives every agent their own lead-capture email — in the
app under **Lead Engine Tools & Features → Web & IDX → Leads Sync**, switch the
"Agent" search field at top from your own name to **Kelly Marine**, copy her
`EMAIL` value, then repeat for **Will Henderson**. Send both addresses over.

Those two addresses go straight into Netlify's form notifications (`buyer-lead` →
Kelly's, `seller-lead` → Will's). Zero code, works the same day, and leads land in
BHHS Connect correctly assigned to the right agent — this isn't a workaround, it's
the real integration.

### Where it goes

Netlify dashboard only, no file changes: **Forms → (select `buyer-lead`) →
Settings & usage → add a notification → email → Kelly's address.** Repeat for
`seller-lead` → Will's address.

<details>
<summary>Later, if ever: a direct API integration</summary>

BHHS Connect also exposes a Zapier Key (for Zapier's pre-built BoldTrail "Create
Lead" action — no API docs needed) and a raw bearer API token (My API Tokens panel,
bottom-right of that same screen) for a closer, no-middleman integration. Both are
more setup than the email path above for no functional difference today, so this is
parked unless a real need shows up later (e.g. wanting lead data back out of
BoldTrail, or higher submission volume than email parsing handles comfortably).

If picked up later, the raw token alone isn't enough to build against — it
authenticates a request but doesn't say what the request looks like. Needed first:
the base API URL, the create-contact endpoint + method, the auth header format, an
example payload, and — the important one — whether agent assignment comes from
*whose login generated the token* (each agent would need their own) or from a field
like `agent_id` in the request body (in which case, ask BoldTrail support where to
find each agent's ID). `js/boldtrail.js` already has the `lead: { endpoint, apiKey,
agentIdField, agentIds }` block waiting for these values.

</details>

---

## 3. Optional: dedicated map URL

If BoldTrail has a distinct map-view URL (different from the search page), set:

```js
mapUrl: 'https://...'
```

and the "Open the Interactive Island Map" button will use it.
