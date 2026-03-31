/// <reference types="@cloudflare/vitest-pool-workers" />
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
