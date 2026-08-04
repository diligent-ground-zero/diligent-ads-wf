import { buildCarouselHtml } from "./carousel-html";

export interface Env {
  ADS_BUCKET: R2Bucket;
}

// Public URL path segment for creative images. Kept separate from the R2
// key prefix below so the external URL never contains "ads" — generic
// ad-blocker filter lists (EasyList etc.) hide/block on that substring.
const IMAGE_URL_PREFIX = "creative";
// Internal R2 object key prefix (unchanged, existing bucket contents).
const R2_KEY_PREFIX = "ads";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }

    if (path === "/" || path === "/embed") {
      return new Response(buildCarouselHtml(url.origin), {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "X-Frame-Options": "ALLOWALL",
          "Content-Security-Policy": "frame-ancestors *",
          ...CORS_HEADERS,
        },
      });
    }

    if (path.startsWith(`/images/${IMAGE_URL_PREFIX}/`)) {
      const filename = path.slice(`/images/${IMAGE_URL_PREFIX}/`.length);
      return handleImage(`${R2_KEY_PREFIX}/${filename}`, env);
    }

    if (path === "/api/shuffle") {
      return handleShuffle(request.url, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleImage(key: string, env: Env): Promise<Response> {
  if (!key) {
    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  }
  const obj = await env.ADS_BUCKET.get(key);
  if (!obj) {
    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  }
  const contentType = obj.httpMetadata?.contentType ?? "image/png";
  return new Response(obj.body, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

async function handleShuffle(requestUrl: string, env: Env): Promise<Response> {
  const url = new URL(requestUrl);
  const count = Math.min(parseInt(url.searchParams.get("count") ?? "12"), 50);

  const list = await env.ADS_BUCKET.list({ prefix: `${R2_KEY_PREFIX}/` });
  const keys = list.objects
    .map((obj) => obj.key)
    .filter((k) => k !== `${R2_KEY_PREFIX}/`);

  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }

  const selected = keys.slice(0, Math.min(count, keys.length));
  const origin = new URL(requestUrl).origin;
  const ads = selected.map((key) => {
    const filename = key.slice(`${R2_KEY_PREFIX}/`.length);
    return { key, url: `${origin}/images/${IMAGE_URL_PREFIX}/${filename}` };
  });

  return new Response(JSON.stringify({ ads }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
