# Ad Carousel Worker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Cloudflare Worker that serves an embeddable GSAP infinite ad carousel (iframe) backed by R2, with a shuffle API endpoint — all living as a subrepo under `workers/ad-carousel/`.

**Architecture:** A single Cloudflare Worker handles all routes: `/embed` serves the full carousel HTML (for Webflow iframe embed), `/images/:key` proxies R2 ad images, and `/api/shuffle` returns a randomly shuffled JSON list of ad URLs. A minimal Vue 3/Vite preview app at `workers/ad-carousel/preview/` wraps the iframe for local development testing.

**Tech Stack:** TypeScript, Cloudflare Workers (Wrangler v3), R2 bucket `diligent-studios-ads` (objects at `ads/ad_concept_1.png`…), GSAP 3 + CustomEase (CDN), Vue 3 + Vite (preview app only), Vitest + `@cloudflare/vitest-pool-workers` (tests)

**Cloudflare Account:** `a29d3efe368a2277bc6e2bb69922eefb` (Niko@diligentstudios.com)

---

## Directory Structure

```
workers/ad-carousel/
├── src/
│   ├── index.ts          ← Worker entry point (router)
│   └── carousel-html.ts  ← GSAP carousel HTML template
├── preview/              ← Vue 3 preview app
│   ├── src/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── src/index.test.ts     ← Worker integration tests
├── vitest.config.ts
├── package.json
├── wrangler.toml
└── tsconfig.json
```

---

### Task 1: Scaffold Worker Project

**Files:**
- Create: `workers/ad-carousel/package.json`
- Create: `workers/ad-carousel/wrangler.toml`
- Create: `workers/ad-carousel/tsconfig.json`
- Create: `workers/ad-carousel/src/index.ts`

**Step 1: Create directory**

```bash
mkdir -p workers/ad-carousel/src
```

**Step 2: Create `workers/ad-carousel/package.json`**

```json
{
  "name": "ad-carousel-worker",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.0",
    "@cloudflare/workers-types": "^4.20240924.0",
    "typescript": "^5.5.4",
    "vitest": "^1.5.0",
    "wrangler": "^3.80.0"
  }
}
```

**Step 3: Create `workers/ad-carousel/wrangler.toml`**

```toml
name = "diligent-studios-ad-carousel"
main = "src/index.ts"
compatibility_date = "2024-09-23"

[[r2_buckets]]
binding = "ADS_BUCKET"
bucket_name = "diligent-studios-ads"

[dev]
port = 8787
```

**Step 4: Create `workers/ad-carousel/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

**Step 5: Create stub `workers/ad-carousel/src/index.ts`**

```typescript
export interface Env {
  ADS_BUCKET: R2Bucket;
}

export default {
  async fetch(_request: Request, _env: Env): Promise<Response> {
    return new Response("OK");
  },
};
```

**Step 6: Install dependencies**

```bash
cd workers/ad-carousel && npm install
```

**Step 7: Verify it builds**

```bash
cd workers/ad-carousel && npx wrangler deploy --dry-run
```
Expected: build succeeds, no TypeScript errors.

**Step 8: Commit**

```bash
git add workers/ad-carousel/
git commit -m "feat: scaffold ad-carousel worker"
```

---

### Task 2: R2 Image Proxy Route

**Files:**
- Create: `workers/ad-carousel/vitest.config.ts`
- Create: `workers/ad-carousel/src/index.test.ts`
- Modify: `workers/ad-carousel/src/index.ts`

**Step 1: Create `workers/ad-carousel/vitest.config.ts`**

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
  },
});
```

**Step 2: Write the failing test — create `workers/ad-carousel/src/index.test.ts`**

```typescript
import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Image proxy", () => {
  it("returns 404 for non-existent image", async () => {
    const res = await SELF.fetch("http://example.com/images/ads/nonexistent.png");
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await SELF.fetch("http://example.com/unknown");
    expect(res.status).toBe(404);
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd workers/ad-carousel && npm test
```
Expected: FAIL — image route returns 200 "OK" instead of 404.

**Step 4: Implement image proxy + CORS in `src/index.ts`**

```typescript
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
```

**Step 5: Run tests**

```bash
cd workers/ad-carousel && npm test
```
Expected: PASS

**Step 6: Commit**

```bash
git add workers/ad-carousel/src/ workers/ad-carousel/vitest.config.ts
git commit -m "feat: add R2 image proxy route"
```

---

### Task 3: Shuffle API Endpoint

**Files:**
- Modify: `workers/ad-carousel/src/index.ts`
- Modify: `workers/ad-carousel/src/index.test.ts`

