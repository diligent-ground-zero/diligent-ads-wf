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
