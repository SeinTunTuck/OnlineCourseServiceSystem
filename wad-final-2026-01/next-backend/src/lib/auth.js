import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "course-management-development-secret";

export function verifyJWT(req) {
  try {
    const bearer = req.headers.get("authorization");
    const token = req.cookies.get("token")?.value || (bearer?.startsWith("Bearer ") ? bearer.slice(7) : null);

    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.log(err);
    return null;
  }
}
