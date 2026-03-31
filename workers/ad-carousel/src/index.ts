export interface Env {
  ADS_BUCKET: R2Bucket;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (path.startsWith("/images/")) {
      return handleImage(path.slice("/images/".length), env);
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
