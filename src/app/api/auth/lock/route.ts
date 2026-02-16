import { NextResponse } from "next/server";
import { APP_GATE_COOKIE_NAME } from "@/lib/app-gate";

const makeRedirectResponse = (request: Request, path: string) =>
  NextResponse.redirect(new URL(path, request.url), { status: 303 });

export async function POST(request: Request) {
  const response = makeRedirectResponse(request, "/unlock");

  response.cookies.set({
    name: APP_GATE_COOKIE_NAME,
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
