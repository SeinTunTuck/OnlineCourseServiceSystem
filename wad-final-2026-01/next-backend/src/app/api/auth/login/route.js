//src/app/api/auth/login/route.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDb, ensureSeedData, publicUser } from "@/lib/data";
import { errorResponse, optionsResponse, successResponse } from "@/lib/utils";

export function OPTIONS() { return optionsResponse(); }

export async function POST(request) {
  try {
    const { identity, password } = await request.json();
    if (!identity || !password) return errorResponse("Email/username and password are required", 400);
    const db = await getDb();
    await ensureSeedData(db);
    const user = await db.collection("users").findOne({ $or: [{ email: identity.toLowerCase() }, { username: identity }] });
    if (!user || !(await bcrypt.compare(password, user.password))) return errorResponse("Invalid credentials", 401);
    const token = jwt.sign({ id: user._id.toString(), email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET || "course-management-development-secret", { expiresIn: "8h" });
    const response = successResponse({ user: publicUser(user) }, 200);
    response.cookies.set("token", token, {
      httpOnly: true,
      // Frontend and API are separate Vercel origins in production.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    const message = "Unable to connect to the database. Confirm MongoDB is running and try again.";
    return errorResponse(message, 503);
  }
}
