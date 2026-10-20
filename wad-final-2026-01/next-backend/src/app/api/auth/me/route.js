import { getDb, ensureSeedData, publicUser } from "@/lib/data";
import { currentUser, validId } from "@/lib/request";
import { errorResponse, successResponse } from "@/lib/utils";

export async function GET(request) {
  const session = currentUser(request); if (session.error) return session.error;
  const db = await getDb(); await ensureSeedData(db);
  const user = await db.collection("users").findOne({ _id: validId(session.user.id) });
  return user ? successResponse({ user: publicUser(user) }, 200) : errorResponse("User not found", 404);
}
