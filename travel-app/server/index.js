const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("./src/db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = "wqs040526@gmail.com";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in .env");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function getPublicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    inviteCode: user.invite_code,
    createdAt: user.created_at,
  };
}

async function logAction(userId, action, details = "") {
  try {
    await db.execute(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
      [userId || null, action, details]
    );
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Please sign in first." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await db.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [
      decoded.id,
    ]);

    if (!users[0]) {
      return res.status(401).json({ message: "Your account was not found." });
    }

    req.user = users[0];
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Your session has expired. Please sign in again." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access is required." });
  }

  return next();
}

function canManage(req, ownerId) {
  return req.user.role === "admin" || Number(req.user.id) === Number(ownerId);
}

async function loadTrip(req, res, next) {
  const [trips] = await db.execute("SELECT * FROM trips WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);

  if (!trips[0]) {
    return res.status(404).json({ message: "Trip was not found." });
  }

  req.trip = trips[0];
  return next();
}

async function loadMemory(req, res, next) {
  const [memories] = await db.execute("SELECT * FROM memories WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);

  if (!memories[0]) {
    return res.status(404).json({ message: "Memory was not found." });
  }

  req.memory = memories[0];
  return next();
}

app.get("/", (req, res) => {
  res.send("API is running");
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, inviteCode } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedInvite = String(inviteCode || "").trim().toUpperCase();

    if (!fullName || !normalizedEmail || !normalizedPhone || !password || !normalizedInvite) {
      return res.status(400).json({
        message: "Full name, email, phone, password, and invitation code are required.",
      });
    }

    const [codes] = await db.execute(
      "SELECT * FROM invitation_codes WHERE code = ? AND is_active = 1 LIMIT 1",
      [normalizedInvite]
    );

    if (!codes[0]) {
      return res.status(403).json({ message: "Invitation code is invalid." });
    }

    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1",
      [normalizedEmail, normalizedPhone]
    );

    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "An account already exists with that email or phone number." });
    }

    const role = normalizedEmail === ADMIN_EMAIL ? "admin" : "member";
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, invite_code, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName.trim(), normalizedEmail, normalizedPhone, passwordHash, normalizedInvite, role]
    );

    const [users] = await db.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [
      result.insertId,
    ]);
    await logAction(result.insertId, "user_registered", `${normalizedEmail} registered as ${role}`);

    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(users[0]),
      user: getPublicUser(users[0]),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Unable to create account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      await db.execute("UPDATE users SET role = 'admin' WHERE email = ?", [ADMIN_EMAIL]);
    }

    const [users] = await db.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [
      normalizedEmail,
    ]);
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    await logAction(user.id, "user_logged_in", user.email);
    return res.json({
      message: "Signed in successfully.",
      token: createToken(user),
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to sign in right now." });
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  return res.json({ user: getPublicUser(req.user) });
});

app.get("/api/dashboard", authenticate, async (req, res) => {
  const [[tripStats], [memoryStats], [activityStats]] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM trips"),
    db.execute("SELECT COUNT(*) AS count FROM memories"),
    db.execute("SELECT COUNT(*) AS count FROM trip_activities"),
  ]);

  return res.json({
    stats: {
      trips: tripStats[0].count,
      memories: memoryStats[0].count,
      plans: activityStats[0].count,
    },
    user: getPublicUser(req.user),
  });
});

app.get("/api/trips", authenticate, async (req, res) => {
  const [trips] = await db.execute(
    `SELECT trips.*, users.full_name AS creator_name,
      (SELECT COUNT(*) FROM trip_activities WHERE trip_activities.trip_id = trips.id) AS activity_count
     FROM trips
     LEFT JOIN users ON users.id = trips.created_by
     ORDER BY COALESCE(start_date, created_at) DESC`
  );

  return res.json({ trips });
});

