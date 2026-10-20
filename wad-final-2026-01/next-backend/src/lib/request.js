import { ObjectId } from "mongodb";
import { verifyJWT } from "./auth";
import { errorResponse } from "./utils";

export function currentUser(request) {
  const user = verifyJWT(request);
  if (!user) return { error: errorResponse("Authentication is required", 401) };
  return { user };
}

export function validId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}