**Step 1: Write the failing test — add to `src/index.test.ts`**

```typescript
describe("Shuffle API", () => {
  it("returns JSON with ads array", async () => {
    const res = await SELF.fetch("http://example.com/api/shuffle");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const data = await res.json<{ ads: Array<{ key: string; url: string }> }>();
    expect(Array.isArray(data.ads)).toBe(true);
  });

  it("responds to /api/ads as well", async () => {
    const res = await SELF.fetch("http://example.com/api/ads");
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run to verify it fails**

```bash
cd workers/ad-carousel && npm test
```
Expected: FAIL — shuffle route returns 404.

**Step 3: Add shuffle route to `src/index.ts`**

Inside the `fetch` handler, add before the final 404:
```typescript
if (path === "/api/shuffle" || path === "/api/ads") {
  return handleShuffle(request.url, env);
}
```

Add the handler function:
```typescript
async function handleShuffle(requestUrl: string, env: Env): Promise<Response> {
  const url = new URL(requestUrl);
  const count = Math.min(parseInt(url.searchParams.get("count") ?? "12"), 50);

  const list = await env.ADS_BUCKET.list({ prefix: "ads/" });
  const keys = list.objects
    .map((obj) => obj.key)
    .filter((k) => k !== "ads/"); // exclude any directory placeholder

  // Fisher-Yates shuffle
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }

  const selected = keys.slice(0, Math.min(count, keys.length));
  const origin = new URL(requestUrl).origin;

  const ads = selected.map((key) => ({
    key,
    url: `${origin}/images/${key}`,
  }));

  return new Response(JSON.stringify({ ads }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
```

**Step 4: Run tests**

```bash
cd workers/ad-carousel && npm test
```
Expected: all PASS (R2 list returns empty array in test env — that's fine, we assert `Array.isArray`).

**Step 5: Commit**

```bash
git add workers/ad-carousel/src/
git commit -m "feat: add shuffle API endpoint"
```

---

### Task 4: GSAP Carousel HTML Template

**Files:**
- Create: `workers/ad-carousel/src/carousel-html.ts`

**Step 1: Create `workers/ad-carousel/src/carousel-html.ts`**

```typescript
export function buildCarouselHtml(workerOrigin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ad Carousel</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #080808;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .carousel-wrapper {
      width: 100%;
      position: relative;
      overflow: hidden;
      padding: 28px 0;
      /* Fade edges */
      mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    }

    .carousel-track {
      display: flex;
      gap: 20px;
      will-change: transform;
    }

    .ad-card {
      flex-shrink: 0;
      width: 300px;
      height: 188px;
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      background: #181818;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.8);
    }

    .ad-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transform: scale(1.04);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .ad-card img.loaded {
      opacity: 1;
      transform: scale(1);
    }

    .ad-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.07);
      pointer-events: none;
    }

    .controls {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shuffle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 100px;
      color: rgba(255,255,255,0.65);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      user-select: none;
    }

    .shuffle-btn:hover {
      background: rgba(255,255,255,0.09);
      border-color: rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.9);
    }

    .shuffle-btn:active {
      transform: scale(0.97);
    }

    .shuffle-btn.loading {
      pointer-events: none;
      opacity: 0.6;
    }

    .shuffle-btn svg {
      width: 13px;
      height: 13px;
    }

    .shuffle-btn.loading svg {
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="carousel-wrapper">
    <div class="carousel-track" id="track"></div>
  </div>
  <div class="controls">
    <button class="shuffle-btn" id="shuffleBtn" aria-label="Shuffle ads">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 3 21 3 21 8"></polyline>
        <line x1="4" y1="20" x2="21" y2="3"></line>
        <polyline points="21 16 21 21 16 21"></polyline>
        <line x1="15" y1="15" x2="21" y2="21"></line>
      </svg>
      Shuffle
    </button>
  </div>

  <script>
    gsap.registerPlugin(CustomEase);

    // Custom ease: glide with slight organic pull
    CustomEase.create("glide", "M0,0 C0.11,0 0.16,0.36 0.21,0.5 0.28,0.68 0.34,0.87 0.4,0.96 0.48,1.06 0.6,1.01 1,1");
    CustomEase.create("cardIn", "M0,0 C0.14,0 0.18,0.58 0.26,0.72 0.36,0.88 0.52,1.02 1,1");

    const WORKER_ORIGIN = "${workerOrigin}";
    const CARD_WIDTH = 320; // width + gap
    const track = document.getElementById("track");
    const shuffleBtn = document.getElementById("shuffleBtn");
    let loopTween = null;

    async function fetchAds() {
      const res = await fetch(WORKER_ORIGIN + "/api/shuffle?count=12");
      const data = await res.json();
      return data.ads || [];
    }

    function renderCards(ads, doubled = true) {
      track.innerHTML = "";
      const items = doubled ? [...ads, ...ads] : ads;
      items.forEach(ad => {
        const card = document.createElement("div");
        card.className = "ad-card";
        const img = document.createElement("img");
        img.src = ad.url;
        img.alt = "";
        img.decode().then(() => img.classList.add("loaded")).catch(() => img.classList.add("loaded"));
        card.appendChild(img);
        track.appendChild(card);
      });
    }

    function startLoop(adCount) {
      if (loopTween) loopTween.kill();
      const totalWidth = CARD_WIDTH * adCount;
      gsap.set(track, { x: 0 });
      loopTween = gsap.to(track, {
        x: -totalWidth,
        duration: adCount * 3.5,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % totalWidth)
        }
      });
    }

    async function shuffleCards() {
      shuffleBtn.classList.add("loading");
      if (loopTween) loopTween.pause();

      // Exit animation
      const cards = track.querySelectorAll(".ad-card");
      await gsap.to(cards, {
        y: 32,
        opacity: 0,
        scale: 0.95,
        stagger: { each: 0.035, from: "random" },
        duration: 0.3,
        ease: "power2.in"
      });

      const ads = await fetchAds();
      renderCards(ads, true);

      // Entrance animation
      const newCards = track.querySelectorAll(".ad-card");
      gsap.set(newCards, { y: -28, opacity: 0, scale: 0.96 });
      await gsap.to(newCards, {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: { each: 0.055, from: "start" },
        duration: 0.55,
        ease: "cardIn"
      });

      startLoop(ads.length);
      shuffleBtn.classList.remove("loading");
    }

    shuffleBtn.addEventListener("click", shuffleCards);

    // Init
    (async () => {
      const ads = await fetchAds();
      renderCards(ads, true);
      // Stagger initial cards in
      const cards = track.querySelectorAll(".ad-card");
      gsap.set(cards, { opacity: 0, y: 20 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        stagger: { each: 0.06, from: "start" },
        duration: 0.6,
        ease: "cardIn",
        onComplete: () => startLoop(ads.length)
      });
    })();
  </script>
