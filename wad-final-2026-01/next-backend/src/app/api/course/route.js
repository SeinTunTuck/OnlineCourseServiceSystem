//src/app/api/course/route.js

import { ObjectId } from "mongodb";
import { getDb, ensureSeedData, ROLES } from "@/lib/data";
import { currentUser } from "@/lib/request";
import { errorResponse, optionsResponse, successResponse } from "@/lib/utils";

export function OPTIONS() { return optionsResponse(); }

function serialize(course) {
  return { ...course, _id: course._id.toString(), teacherId: course.teacherId.toString(), enrollmentCount: course.enrolledStudentIds?.length || 0, enrolledStudentIds: undefined };
}

export async function GET(request) {
  const session = currentUser(request); if (session.error) return session.error;
  const db = await getDb(); await ensureSeedData(db);
  const courses = db.collection("courses");
  const teacher = session.user.role === ROLES.TEACHER;
  const query = teacher ? { teacherId: new ObjectId(session.user.id) } : { status: { $ne: "cancel" } };
  const search = new URL(request.url).searchParams.get("search")?.trim();
  if (search && session.user.role !== ROLES.TEACHER) query.$or = [{ name: { $regex: search, $options: "i" } }, { teacherName: { $regex: search, $options: "i" } }];
  const list = await courses.find(query).sort({ createdAt: -1 }).toArray();
  // A teacher's course list doubles as its detail view, including enrollment.
  const studentIds = teacher ? list.flatMap((course) => course.enrolledStudentIds || []) : [];
  const students = studentIds.length ? await db.collection("users").find({ _id: { $in: studentIds } }, { projection: { password: 0 } }).toArray() : [];
  const studentMap = new Map(students.map((student) => [student._id.toString(), { id: student._id.toString(), username: student.username, email: student.email }]));
  return successResponse({ courses: list.map((course) => ({ ...serialize(course), students: teacher ? (course.enrolledStudentIds || []).map((id) => studentMap.get(id.toString())).filter(Boolean) : undefined })) }, 200);
}

export async function POST(request) {
  const session = currentUser(request); if (session.error) return session.error;
  if (session.user.role !== ROLES.TEACHER) return errorResponse("Only teachers can create courses", 403);
  try {
    const { name, duration, topics, price, maxStudent, status } = await request.json();
    if (!name?.trim() || !Number.isInteger(Number(duration)) || Number(duration) < 1 || !Array.isArray(topics) || !topics.filter(Boolean).length || Number.isNaN(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(maxStudent)) || Number(maxStudent) < 1 || !["open", "close", "cancel"].includes(status)) return errorResponse("Please provide valid course details", 400);
    const db = await getDb(); await ensureSeedData(db);
    const result = await db.collection("courses").insertOne({ name: name.trim(), duration: Number(duration), topics: topics.map((topic) => topic.trim()).filter(Boolean), price: Number(price), maxStudent: Number(maxStudent), status, teacherId: new ObjectId(session.user.id), teacherName: session.user.username, enrolledStudentIds: [], createdAt: new Date(), updatedAt: new Date() });
    const course = await db.collection("courses").findOne({ _id: result.insertedId });
    return successResponse({ course: serialize(course) }, 201);
  } catch { return errorResponse("Unable to create course", 500); }
}
