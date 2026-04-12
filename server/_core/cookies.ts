import type { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  const isSecure = req.protocol === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}
