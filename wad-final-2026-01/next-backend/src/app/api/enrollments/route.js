import { ObjectId } from "mongodb";
import { getDb } from "@/lib/data";
import { currentUser } from "@/lib/request";
import { errorResponse, successResponse } from "@/lib/utils";
export async function GET(request) {
  const session = currentUser(request); if (session.error) return session.error;
  if (session.user.role !== "student") return errorResponse("Only students have enrollments", 403);
  const db = await getDb(); const courses = await db.collection("courses").find({ enrolledStudentIds: new ObjectId(session.user.id) }).sort({ updatedAt: -1 }).toArray();
  return successResponse({ courses: courses.map((course) => ({ ...course, _id: course._id.toString(), teacherId: course.teacherId.toString(), enrollmentCount: course.enrolledStudentIds?.length || 0, enrolledStudentIds: undefined })) }, 200);
}
