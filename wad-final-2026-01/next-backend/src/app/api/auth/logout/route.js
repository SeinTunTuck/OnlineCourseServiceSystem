//src/app/api/auth/logout/route.js

import { optionsResponse, successResponse } from "@/lib/utils";
export function OPTIONS() { return optionsResponse(); }
export async function POST() {
  const response = successResponse({ message: "Signed out" }, 200);
  response.cookies.set("token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
