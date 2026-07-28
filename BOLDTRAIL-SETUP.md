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

**Already working today:** leads submit to Netlify Forms, which emails them to any
address you configure. **BHHS Connect (kvCORE/BoldTrail) already gives every agent
their own lead-capture email** — in the app under **Lead Engine Tools & Features →
Web & IDX → Leads Sync**, switch the "Agent" search field at top from your own name
to **Kelly Marine**, copy her `EMAIL` value, then repeat for **Will Henderson**.
Those two addresses go straight into Netlify's form notifications (`buyer-lead` →
Kelly's, `seller-lead` → Will's) — zero code, works the same day. Do this regardless
of the API work below; it's not a fallback, it's a real, correctly-assigned path.

**Decision: building the direct API path** (chosen over Zapier). This is more work
because, unlike the Zapier Key on that same screen — which plugs into Zapier's own
pre-built BoldTrail "Create Lead" action and doesn't require knowing BoldTrail's
private request format — a raw bearer token only authenticates a request. It doesn't
tell me the endpoint URL or the shape of the JSON body, and guessing wrong there
means leads could silently fail or land unassigned. So before this can be wired,
I need the **actual API reference**, not just a token.

### What to get (send all of these, not just the token)

1. **API documentation.** BHHS Connect's Lead Engine screen doesn't show a base URL
   or endpoint list, so this needs to come from kvCORE/BoldTrail support or their
   developer docs. Ask support directly:

   > We generated an API token from BHHS Connect → Lead Engine Tools & Features →
   > Web & IDX → Leads Sync ("My API Tokens", scope: Contacts, Users). We want to
   > use it to create a Contact/Lead from an external website form submission.
   > Please send: the base API URL, the endpoint + HTTP method for creating a
   > contact, the required auth header format, and an example request/response.

2. **How agent assignment actually works with this token.** Two real possibilities,
   and the answer changes what I build:
   - The token is tied to whichever person is logged in when it's generated — if
     so, Kelly and Will each need to log into their **own** BHHS Connect account
     and generate their **own** token from their own "My API Tokens" panel.
   - The token is account/office-wide, and a field in the request body (e.g.
     `agent_id`, `owner_id`, `user_id`) assigns the lead to a specific person — if
     so, ask support how to find Kelly's and Will's IDs for that field.

   You can partly test this yourself: switch the "Agent" selector at the top of
   that page from your name to Kelly's, and check whether the **"My API Tokens"**
   panel at bottom-right changes too, or stays the same. If it doesn't change,
   that panel is almost certainly tied to your login, not to whichever agent is
   selected above it — which points to the first bullet above.

3. **A fresh, dedicated token.** Generate a new one now (Contacts + Users scope,
   the checkboxes are already there) specifically for this website, rather than
   reusing an existing one shared with other tools — it can then be revoked
   independently if this integration is ever retired. Note the expiration date
   shown next to it; these tokens aren't permanent.

### Where it goes

```js
lead: {
  endpoint: 'https://...',      // base URL + path, from support's answer
  apiKey:   '...',              // the fresh token from step 3
  agentIdField: 'agent_id',     // whatever field controls assignment, from step 2
  agentIds: { kelly: '...', will: '...' }   // only needed if assignment is by ID field
}
```

Once endpoint + payload shape + assignment method are confirmed, leads will post to
**both** Netlify (always) and BoldTrail (via this API), so a failed API call can
never lose a lead — the email/Netlify path stays as the permanent safety net.

---

## 3. Optional: dedicated map URL

If BoldTrail has a distinct map-view URL (different from the search page), set:

```js
mapUrl: 'https://...'
```

and the "Open the Interactive Island Map" button will use it.
