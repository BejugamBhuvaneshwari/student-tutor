import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedTutors } from "./seedTutors.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";
const MONGODB_URI = process.env.MONGODB_URI;
const ALLOWED_ORIGINS = CLIENT_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

const baseOptions = { collection: "", timestamps: false, strict: true };

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    full_name: { type: String, default: "" },
    role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
    avatar_url: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "users" },
);

const profileSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    full_name: { type: String, default: "" },
    avatar_url: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "profiles" },
);

const roleSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
  },
  { ...baseOptions, collection: "user_roles" },
);

const tutorProfileSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    subjects: { type: [String], default: [] },
    hourly_rate: { type: Number, default: 0 },
    experience_years: { type: Number, default: 0 },
    availability: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    success_rate: { type: Number, default: 0 },
    total_sessions: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "tutor_profiles" },
);

const sessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    student_id: { type: String, required: true },
    tutor_id: { type: String, required: true },
    subject: { type: String, default: "" },
    scheduled_at: { type: Date, required: true },
    duration_minutes: { type: Number, default: 60 },
    session_type: { type: String, enum: ["paid", "demo", "micro"], default: "paid" },
    amount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    meeting_link: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "sessions" },
);

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    type: { type: String, default: "booking" },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "notifications" },
);

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    student_id: { type: String, required: true },
    tutor_id: { type: String, required: true },
    session_id: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    subject: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "reviews" },
);

const chatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    sender_id: { type: String, required: true },
    receiver_id: { type: String, required: true },
    message: { type: String, default: "" },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { ...baseOptions, collection: "chat_messages" },
);

const User = mongoose.model("User", userSchema);
const Profile = mongoose.model("Profile", profileSchema);
const UserRole = mongoose.model("UserRole", roleSchema);
const TutorProfile = mongoose.model("TutorProfile", tutorProfileSchema);
const Session = mongoose.model("Session", sessionSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const Review = mongoose.model("Review", reviewSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

const modelMap = {
  profiles: Profile,
  user_roles: UserRole,
  tutor_profiles: TutorProfile,
  sessions: Session,
  notifications: Notification,
  reviews: Review,
  chat_messages: ChatMessage,
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const applyFilters = (query, filters = [], orGroups = []) => {
  for (const filter of filters) {
    if (filter.kind === "eq") query = query.where(filter.key).equals(filter.value);
    if (filter.kind === "in") query = query.where(filter.key).in(Array.isArray(filter.value) ? filter.value : []);
  }
  if (Array.isArray(orGroups) && orGroups.length > 0) {
    const or = orGroups.map((group) => ({
      $and: group.map((c) => ({ [c.key]: c.value })),
    }));
    query = query.or(or);
  }
  return query;
};

const upsertTutorShell = async (userId) => {
  const existing = await TutorProfile.findOne({ user_id: userId }).lean();
  if (!existing) {
    await TutorProfile.create({
      user_id: userId,
      subjects: [],
      hourly_rate: 0,
      experience_years: 0,
      availability: [],
      verified: false,
      success_rate: 0,
      total_sessions: 0,
      created_at: new Date(),
    });
  }
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, dbState: mongoose.connection.readyState });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, full_name, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ error: "Email already registered" });

  const user_id = createId();
  const normalizedRole = role === "tutor" || role === "admin" ? role : "student";
  await User.create({
    user_id,
    email: String(email).toLowerCase(),
    password,
    full_name: full_name || email.split("@")[0],
    role: normalizedRole,
    created_at: new Date(),
  });
  await Profile.create({
    user_id,
    full_name: full_name || email.split("@")[0],
    avatar_url: "",
    bio: "",
    location: "",
    created_at: new Date(),
  });
  await UserRole.create({ user_id, role: normalizedRole });
  if (normalizedRole === "tutor") {
    await upsertTutorShell(user_id);
  }

  return res.json({
    user: {
      id: user_id,
      email: String(email).toLowerCase(),
      user_metadata: { full_name: full_name || email.split("@")[0] },
      role: normalizedRole,
    },
  });
});

