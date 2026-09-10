/**
 * Keep the BoldTrail IDX proxies (/details/*, /search/*, /property/*) working
 * for humans while removing them from the index.
 *
 * Why an edge function and not a [[headers]] block in netlify.toml: Netlify
 * custom headers "apply only to files Netlify serves from our own backing
 * store" — they are NOT applied to proxied content (the status-200 rewrites
 * to ameliaisland.heymannwilliams.com in netlify.toml). Edge functions run
 * before redirect rules, so this one performs the same proxy itself: same
 * upstream host, same path, method, headers and body forwarded, upstream
 * redirects passed through untouched — then stamps X-Robots-Tag on the reply.
 * The netlify.toml rewrites stay in place as the fallback if this function
 * ever fails to fetch upstream (context.next() hands the request back to them).
 *
 * Verify after deploy:
 *   curl -sI https://soldonameliaisland.com/search/ | grep -i x-robots-tag
 *
 * Only once that header is confirmed live should robots.txt gain Disallow
 * lines for these paths — a Disallow alone would stop Google re-crawling the
 * already-indexed URLs and so stop it ever seeing the noindex.
 */
import type { Config, Context } from "@netlify/edge-functions";

const UPSTREAM_HOST = "ameliaisland.heymannwilliams.com";
const ROBOTS = "noindex, follow";

export default async (request: Request, context: Context) => {
  const upstream = new URL(request.url);
  upstream.protocol = "https:";
  upstream.host = UPSTREAM_HOST;

  const headers = new Headers(request.headers);
  headers.delete("host");

  let response: Response;
  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const fetched = await fetch(upstream.toString(), {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
    });
    // Response headers from fetch() are immutable; copy so we can add ours.
    response = new Response(fetched.body, fetched);
  } catch (err) {
    console.error("[idx-noindex] upstream fetch failed, falling back to rewrite", err);
    response = await context.next();
  }

  response.headers.set("X-Robots-Tag", ROBOTS);
  return response;
};

export const config: Config = {
  path: ["/details/*", "/search/*", "/property/*"],
};
