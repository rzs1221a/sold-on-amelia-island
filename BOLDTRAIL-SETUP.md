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
address you configure — including BoldTrail's lead-parser address. That path needs
no credentials.

**Direct API posting** is built and dormant. The key open question is agent
assignment, so ask this explicitly:

> We want to post leads from an external website directly into our BoldTrail CRM.
>
> 1. Do you offer a lead-capture API endpoint or webhook for this? Please provide
>    the endpoint URL, authentication method, and an example payload.
> 2. **How is an incoming lead assigned to a specific agent?** We have two agents
>    (Kelly Marine — buyers, Will Henderson — sellers) and need buyer leads to go to
>    Kelly and seller leads to Will. Specifically:
>    - Which field controls assignment (`agent_id`, `agent_email`, `user_id`, other)?
>    - Where do we find each agent's BoldTrail ID?
>    - Or is assignment controlled on your side by routing rules / round-robin,
>      in which case can rules be set per lead source or lead type?
> 3. Is there a lead-parser email address per agent as an alternative? If so,
>    please provide Kelly's and Will's.
> 4. Are there rate limits or IP whitelisting requirements?

### Where it goes

```js
lead: {
  endpoint: 'https://...',      // from their answer to #1
  apiKey:   '...',
  agentIdField: 'agent_id',     // whatever field they say controls assignment
  agentIds: { kelly: '...', will: '...' }
}
```

Leads then post to **both** Netlify (always) and BoldTrail (when configured), so a
failed API call can never lose a lead.

---

## 3. Optional: dedicated map URL

If BoldTrail has a distinct map-view URL (different from the search page), set:

```js
mapUrl: 'https://...'
```

and the "Open the Interactive Island Map" button will use it.
