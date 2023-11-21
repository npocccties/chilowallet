import { NextResponse } from "next/server";

import { verifyOrthrosJwt } from "./lib/verifyJwt";

import type { NextRequest } from "next/server";

import { logEndForOther, logStartForOther } from "@/constants/log";
import { loggerMWInfo } from "@/lib/logger";

export async function middleware(req: NextRequest) {
  loggerMWInfo(logStartForOther("middleware"));
  const res = NextResponse.next();
  const url = req.nextUrl;
  loggerMWInfo(`access path ${url.pathname}`);

  if (url.pathname === "/") {
    loggerMWInfo(logEndForOther("middleware access path '/'"));
    return res;
  }
  const jwt = req.cookies.get("jwt");
  const verify = await verifyOrthrosJwt(jwt);

  if (!verify) {
    // TODO: リダイレクト先の確認
    loggerMWInfo("invalid access! redirect '/'");
    return NextResponse.redirect(new URL("/", req.url));
  }

  loggerMWInfo(logEndForOther("middleware"));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
