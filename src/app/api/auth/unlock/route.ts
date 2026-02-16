import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  APP_GATE_COOKIE_NAME,
  APP_GATE_SESSION_TTL_SECONDS,
  assertAppGateConfiguration,
  createAppGateToken,
  isAppGateEnabled,
  sanitizeNextPath,
} from "@/lib/app-gate";

const formValue = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : "";

const safeStringEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const makeRedirectResponse = (request: Request, path: string) =>
  NextResponse.redirect(new URL(path, request.url), { status: 303 });

export async function POST(request: Request) {
  const payload = await request.formData();
  const password = formValue(payload.get("password")).trim();
  const nextPath = sanitizeNextPath(formValue(payload.get("next")));

  if (!isAppGateEnabled()) {
    return makeRedirectResponse(request, nextPath);
  }

  try {
    assertAppGateConfiguration();
  } catch {
    return new NextResponse("App gate is misconfigured.", { status: 500 });
  }

  const expectedPassword = process.env.APP_GATE_PASSWORD?.trim() ?? "";

  if (!safeStringEqual(password, expectedPassword)) {
    return makeRedirectResponse(
      request,
      `/unlock?error=1&next=${encodeURIComponent(nextPath)}`,
    );
  }

  const token = await createAppGateToken();
  const response = makeRedirectResponse(request, nextPath);

  response.cookies.set({
    name: APP_GATE_COOKIE_NAME,
    value: token,
    maxAge: APP_GATE_SESSION_TTL_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
