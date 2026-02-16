import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createAppGateToken,
  sanitizeNextPath,
  verifyAppGateToken,
} from "@/lib/app-gate";

describe("app gate helpers", () => {
  const originalSecret = process.env.APP_GATE_SECRET;

  beforeAll(() => {
    process.env.APP_GATE_SECRET = "test-app-gate-secret";
  });

  afterAll(() => {
    process.env.APP_GATE_SECRET = originalSecret;
  });

  it("sanitizes untrusted next paths", () => {
    expect(sanitizeNextPath(undefined)).toBe("/");
    expect(sanitizeNextPath("https://evil.example")).toBe("/");
    expect(sanitizeNextPath("//evil.example")).toBe("/");
    expect(sanitizeNextPath("/unlock?next=/")).toBe("/");
    expect(sanitizeNextPath("/dashboard?view=summary")).toBe(
      "/dashboard?view=summary",
    );
  });

  it("creates and validates a signed session token", async () => {
    const issuedAt = 1_700_000_000_000;
    const token = await createAppGateToken(issuedAt);
    const isValid = await verifyAppGateToken(token, issuedAt + 5_000);

    expect(isValid).toBe(true);
  });

  it("rejects expired tokens", async () => {
    const issuedAt = 1_700_000_000_000;
    const token = await createAppGateToken(issuedAt);
    const isValid = await verifyAppGateToken(token, issuedAt + 3_000_000_000);

    expect(isValid).toBe(false);
  });
});