app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email).toLowerCase(), password }).lean();
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  return res.json({
    user: {
      id: user.user_id,
      email: user.email,
      user_metadata: { full_name: user.full_name },
      role: user.role || "student",
    },
  });
});

app.get("/api/auth/user/:userId", async (req, res) => {
  const user = await User.findOne({ user_id: req.params.userId }).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    user: {
      id: user.user_id,
      email: user.email,
      user_metadata: { full_name: user.full_name },
      role: user.role || "student",
      profile: {
        full_name: user.full_name || "",
        avatar_url: user.avatar_url || null,
        bio: user.bio || "",
        location: user.location || "",
      },
    },
  });
});

app.get("/api/tutors", async (_req, res) => {
  const [tutorRoles, tutorProfiles, profiles, reviews] = await Promise.all([
    UserRole.find({ role: "tutor" }).lean(),
    TutorProfile.find().sort({ created_at: -1 }).lean(),
    Profile.find().lean(),
    Review.find().lean(),
  ]);

  const tutorIds = new Set(tutorRoles.map((r) => r.user_id));
  const filteredTutorProfiles = tutorProfiles.filter((tp) => tutorIds.has(tp.user_id));

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  const ratings = {};
  for (const review of reviews) {
    if (!ratings[review.tutor_id]) ratings[review.tutor_id] = { total: 0, count: 0, items: [] };
    ratings[review.tutor_id].total += Number(review.rating || 0);
    ratings[review.tutor_id].count += 1;
    ratings[review.tutor_id].items.push(review);
  }

  const result = filteredTutorProfiles.map((tp) => {
    const stat = ratings[tp.user_id] || { total: 0, count: 0, items: [] };
    const avg = stat.count === 0 ? 0 : stat.total / stat.count;
    return {
      ...tp,
      profiles: profileMap.get(tp.user_id) || null,
      avg_rating: avg,
      review_count: stat.count,
      reviews: stat.items,
    };
  });

  return res.json(result);
});

app.get("/api/tutors/:userId", async (req, res) => {
  const [roleRow, tp, profile, reviews] = await Promise.all([
    UserRole.findOne({ user_id: req.params.userId }).lean(),
    TutorProfile.findOne({ user_id: req.params.userId }).lean(),
    Profile.findOne({ user_id: req.params.userId }).lean(),
    Review.find({ tutor_id: req.params.userId }).sort({ created_at: -1 }).lean(),
  ]);
  if (!roleRow || roleRow.role !== "tutor" || !tp) return res.status(404).json({ error: "Tutor not found" });

  const avg = reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length : 0;
  return res.json({
    ...tp,
    profiles: profile || null,
    avg_rating: avg,
    review_count: reviews.length,
    reviews,
  });
});

