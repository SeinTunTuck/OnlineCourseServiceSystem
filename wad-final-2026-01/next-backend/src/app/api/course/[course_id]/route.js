//src/app/api/course/[course_id]/route.js

import { getDb, ensureSeedData, ROLES } from "@/lib/data";
import { currentUser, validId } from "@/lib/request";
import { errorResponse, optionsResponse, successResponse } from "@/lib/utils";

export function OPTIONS() { return optionsResponse(); }

async function findCourse(db, id) { const _id = validId(id); return _id ? db.collection("courses").findOne({ _id }) : null; }
async function details(db, course) {
  const ids = course.enrolledStudentIds || [];
  const students = ids.length ? await db.collection("users").find({ _id: { $in: ids } }, { projection: { password: 0 } }).toArray() : [];
  return { ...course, _id: course._id.toString(), teacherId: course.teacherId.toString(), enrollmentCount: ids.length, enrolledStudentIds: undefined, students: students.map(({ _id, username, email }) => ({ id: _id.toString(), username, email })) };
}
export async function GET(request, { params }) {
  const session = currentUser(request); if (session.error) return session.error;
  const { course_id } = await params; const db = await getDb(); await ensureSeedData(db); const course = await findCourse(db, course_id);
  if (!course || (session.user.role === ROLES.STUDENT && course.status === "cancel")) return errorResponse("Course not found", 404);
  if (session.user.role === ROLES.TEACHER && course.teacherId.toString() !== session.user.id) return errorResponse("You can only view your own courses", 403);
  return successResponse({ course: await details(db, course) }, 200);
}
export async function PUT(request, { params }) {
  const session = currentUser(request); if (session.error) return session.error;
  if (session.user.role !== ROLES.TEACHER) return errorResponse("Only teachers can update courses", 403);
  const { course_id } = await params; const db = await getDb(); const course = await findCourse(db, course_id);
  if (!course) return errorResponse("Course not found", 404); if (course.teacherId.toString() !== session.user.id) return errorResponse("You can only update your own courses", 403);
  const body = await request.json(); const update = {};
  for (const key of ["name", "duration", "price", "maxStudent", "status"]) if (body[key] !== undefined) update[key] = key === "name" ? String(body[key]).trim() : ["duration", "maxStudent"].includes(key) ? Number(body[key]) : key === "price" ? Number(body[key]) : body[key];
  if (body.topics !== undefined) update.topics = Array.isArray(body.topics) ? body.topics.map(String).map((v) => v.trim()).filter(Boolean) : [];
  if (!update.name || (update.duration && (!Number.isInteger(update.duration) || update.duration < 1)) || (update.maxStudent && (!Number.isInteger(update.maxStudent) || update.maxStudent < (course.enrolledStudentIds?.length || 0))) || (update.price !== undefined && (Number.isNaN(update.price) || update.price < 0)) || (update.status && !["open", "close", "cancel"].includes(update.status)) || (update.topics && !update.topics.length)) return errorResponse("Invalid course details or maximum below current enrollment", 400);
  update.updatedAt = new Date(); await db.collection("courses").updateOne({ _id: course._id }, { $set: update }); return successResponse({ course: await details(db, await findCourse(db, course_id)) }, 200);
}
export async function DELETE(request, { params }) {
  const session = currentUser(request); if (session.error) return session.error;
  if (session.user.role !== ROLES.TEACHER) return errorResponse("Only teachers can delete courses", 403);
  const { course_id } = await params; const db = await getDb(); const course = await findCourse(db, course_id);
  if (!course) return errorResponse("Course not found", 404); if (course.teacherId.toString() !== session.user.id) return errorResponse("You can only delete your own courses", 403); if (course.enrolledStudentIds?.length) return errorResponse("Courses with enrolled students cannot be deleted", 409);
  await db.collection("courses").deleteOne({ _id: course._id }); return successResponse({ message: "Course deleted" }, 200);
}