</body>
</html>`;
}
```

**Step 2: No unit test for pure HTML** — verify visually after embed route is wired up.

**Step 3: Commit**

```bash
git add workers/ad-carousel/src/carousel-html.ts
git commit -m "feat: add GSAP carousel HTML template with custom easing"
```

---

### Task 5: Embed Route + Complete Router

**Files:**
- Modify: `workers/ad-carousel/src/index.ts`
- Modify: `workers/ad-carousel/src/index.test.ts`

**Step 1: Write failing test — add to `src/index.test.ts`**

```typescript
describe("Embed route", () => {
  it("returns HTML with 200", async () => {
    const res = await SELF.fetch("http://example.com/embed");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });

  it("root / also returns HTML", async () => {
    const res = await SELF.fetch("http://example.com/");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });

  it("OPTIONS returns CORS headers", async () => {
    const res = await SELF.fetch("http://example.com/embed", { method: "OPTIONS" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
```

**Step 2: Run to verify it fails**

```bash
cd workers/ad-carousel && npm test
```
Expected: FAIL — embed route returns 404.

**Step 3: Final complete `src/index.ts`**

```typescript
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
```

**Step 4: Run all tests**

```bash
cd workers/ad-carousel && npm test
```
Expected: all PASS.

**Step 5: Commit**

```bash
git add workers/ad-carousel/src/
git commit -m "feat: wire up embed route and complete router"
```

---

### Task 6: Upload Test Images + Local Smoke Test

**Step 1: Create a placeholder test image (if bucket is empty)**

```bash
# Check if bucket has any objects
cd workers/ad-carousel && npx wrangler r2 object list diligent-studios-ads --prefix ads/
```

If empty, create a placeholder:
```bash
# Upload a 1x1 pixel transparent PNG as a test object
echo "placeholder" | npx wrangler r2 object put diligent-studios-ads/ads/ad_concept_1.png --file /dev/stdin
```
Or upload a real image:
```bash
npx wrangler r2 object put diligent-studios-ads/ads/ad_concept_1.png --file /path/to/image.png
```

**Step 2: Start local dev server**

```bash
cd workers/ad-carousel && npm run dev
```
Expected: `⛅ wrangler dev` running at `http://localhost:8787`

