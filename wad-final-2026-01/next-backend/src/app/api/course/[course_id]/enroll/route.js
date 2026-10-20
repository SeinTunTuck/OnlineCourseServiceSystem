import { ObjectId } from "mongodb";
import { getDb, ROLES } from "@/lib/data";
import { currentUser, validId } from "@/lib/request";
import { errorResponse, optionsResponse, successResponse } from "@/lib/utils";
export function OPTIONS() { return optionsResponse(); }
export async function POST(request, { params }) {
  const session = currentUser(request); if (session.error) return session.error;
  if (session.user.role !== ROLES.STUDENT) return errorResponse("Only students can enroll", 403);
  const { course_id } = await params; const _id = validId(course_id); if (!_id) return errorResponse("Course not found", 404);
  const db = await getDb(); const studentId = new ObjectId(session.user.id);
  const course = await db.collection("courses").findOne({ _id }); if (!course) return errorResponse("Course not found", 404);
  if (course.status !== "open") return errorResponse("This course is not open for enrollment", 409);
  if (course.enrolledStudentIds?.some((id) => id.toString() === session.user.id)) return errorResponse("You are already enrolled in this course", 409);
  if ((course.enrolledStudentIds?.length || 0) >= course.maxStudent) return errorResponse("This course is full", 409);
  const updated = await db.collection("courses").updateOne({ _id, status: "open", enrolledStudentIds: { $ne: studentId }, $expr: { $lt: [{ $size: "$enrolledStudentIds" }, "$maxStudent"] } }, { $addToSet: { enrolledStudentIds: studentId }, $set: { updatedAt: new Date() } });
  return updated.modifiedCount ? successResponse({ message: "Enrollment successful" }, 200) : errorResponse("Enrollment is no longer available", 409);
}