app.post("/api/trips", authenticate, async (req, res) => {
  const { title, destination, startDate, endDate, notes } = req.body;

  if (!title || !destination) {
    return res.status(400).json({ message: "Trip title and destination are required." });
  }

  const [result] = await db.execute(
    `INSERT INTO trips (title, destination, start_date, end_date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title.trim(), destination.trim(), startDate || null, endDate || null, notes || null, req.user.id]
  );

  await logAction(req.user.id, "trip_created", title);
  return res.status(201).json({ id: result.insertId });
});

app.get("/api/trips/:id", authenticate, loadTrip, async (req, res) => {
  const [[days], [activities]] = await Promise.all([
    db.execute("SELECT * FROM trip_days WHERE trip_id = ? ORDER BY day_number ASC", [
      req.trip.id,
    ]),
    db.execute(
      `SELECT trip_activities.*, users.full_name AS creator_name
       FROM trip_activities
       LEFT JOIN users ON users.id = trip_activities.created_by
       WHERE trip_id = ?
       ORDER BY day_number ASC, planned_time ASC, id ASC`,
      [req.trip.id]
    ),
  ]);

  return res.json({ trip: req.trip, days, activities });
});

app.put("/api/trips/:id", authenticate, loadTrip, async (req, res) => {
  if (!canManage(req, req.trip.created_by)) {
    return res.status(403).json({ message: "You can only edit trips you created." });
  }

  const { title, destination, startDate, endDate, notes } = req.body;
  await db.execute(
    `UPDATE trips SET title = ?, destination = ?, start_date = ?, end_date = ?, notes = ?
     WHERE id = ?`,
    [title, destination, startDate || null, endDate || null, notes || null, req.trip.id]
  );

  await logAction(req.user.id, "trip_updated", title);
  return res.json({ message: "Trip updated." });
});

app.delete("/api/trips/:id", authenticate, loadTrip, async (req, res) => {
  if (!canManage(req, req.trip.created_by)) {
    return res.status(403).json({ message: "You can only delete trips you created." });
  }

  await db.execute("DELETE FROM trips WHERE id = ?", [req.trip.id]);
  await logAction(req.user.id, "trip_deleted", req.trip.title);
  return res.json({ message: "Trip deleted." });
});

app.post("/api/trips/:id/days", authenticate, loadTrip, async (req, res) => {
  if (!canManage(req, req.trip.created_by)) {
    return res.status(403).json({ message: "You can only manage days for trips you created." });
  }

  const { dayNumber, date, title } = req.body;
  await db.execute(
    `INSERT INTO trip_days (trip_id, day_number, trip_date, title)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE trip_date = VALUES(trip_date), title = VALUES(title)`,
    [req.trip.id, dayNumber, date || null, title || `Day ${dayNumber}`]
  );

  await logAction(req.user.id, "trip_day_saved", `${req.trip.title} day ${dayNumber}`);
  return res.status(201).json({ message: "Day saved." });
});

app.post("/api/trips/:id/activities", authenticate, loadTrip, async (req, res) => {
  const { dayNumber, type, title, plannedTime, notes } = req.body;

  if (!dayNumber || !title) {
    return res.status(400).json({ message: "Day number and title are required." });
  }

  const [result] = await db.execute(
    `INSERT INTO trip_activities (trip_id, day_number, type, title, planned_time, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.trip.id, dayNumber, type || "plan", title.trim(), plannedTime || null, notes || null, req.user.id]
  );

  await logAction(req.user.id, "activity_created", title);
  return res.status(201).json({ id: result.insertId });
});

