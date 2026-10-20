//src/App.jsx

import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./context/UserContext";
import "./App.css";

const initialForm = { name: "", duration: "1", topics: "", price: "0", maxStudent: "1", status: "open" };

function Login() {
  const { user, login } = useContext(UserContext); const navigate = useNavigate(); const [identity, setIdentity] = useState("ada.teacher@example.com"); const [password, setPassword] = useState("Pass123!"); const [error, setError] = useState("");
  if (user) return <Navigate to="/" replace />;
  const submit = async (event) => { event.preventDefault(); setError(""); try { await login(identity, password); navigate("/"); } catch (err) { setError(err.message); } };
  return <main className="login"><form onSubmit={submit} className="card"><p className="eyebrow">COURSE HUB</p><h1>Welcome back</h1><p>Sign in to manage or explore courses.</p><label>Email or username<input value={identity} onChange={(e) => setIdentity(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button>Sign in</button><small>Demo: any seeded email · Pass123!</small></form></main>;
}
function CourseForm({ value, onSave, onCancel }) {
  const [form, setForm] = useState(value || initialForm); const [error, setError] = useState(""); const update = (key, val) => setForm({ ...form, [key]: val });
  const submit = async (e) => { e.preventDefault(); setError(""); try { await onSave({ ...form, topics: form.topics.split(",").map((x) => x.trim()).filter(Boolean), duration: Number(form.duration), price: Number(form.price), maxStudent: Number(form.maxStudent) }); } catch (err) { setError(err.message); } };
  return <form className="form-grid" onSubmit={submit}><label>Course name<input value={form.name} onChange={(e) => update("name", e.target.value)} required /></label><label>Duration (days)<input type="number" min="1" value={form.duration} onChange={(e) => update("duration", e.target.value)} required /></label><label className="wide">Topics (separate with commas)<input value={Array.isArray(form.topics) ? form.topics.join(", ") : form.topics} onChange={(e) => update("topics", e.target.value)} required /></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} required /></label><label>Max students<input type="number" min="1" value={form.maxStudent} onChange={(e) => update("maxStudent", e.target.value)} required /></label><label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="open">Open</option><option value="close">Close</option><option value="cancel">Cancel</option></select></label>{error && <p className="error wide">{error}</p>}<div className="actions wide"><button>{value ? "Save changes" : "Create course"}</button>{onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}</div></form>;
}
function Dashboard() {
  const { user, logout, request } = useContext(UserContext); const [courses, setCourses] = useState([]); const [enrolled, setEnrolled] = useState([]); const [search, setSearch] = useState(""); const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(null); const [notice, setNotice] = useState(""); const teacher = user.role === "teacher";
  const load = async (term = search) => { const data = await request(`/course${teacher ? "" : `?search=${encodeURIComponent(term)}`}`); setCourses(data.courses); if (!teacher) { const mine = await request("/enrollments"); setEnrolled(mine.courses); } };
  useEffect(() => { load().catch((err) => setNotice(err.message)); }, []);
  const create = async (course) => { await request("/course", { method: "POST", body: JSON.stringify(course) }); setCreating(false); setNotice("Course created."); load(); };
  const save = async (course) => { await request(`/course/${editing._id}`, { method: "PUT", body: JSON.stringify(course) }); setEditing(null); setNotice("Course updated."); load(); };
  const enroll = async (course) => {
    try {
      await request(`/course/${course._id}/enroll`, { method: "POST" });
      setNotice(`You are enrolled in ${course.name}.`);
      // Update immediately, then refresh both lists from the API. This keeps
      // the enrollment visible even while the background request is pending.
      setEnrolled((current) => current.some((item) => item._id === course._id) ? current : [{ ...course, enrollmentCount: course.enrollmentCount + 1 }, ...current]);
      setCourses((current) => current.map((item) => item._id === course._id ? { ...item, enrollmentCount: item.enrollmentCount + 1 } : item));
      // The optimistic state above is already accurate. A transient refresh
      // failure (for example while Vite reconnects) must not turn a completed
      // enrollment into a misleading "Failed to fetch" message.
      try { await load(); } catch { /* retry automatically on the next page load */ }
    } catch (err) { setNotice(err.message); }
  };
  const remove = async (course) => { if (!confirm(`Delete ${course.name}?`)) return; try { await request(`/course/${course._id}`, { method: "DELETE" }); setNotice("Course deleted."); load(); } catch (err) { setNotice(err.message); } };
  return <main className="shell"><header><div><p className="eyebrow">COURSE HUB</p><h1>{teacher ? "Teacher workspace" : "Find your next course"}</h1><p>{user.username} · {user.role}</p></div><button className="secondary" onClick={logout}>Sign out</button></header>{notice && <p className="notice">{notice}</p>}{teacher ? <><section className="toolbar"><div><h2>Your courses</h2><p>Create, update, and view enrollment for the courses you own.</p></div><button onClick={() => { setCreating(true); setEditing(null); }}>+ New course</button></section>{(creating || editing) && <section className="panel"><h2>{editing ? "Edit course" : "New course"}</h2><CourseForm value={editing && { ...editing, topics: editing.topics.join(", ") }} onSave={editing ? save : create} onCancel={() => { setCreating(false); setEditing(null); }} /></section>}<CourseList courses={courses} teacher onEdit={setEditing} onDelete={remove} /></> : <><section className="toolbar"><div><h2>Available courses</h2><p>Cancelled courses are hidden. Open courses can be enrolled in while seats remain.</p></div><input className="search" placeholder="Search course or teacher" value={search} onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} /></section><CourseList courses={courses} onEnroll={enroll} enrolledIds={new Set(enrolled.map((course) => course._id))} /><section><h2>My enrollments</h2><CourseList courses={enrolled} enrolled /></section></>}</main>;
}
function CourseList({ courses, teacher, onEdit, onDelete, onEnroll, enrolledIds = new Set(), enrolled }) { if (!courses.length) return <p className="empty">No courses to show.</p>; return <section className="course-list">{courses.map((course) => { const full = course.enrollmentCount >= course.maxStudent; const isEnrolled = enrolledIds.has(course._id); return <article className="course" key={course._id}><div className="course-top"><span className={`badge ${course.status}`}>{course.status}</span><span>{course.enrollmentCount}/{course.maxStudent} seats</span></div><h3>{course.name}</h3><p>{course.topics.join(" · ")}</p><dl><div><dt>Teacher</dt><dd>{course.teacherName}</dd></div><div><dt>Duration</dt><dd>{course.duration} days</dd></div><div><dt>Price</dt><dd>${Number(course.price).toFixed(2)}</dd></div></dl>{teacher && <><div className="students"><strong>Enrolled students ({course.enrollmentCount})</strong>{course.students?.length ? <ul>{course.students.map((student) => <li key={student.id}>{student.username} <small>{student.email}</small></li>)}</ul> : <p>None yet</p>}</div><div className="actions"><button className="secondary" onClick={() => onEdit(course)}>Edit</button><button className="danger" onClick={() => onDelete(course)} disabled={course.enrollmentCount}>Delete</button></div></>}{onEnroll && <button disabled={course.status !== "open" || full || isEnrolled} onClick={() => onEnroll(course)}>{isEnrolled ? "Enrolled" : full ? "Course full" : course.status === "close" ? "Enrollment closed" : "Enroll"}</button>}{enrolled && <p className="enrolled">You are enrolled in this course.</p>}</article>; })}</section>; }
function Protected() { const { user, loading } = useContext(UserContext); if (loading) return <main className="loading">Loading…</main>; return user ? <Dashboard /> : <Navigate to="/login" replace />; }

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Protected />} />
      </Routes>
    </HashRouter>
  );
}