**Step 3: Verify all routes**

```bash
# Embed page (should return HTML)
curl -I http://localhost:8787/embed

# Shuffle API (should return JSON)
curl http://localhost:8787/api/shuffle

# Image proxy (should return image or 404 if no objects)
curl -I http://localhost:8787/images/ads/ad_concept_1.png
```

**Step 4: Open in browser and verify carousel**

Open `http://localhost:8787/embed` — should see the dark carousel with ads loading and looping.
Click Shuffle — cards should animate out, new ones in.

---

### Task 7: Deploy Worker to Cloudflare

**Step 1: Deploy**

```bash
cd workers/ad-carousel && npm run deploy
```
Expected output: `Published diligent-studios-ad-carousel (...)` with a URL like:
`https://api.diligentstudios.com`

**Step 2: Verify production endpoints**

```bash
export WORKER_URL="https://api.diligentstudios.com"

curl -I "$WORKER_URL/embed"
# Expected: HTTP/2 200, content-type: text/html

curl "$WORKER_URL/api/shuffle" | head -c 200
# Expected: {"ads":[...]}
```

**Step 3: Commit**

```bash
git add workers/ad-carousel/
git commit -m "chore: worker deployed to Cloudflare"
```

---

### Task 8: Vue Preview App

**Files:**
- Create: `workers/ad-carousel/preview/package.json`
- Create: `workers/ad-carousel/preview/tsconfig.json`
- Create: `workers/ad-carousel/preview/vite.config.ts`
- Create: `workers/ad-carousel/preview/index.html`
- Create: `workers/ad-carousel/preview/src/main.ts`
- Create: `workers/ad-carousel/preview/src/App.vue`

**Step 1: Create `workers/ad-carousel/preview/package.json`**

```json
{
  "name": "ad-carousel-preview",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.0.0",
    "vue-tsc": "^2.0.0"
  }
}
```

**Step 2: Create `workers/ad-carousel/preview/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "jsxImportSource": "vue"
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

**Step 3: Create `workers/ad-carousel/preview/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: { port: 3000 },
});
```

**Step 4: Create `workers/ad-carousel/preview/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ad Carousel Preview</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0d0d0d; min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 5: Create `workers/ad-carousel/preview/src/main.ts`**

```typescript
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

**Step 6: Create `workers/ad-carousel/preview/src/App.vue`**

```vue
<script setup lang="ts">
const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "http://localhost:8787";
</script>

<template>
  <div class="preview">
    <header class="preview-header">
      <span class="badge">Preview</span>
      <span class="worker-url">{{ WORKER_URL }}</span>
    </header>
    <div class="iframe-container">
      <iframe
        :src="`${WORKER_URL}/embed`"
        frameborder="0"
        scrolling="no"
        allow="autoplay"
        title="Ad Carousel"
      />
    </div>
    <footer class="preview-footer">
      Embed URL: <code>{{ WORKER_URL }}/embed</code>
    </footer>
  </div>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  padding: 40px 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 100px;
}

.worker-url {
  color: rgba(255,255,255,0.25);
  font-family: monospace;
  font-size: 12px;
}

.iframe-container {
  width: min(860px, 100%);
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.07);
  box-shadow: 0 32px 80px rgba(0,0,0,0.7);
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-footer {
  color: rgba(255,255,255,0.2);
  font-family: monospace;
  font-size: 11px;
}

.preview-footer code {
  color: rgba(255,255,255,0.35);
}
</style>
```

**Step 7: Install and run**

```bash
cd workers/ad-carousel/preview && npm install && npm run dev
```
Expected: Vite dev server at `http://localhost:3000`. You should see the carousel iframe centered on a dark page.

> **Note:** Make sure `wrangler dev` is running in a separate terminal first (step 6 of Task 6).

**Step 8: Commit**

```bash
git add workers/ad-carousel/preview/
git commit -m "feat: add Vue preview app for ad carousel"
```

---

## Webflow Embed Instructions

Once deployed, add this to any Webflow page as an **Embed** block:

```html
<iframe
  src="https://api.diligentstudios.com/embed"
  width="100%"
  height="300"
  frameborder="0"
  scrolling="no"
  style="border: none;"
></iframe>
```

Adjust `height` to match your carousel card height + controls (~280–320px is ideal).

---

## Done ✓

All routes:
- `GET /embed` or `/` → Carousel iframe HTML
- `GET /images/ads/ad_concept_1.png` → R2 image proxy
- `GET /api/shuffle?count=12` → `{ ads: [{ key, url }] }`
