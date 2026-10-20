// A small persistent fallback for running the assignment without installing
// MongoDB. Production/Atlas deployments continue to use MongoDB normally.
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const file = path.join(process.cwd(), ".data", "course-management.json");
const normal = (value) => value?.toString?.() ?? value;
const id = () => randomBytes(12).toString("hex");
const equals = (a, b) => normal(a) === normal(b);
function matches(doc, query = {}) {
  if (query.$or) return query.$or.some((entry) => matches(doc, entry)) && matches(doc, Object.fromEntries(Object.entries(query).filter(([key]) => key !== "$or")));
  return Object.entries(query).every(([key, condition]) => {
    if (key === "$expr") return true; // enrollment capacity is checked in its route before updating
    const value = doc[key];
    if (condition && typeof condition === "object" && !(condition instanceof Date) && !Array.isArray(condition)) {
      if (condition.$ne !== undefined) return Array.isArray(value) ? !value.some((entry) => equals(entry, condition.$ne)) : !equals(value, condition.$ne);
      if (condition.$in) return condition.$in.some((entry) => Array.isArray(value) ? value.some((v) => equals(v, entry)) : equals(value, entry));
      if (condition.$regex) return new RegExp(condition.$regex, condition.$options || "").test(value || "");
    }
    // MongoDB treats `{ enrolledStudentIds: studentId }` as an array-contains
    // query. Mirror that behavior in the local fallback.
    return Array.isArray(value) ? value.some((entry) => equals(entry, condition)) : equals(value, condition);
  });
}
async function load() { try { return JSON.parse(await readFile(file, "utf8")); } catch { return { users: [], courses: [] }; } }
async function save(data) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(data, null, 2)); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

class LocalCollection {
  constructor(name) { this.name = name; }
  async createIndex() { return null; }
  async findOne(query) { const data = await load(); return clone(data[this.name].find((doc) => matches(doc, query)) || null); }
  find(query = {}, options = {}) {
    const work = async () => { const data = await load(); let docs = data[this.name].filter((doc) => matches(doc, query)); if (options.projection?.password === 0) docs = docs.map(({ password, ...doc }) => doc); return clone(docs); };
    return { sort: () => ({ toArray: work }), toArray: work };
  }
  async insertOne(document) { const data = await load(); const record = { ...clone(document), _id: document._id?.toString?.() || id() }; data[this.name].push(record); await save(data); return { insertedId: record._id }; }
  async updateOne(query, update, options = {}) {
    const data = await load(); let index = data[this.name].findIndex((doc) => matches(doc, query));
    if (index < 0 && options.upsert) { const base = Object.fromEntries(Object.entries(query).filter(([, value]) => typeof value !== "object")); data[this.name].push({ ...base, _id: id() }); index = data[this.name].length - 1; }
    if (index < 0) return { modifiedCount: 0 };
    const doc = data[this.name][index]; if (update.$setOnInsert && !doc.__seeded) Object.assign(doc, clone(update.$setOnInsert));
    if (update.$set) Object.assign(doc, clone(update.$set));
    if (update.$addToSet) for (const [key, value] of Object.entries(update.$addToSet)) { doc[key] ||= []; if (!doc[key].some((entry) => equals(entry, value))) doc[key].push(normal(value)); }
    doc.__seeded = true; await save(data); return { modifiedCount: 1 };
  }
  async deleteOne(query) { const data = await load(); const before = data[this.name].length; data[this.name] = data[this.name].filter((doc) => !matches(doc, query)); await save(data); return { deletedCount: before - data[this.name].length }; }
}

export const localDb = { collection: (name) => new LocalCollection(name) };