app.get("/api/db/:table", async (req, res) => {
  const model = modelMap[req.params.table];
  if (!model) return res.status(404).json({ error: "Unknown table" });

  const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
  const orGroups = req.query.orGroups ? JSON.parse(req.query.orGroups) : [];
  const orderBy = req.query.orderBy ? String(req.query.orderBy) : null;
  const ascending = req.query.ascending !== "false";
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const single = req.query.single === "true";
  const maybeSingle = req.query.maybeSingle === "true";

  let query = model.find();
  query = applyFilters(query, filters, orGroups);
  if (orderBy) query = query.sort({ [orderBy]: ascending ? 1 : -1 });
  if (limit) query = query.limit(limit);

  let data = await query.lean();
  if (req.params.table === "tutor_profiles") {
    const profiles = await Profile.find({ user_id: { $in: data.map((d) => d.user_id) } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
    data = data.map((item) => ({ ...item, profiles: profileMap.get(item.user_id) || null }));
  }

  if (single) {
    if (!data[0]) return res.status(404).json({ error: "No rows found" });
    return res.json({ data: data[0] });
  }
  if (maybeSingle) return res.json({ data: data[0] || null });
  return res.json({ data });
});

app.post("/api/db/:table", async (req, res) => {
  const model = modelMap[req.params.table];
  if (!model) return res.status(404).json({ error: "Unknown table" });

  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (rows.length === 0) return res.json({ data: [] });

  const now = new Date();
  const enriched = rows.map((row) => ({
    ...row,
    id: row.id || createId(),
    created_at: row.created_at || now,
  }));

  const data = await model.insertMany(enriched);
  return res.json({ data });
});

app.patch("/api/db/:table", async (req, res) => {
  const model = modelMap[req.params.table];
  if (!model) return res.status(404).json({ error: "Unknown table" });

  const filters = Array.isArray(req.body?.filters) ? req.body.filters : [];
  const values = req.body?.values || {};
  let query = model.find();
  query = applyFilters(query, filters, []);
  const rows = await query.lean();
  if (rows.length === 0) return res.json({ data: [] });

  const ids = rows.map((r) => r._id);
  await model.updateMany({ _id: { $in: ids } }, { $set: values });

  if (req.params.table === "profiles") {
    for (const row of rows) {
      await User.updateOne(
        { user_id: row.user_id },
        {
          $set: {
            full_name: values.full_name ?? row.full_name,
            avatar_url: values.avatar_url ?? row.avatar_url,
            bio: values.bio ?? row.bio,
            location: values.location ?? row.location,
          },
        },
      );
    }
  }

  if (req.params.table === "tutor_profiles") {
    for (const row of rows) {
      await upsertTutorShell(row.user_id);
    }
  }

  const updated = await model.find({ _id: { $in: ids } }).lean();
  return res.json({ data: updated });
});

app.post("/api/seed", async (_req, res) => {
  const profileCount = await Profile.countDocuments();
  if (profileCount > 0) {
    return res.json({ ok: true, inserted: 0, message: "Database already has seed data" });
  }

  const now = new Date();
  const tutorUsers = seedTutors.map((tutor) => ({
    user_id: tutor.user_id,
    email: `tutor${tutor.user_id}@example.com`,
    password: "password123",
    full_name: tutor.profiles.full_name,
    role: "tutor",
    avatar_url: tutor.profiles.avatar_url || "",
    bio: tutor.profiles.bio || "",
    location: tutor.profiles.location || "",
    created_at: now,
  }));

  const profiles = seedTutors.map((tutor) => ({
    user_id: tutor.user_id,
    full_name: tutor.profiles.full_name,
    avatar_url: tutor.profiles.avatar_url || "",
    bio: tutor.profiles.bio || "",
    location: tutor.profiles.location || "",
    created_at: now,
  }));

  const roles = seedTutors.map((tutor) => ({
    user_id: tutor.user_id,
    role: "tutor",
  }));

  const tutorProfiles = seedTutors.map((tutor) => ({
    user_id: tutor.user_id,
    subjects: tutor.subjects,
    hourly_rate: tutor.hourly_rate,
    experience_years: tutor.experience_years,
    availability: tutor.availability,
    verified: tutor.verified,
    success_rate: tutor.success_rate,
    total_sessions: tutor.total_sessions,
    created_at: now,
  }));

  const reviews = seedTutors.flatMap((tutor) =>
    (tutor.reviews || []).map((review) => ({
      id: createId(),
      student_id: createId(),
      tutor_id: tutor.user_id,
      session_id: null,
      rating: review.rating,
      comment: review.comment || "",
      subject: review.subject || "",
      created_at: now,
    })),
  );

  const demoStudentId = "student-demo";
  const demoUser = {
    user_id: demoStudentId,
    email: "student@example.com",
    password: "password123",
    full_name: "Demo Student",
    role: "student",
    avatar_url: "",
    bio: "",
    location: "Bangalore, KA",
    created_at: now,
  };
  const demoProfile = {
    user_id: demoStudentId,
    full_name: "Demo Student",
    avatar_url: "",
    bio: "",
    location: "Bangalore, KA",
    created_at: now,
  };

  await User.insertMany([demoUser, ...tutorUsers]);
  await Profile.insertMany([demoProfile, ...profiles]);
  await UserRole.insertMany([{ user_id: demoStudentId, role: "student" }, ...roles]);
  await TutorProfile.insertMany(tutorProfiles);
  if (reviews.length > 0) await Review.insertMany(reviews);

  return res.json({ ok: true, inserted: tutorProfiles.length + profiles.length + reviews.length + 2 });
});

const start = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
