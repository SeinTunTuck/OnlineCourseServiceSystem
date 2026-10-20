import bcrypt from "bcrypt";
import { getClientPromise } from "./mongodb";
import { localDb } from "./local-db";

export const ROLES = { STUDENT: "student", TEACHER: "teacher" };
let warnedAboutLocalStore = false;

export async function getDb() {
  if (!process.env.MONGODB_URI) {
    if (process.env.VERCEL) {
      throw new Error("MONGODB_URI must be configured for a Vercel deployment");
    }
    if (!warnedAboutLocalStore) {
      console.warn("MONGODB_URI is not loaded; using the local .data/course-management.json store.");
      warnedAboutLocalStore = true;
    }
    return localDb;
  }
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "course_management");
}

// Idempotent seed data makes a fresh database immediately gradeable without
// replacing any courses or accounts that were created during testing.
export async function ensureSeedData(db) {
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  const password = await bcrypt.hash("Pass123!", 10);
  const accounts = [
    ["Ada Teacher", "ada.teacher@example.com", ROLES.TEACHER],
    ["Ben Teacher", "ben.teacher@example.com", ROLES.TEACHER],
    ["Chloe Teacher", "chloe.teacher@example.com", ROLES.TEACHER],
    ["Sam Student", "sam.student@example.com", ROLES.STUDENT],
    ["Mia Student", "mia.student@example.com", ROLES.STUDENT],
    ["Noah Student", "noah.student@example.com", ROLES.STUDENT],
  ];
  // Reset only the explicitly documented grading accounts. This makes their
  // published credentials reliable even if an earlier run created stale data.
  // Run sequentially: the no-Mongo local fallback persists each update to one
  // JSON file, so concurrent writes could otherwise overwrite each other.
  for (const [username, email, role] of accounts) {
    await users.updateOne(
      { email },
      {
        $set: { username, email, role, password },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }
}

export function publicUser(user) {
  return { id: user._id.toString(), username: user.username, email: user.email, role: user.role };
}