app.put("/api/activities/:id", authenticate, async (req, res) => {
  const [activities] = await db.execute("SELECT * FROM trip_activities WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const activity = activities[0];

  if (!activity) {
    return res.status(404).json({ message: "Plan item was not found." });
  }

  if (!canManage(req, activity.created_by)) {
    return res.status(403).json({ message: "You can only edit plan items you created." });
  }

  const { dayNumber, type, title, plannedTime, notes } = req.body;
  await db.execute(
    `UPDATE trip_activities SET day_number = ?, type = ?, title = ?, planned_time = ?, notes = ?
     WHERE id = ?`,
    [dayNumber, type || "plan", title, plannedTime || null, notes || null, activity.id]
  );

  await logAction(req.user.id, "activity_updated", title);
  return res.json({ message: "Plan item updated." });
});

app.delete("/api/activities/:id", authenticate, async (req, res) => {
  const [activities] = await db.execute("SELECT * FROM trip_activities WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const activity = activities[0];

  if (!activity) {
    return res.status(404).json({ message: "Plan item was not found." });
  }

  if (!canManage(req, activity.created_by)) {
    return res.status(403).json({ message: "You can only delete plan items you created." });
  }

  await db.execute("DELETE FROM trip_activities WHERE id = ?", [activity.id]);
  await logAction(req.user.id, "activity_deleted", activity.title);
  return res.json({ message: "Plan item deleted." });
});

app.get("/api/memories", authenticate, async (req, res) => {
  const [memories] = await db.execute(
    `SELECT memories.*, trips.title AS trip_title, users.full_name AS creator_name
     FROM memories
     LEFT JOIN trips ON trips.id = memories.trip_id
     LEFT JOIN users ON users.id = memories.created_by
     ORDER BY memories.memory_date DESC, memories.created_at DESC`
  );

  return res.json({ memories });
});

app.post("/api/memories", authenticate, async (req, res) => {
  const { tripId, title, story, mediaUrl, mediaReference, mediaType, memoryDate } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Memory title is required." });
  }

  const [result] = await db.execute(
    `INSERT INTO memories
      (trip_id, title, story, media_url, media_reference, media_type, memory_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tripId || null,
      title.trim(),
      story || null,
      mediaUrl || null,
      mediaReference || null,
      mediaType || "photo",
      memoryDate || null,
      req.user.id,
    ]
  );

  await logAction(req.user.id, "memory_created", title);
  return res.status(201).json({ id: result.insertId });
});

app.put("/api/memories/:id", authenticate, loadMemory, async (req, res) => {
  if (!canManage(req, req.memory.created_by)) {
    return res.status(403).json({ message: "You can only edit memories you created." });
  }

  const { tripId, title, story, mediaUrl, mediaReference, mediaType, memoryDate } = req.body;
  await db.execute(
    `UPDATE memories
     SET trip_id = ?, title = ?, story = ?, media_url = ?, media_reference = ?,
       media_type = ?, memory_date = ?
     WHERE id = ?`,
    [
      tripId || null,
      title,
      story || null,
      mediaUrl || null,
      mediaReference || null,
      mediaType || "photo",
      memoryDate || null,
      req.memory.id,
    ]
  );

  await logAction(req.user.id, "memory_updated", title);
  return res.json({ message: "Memory updated." });
});

app.delete("/api/memories/:id", authenticate, loadMemory, async (req, res) => {
  if (!canManage(req, req.memory.created_by)) {
    return res.status(403).json({ message: "You can only delete memories you created." });
  }

  await db.execute("DELETE FROM memories WHERE id = ?", [req.memory.id]);
  await logAction(req.user.id, "memory_deleted", req.memory.title);
  return res.json({ message: "Memory deleted." });
});

app.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
  const [users] = await db.execute(
    "SELECT id, full_name, email, phone, role, invite_code, created_at FROM users ORDER BY created_at DESC"
  );
  return res.json({ users });
});

app.put("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
  const { fullName, phone, role } = req.body;
  await db.execute("UPDATE users SET full_name = ?, phone = ?, role = ? WHERE id = ?", [
    fullName,
    phone,
    role === "admin" ? "admin" : "member",
    req.params.id,
  ]);
  await logAction(req.user.id, "admin_user_updated", `user ${req.params.id}`);
  return res.json({ message: "User updated." });
});

app.delete("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
  if (Number(req.params.id) === Number(req.user.id)) {
    return res.status(400).json({ message: "You cannot delete your own admin account." });
  }

  await db.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
  await logAction(req.user.id, "admin_user_deleted", `user ${req.params.id}`);
  return res.json({ message: "User deleted." });
});

app.get("/api/admin/invites", authenticate, requireAdmin, async (req, res) => {
  const [codes] = await db.execute("SELECT * FROM invitation_codes ORDER BY created_at DESC");
  return res.json({ codes });
});

app.post("/api/admin/invites", authenticate, requireAdmin, async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();

  if (!code) {
    return res.status(400).json({ message: "Invitation code is required." });
  }

  await db.execute(
    `INSERT INTO invitation_codes (code, is_active, created_by)
     VALUES (?, 1, ?)
     ON DUPLICATE KEY UPDATE is_active = 1`,
    [code, req.user.id]
  );
  await logAction(req.user.id, "invite_code_set", code);
  return res.status(201).json({ message: "Invitation code saved." });
});

app.put("/api/admin/invites/:id", authenticate, requireAdmin, async (req, res) => {
  await db.execute("UPDATE invitation_codes SET is_active = ? WHERE id = ?", [
    req.body.isActive ? 1 : 0,
    req.params.id,
  ]);
  await logAction(req.user.id, "invite_code_updated", `invite ${req.params.id}`);
  return res.json({ message: "Invitation code updated." });
});

app.get("/api/admin/settings", authenticate, requireAdmin, async (req, res) => {
  const [settings] = await db.execute("SELECT * FROM system_settings ORDER BY setting_key ASC");
  return res.json({ settings });
});

app.put("/api/admin/settings", authenticate, requireAdmin, async (req, res) => {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ message: "Setting key is required." });
  }

  await db.execute(
    `INSERT INTO system_settings (setting_key, setting_value, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
    [key, value || "", req.user.id]
  );
  await logAction(req.user.id, "system_setting_updated", key);
  return res.json({ message: "Setting saved." });
});

app.get("/api/admin/audit-logs", authenticate, requireAdmin, async (req, res) => {
  const [logs] = await db.execute(
    `SELECT audit_logs.*, users.full_name AS user_name, users.email AS user_email
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ORDER BY audit_logs.created_at DESC
     LIMIT 100`
  );
  return res.json({ logs });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
