import { buildCarouselHtml } from "./carousel-html";

export interface Env {
  ADS_BUCKET: R2Bucket;
}

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

    if (path.startsWith("/images/")) {
      return handleImage(path.slice("/images/".length), env);
    }

    if (path === "/api/shuffle" || path === "/api/ads") {
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

  const list = await env.ADS_BUCKET.list({ prefix: "ads/" });
  const keys = list.objects
    .map((obj) => obj.key)
    .filter((k) => k !== "ads/");

  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }

  const selected = keys.slice(0, Math.min(count, keys.length));
  const origin = new URL(requestUrl).origin;
  const ads = selected.map((key) => ({ key, url: `${origin}/images/${key}` }));

  return new Response(JSON.stringify({ ads }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
