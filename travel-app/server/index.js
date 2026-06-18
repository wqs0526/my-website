const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("./src/db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const CLIENT_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "";
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean),
];

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required in .env");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
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

function normalizeMemberIds(memberIds) {
  if (!Array.isArray(memberIds)) return [];
  return [...new Set(memberIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
}

async function syncMemoryMembers(memoryId, memberIds, addedBy) {
  await db.execute("DELETE FROM memory_members WHERE memory_id = ?", [memoryId]);

  for (const userId of normalizeMemberIds(memberIds)) {
    await db.execute(
      "INSERT IGNORE INTO memory_members (memory_id, user_id, added_by) VALUES (?, ?, ?)",
      [memoryId, userId, addedBy || null]
    );
  }
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

app.get("/api/users", authenticate, async (req, res) => {
  const [users] = await db.execute(
    "SELECT id, full_name, email, role FROM users ORDER BY full_name ASC, email ASC"
  );
  return res.json({ users });
});

app.get("/api/dashboard", authenticate, async (req, res) => {
  const [[tripStats], [memoryStats], [activityStats], [completedStats], [upcomingStats]] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM trips"),
    db.execute("SELECT COUNT(*) AS count FROM memories"),
    db.execute("SELECT COUNT(*) AS count FROM trip_activities"),
    db.execute("SELECT COUNT(*) AS count FROM trips WHERE end_date IS NOT NULL AND end_date < CURDATE()"),
    db.execute("SELECT COUNT(*) AS count FROM trips WHERE start_date IS NOT NULL AND start_date > CURDATE()"),
  ]);

  return res.json({
    stats: {
      trips: tripStats[0].count,
      memories: memoryStats[0].count,
      plans: activityStats[0].count,
      completedTrips: completedStats[0].count,
      upcomingTrips: upcomingStats[0].count,
    },
    user: getPublicUser(req.user),
  });
});

app.get("/api/profile/stats", authenticate, async (req, res) => {
  const [[tripStats], [memoryStats], [activityStats], [completedStats], [upcomingStats]] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM trips WHERE created_by = ?", [req.user.id]),
    db.execute("SELECT COUNT(*) AS count FROM memories WHERE created_by = ?", [req.user.id]),
    db.execute("SELECT COUNT(*) AS count FROM trip_activities WHERE created_by = ?", [req.user.id]),
    db.execute("SELECT COUNT(*) AS count FROM trips WHERE created_by = ? AND end_date IS NOT NULL AND end_date < CURDATE()", [req.user.id]),
    db.execute("SELECT COUNT(*) AS count FROM trips WHERE created_by = ? AND start_date IS NOT NULL AND start_date > CURDATE()", [req.user.id]),
  ]);

  return res.json({
    stats: {
      trips: tripStats[0].count,
      memories: memoryStats[0].count,
      activities: activityStats[0].count,
      completedTrips: completedStats[0].count,
      upcomingTrips: upcomingStats[0].count,
    },
  });
});

app.get("/api/trips", authenticate, async (req, res) => {
  const [trips] = await db.execute(
    `SELECT trips.*, users.full_name AS creator_name,
      (SELECT COUNT(*) FROM trip_activities WHERE trip_activities.trip_id = trips.id) AS activity_count,
      (SELECT COUNT(*) FROM trip_members WHERE trip_members.trip_id = trips.id) AS member_count
     FROM trips
     LEFT JOIN users ON users.id = trips.created_by
     ORDER BY COALESCE(trips.start_date, trips.created_at) DESC`
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
  await db.execute("INSERT IGNORE INTO trip_members (trip_id, user_id, added_by) VALUES (?, ?, ?)", [
    result.insertId,
    req.user.id,
    req.user.id,
  ]);

  await logAction(req.user.id, "trip_created", title);
  return res.status(201).json({ id: result.insertId });
});

app.get("/api/trips/:id", authenticate, loadTrip, async (req, res) => {
  const [[days], [activities], [packingItems], [expenses], [members], [availableUsers]] = await Promise.all([
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
    db.execute("SELECT * FROM packing_items WHERE trip_id = ? ORDER BY is_checked ASC, created_at DESC", [
      req.trip.id,
    ]),
    db.execute("SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY created_at DESC", [
      req.trip.id,
    ]),
    db.execute(
      `SELECT users.id, users.full_name, users.email, users.role, trip_members.created_at
       FROM trip_members
       JOIN users ON users.id = trip_members.user_id
       WHERE trip_members.trip_id = ?
       ORDER BY users.full_name ASC`,
      [req.trip.id]
    ),
    db.execute("SELECT id, full_name, email, role FROM users ORDER BY full_name ASC, email ASC"),
  ]);

  return res.json({ trip: req.trip, days, activities, packingItems, expenses, members, availableUsers });
});

app.post("/api/trips/:id/members", authenticate, loadTrip, async (req, res) => {
  if (!canManage(req, req.trip.created_by)) {
    return res.status(403).json({ message: "You can only add members to trips you created." });
  }

  const userId = Number(req.body.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Please choose a valid member." });
  }

  const [users] = await db.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  if (!users[0]) {
    return res.status(404).json({ message: "Member was not found." });
  }

  await db.execute("INSERT IGNORE INTO trip_members (trip_id, user_id, added_by) VALUES (?, ?, ?)", [
    req.trip.id,
    userId,
    req.user.id,
  ]);
  await logAction(req.user.id, "trip_member_added", `${req.trip.title}: user ${userId}`);
  return res.status(201).json({ message: "Member added to trip." });
});

app.delete("/api/trips/:id/members/:userId", authenticate, loadTrip, async (req, res) => {
  if (!canManage(req, req.trip.created_by)) {
    return res.status(403).json({ message: "You can only remove members from trips you created." });
  }

  await db.execute("DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?", [
    req.trip.id,
    req.params.userId,
  ]);
  await logAction(req.user.id, "trip_member_removed", `${req.trip.title}: user ${req.params.userId}`);
  return res.json({ message: "Member removed from trip." });
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

app.put("/api/trip-days/:id", authenticate, async (req, res) => {
  const [days] = await db.execute("SELECT * FROM trip_days WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const day = days[0];

  if (!day) {
    return res.status(404).json({ message: "Trip day was not found." });
  }

  const [trips] = await db.execute("SELECT * FROM trips WHERE id = ? LIMIT 1", [
    day.trip_id,
  ]);
  const trip = trips[0];

  if (!trip || !canManage(req, trip.created_by)) {
    return res.status(403).json({ message: "You can only edit days for trips you created." });
  }

  const { dayNumber, date, title } = req.body;
  await db.execute(
    "UPDATE trip_days SET day_number = ?, trip_date = ?, title = ? WHERE id = ?",
    [dayNumber, date || null, title || `Day ${dayNumber}`, day.id]
  );
  await db.execute("UPDATE trip_activities SET day_number = ? WHERE trip_id = ? AND day_number = ?", [
    dayNumber,
    day.trip_id,
    day.day_number,
  ]);

  await logAction(req.user.id, "trip_day_updated", `${trip.title} day ${dayNumber}`);
  return res.json({ message: "Day updated." });
});

app.delete("/api/trip-days/:id", authenticate, async (req, res) => {
  const [days] = await db.execute("SELECT * FROM trip_days WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const day = days[0];

  if (!day) {
    return res.status(404).json({ message: "Trip day was not found." });
  }

  const [trips] = await db.execute("SELECT * FROM trips WHERE id = ? LIMIT 1", [
    day.trip_id,
  ]);
  const trip = trips[0];

  if (!trip || !canManage(req, trip.created_by)) {
    return res.status(403).json({ message: "You can only delete days for trips you created." });
  }

  await db.execute("DELETE FROM trip_activities WHERE trip_id = ? AND day_number = ?", [
    day.trip_id,
    day.day_number,
  ]);
  await db.execute("DELETE FROM trip_days WHERE id = ?", [day.id]);
  await logAction(req.user.id, "trip_day_deleted", `${trip.title} day ${day.day_number}`);
  return res.json({ message: "Day deleted." });
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

app.post("/api/trips/:id/packing-items", authenticate, loadTrip, async (req, res) => {
  const itemText = String(req.body.itemText || "").trim();

  if (!itemText) {
    return res.status(400).json({ message: "Packing item is required." });
  }

  const [result] = await db.execute(
    "INSERT INTO packing_items (trip_id, item_text, created_by) VALUES (?, ?, ?)",
    [req.trip.id, itemText, req.user.id]
  );

  await logAction(req.user.id, "packing_item_created", itemText);
  return res.status(201).json({ id: result.insertId });
});

app.put("/api/packing-items/:id", authenticate, async (req, res) => {
  const [items] = await db.execute("SELECT * FROM packing_items WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const item = items[0];

  if (!item) {
    return res.status(404).json({ message: "Packing item was not found." });
  }

  const [trips] = await db.execute("SELECT * FROM trips WHERE id = ? LIMIT 1", [item.trip_id]);
  const trip = trips[0];

  if (!trip || !canManage(req, trip.created_by)) {
    return res.status(403).json({ message: "You can only manage packing items for trips you created." });
  }

  await db.execute("UPDATE packing_items SET item_text = ?, is_checked = ? WHERE id = ?", [
    String(req.body.itemText || item.item_text).trim(),
    req.body.isChecked ? 1 : 0,
    item.id,
  ]);

  await logAction(req.user.id, "packing_item_updated", item.item_text);
  return res.json({ message: "Packing item updated." });
});

app.delete("/api/packing-items/:id", authenticate, async (req, res) => {
  const [items] = await db.execute("SELECT * FROM packing_items WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const item = items[0];

  if (!item) {
    return res.status(404).json({ message: "Packing item was not found." });
  }

  const [trips] = await db.execute("SELECT * FROM trips WHERE id = ? LIMIT 1", [item.trip_id]);
  const trip = trips[0];

  if (!trip || !canManage(req, trip.created_by)) {
    return res.status(403).json({ message: "You can only manage packing items for trips you created." });
  }

  await db.execute("DELETE FROM packing_items WHERE id = ?", [item.id]);
  await logAction(req.user.id, "packing_item_deleted", item.item_text);
  return res.json({ message: "Packing item deleted." });
});

app.post("/api/trips/:id/expenses", authenticate, loadTrip, async (req, res) => {
  const { category, estimatedAmount, actualAmount, paidBy, notes } = req.body;
  const allowedCategories = ["Flights", "Hotel", "Food", "Transport", "Attractions", "Shopping", "Other"];

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ message: "Expense category is invalid." });
  }

  const [result] = await db.execute(
    `INSERT INTO trip_expenses
      (trip_id, category, estimated_amount, actual_amount, paid_by, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.trip.id,
      category,
      Number(estimatedAmount || 0),
      Number(actualAmount || 0),
      paidBy || null,
      notes || null,
      req.user.id,
    ]
  );

  await logAction(req.user.id, "trip_expense_created", category);
  return res.status(201).json({ id: result.insertId });
});

app.delete("/api/expenses/:id", authenticate, async (req, res) => {
  const [expenses] = await db.execute("SELECT * FROM trip_expenses WHERE id = ? LIMIT 1", [
    req.params.id,
  ]);
  const expense = expenses[0];

  if (!expense) {
    return res.status(404).json({ message: "Expense was not found." });
  }

  const [trips] = await db.execute("SELECT * FROM trips WHERE id = ? LIMIT 1", [expense.trip_id]);
  const trip = trips[0];

  if (!trip || !canManage(req, trip.created_by)) {
    return res.status(403).json({ message: "You can only manage expenses for trips you created." });
  }

  await db.execute("DELETE FROM trip_expenses WHERE id = ?", [expense.id]);
  await logAction(req.user.id, "trip_expense_deleted", expense.category);
  return res.json({ message: "Expense deleted." });
});

app.get("/api/memories", authenticate, async (req, res) => {
  const [memories] = await db.execute(
    `SELECT memories.*, trips.title AS trip_title, users.full_name AS creator_name,
      (SELECT COUNT(*) FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND reaction = 'love') AS love_count,
      (SELECT COUNT(*) FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND reaction = 'funny') AS funny_count,
      (SELECT COUNT(*) FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND reaction = 'beautiful') AS beautiful_count,
      (SELECT COUNT(*) FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND reaction = 'emotional') AS emotional_count,
      EXISTS(SELECT 1 FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND memory_reactions.user_id = ? AND reaction = 'love') AS reacted_love,
      EXISTS(SELECT 1 FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND memory_reactions.user_id = ? AND reaction = 'funny') AS reacted_funny,
      EXISTS(SELECT 1 FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND memory_reactions.user_id = ? AND reaction = 'beautiful') AS reacted_beautiful,
      EXISTS(SELECT 1 FROM memory_reactions WHERE memory_reactions.memory_id = memories.id AND memory_reactions.user_id = ? AND reaction = 'emotional') AS reacted_emotional
     FROM memories
     LEFT JOIN trips ON trips.id = memories.trip_id
     LEFT JOIN users ON users.id = memories.created_by
     ORDER BY memories.memory_date DESC, memories.created_at DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id]
  );

  if (memories.length) {
    const memoryIds = memories.map((memory) => memory.id);
    const placeholders = memoryIds.map(() => "?").join(",");
    const [members] = await db.execute(
      `SELECT memory_members.memory_id, users.id, users.full_name, users.email, users.role
       FROM memory_members
       JOIN users ON users.id = memory_members.user_id
       WHERE memory_members.memory_id IN (${placeholders})
       ORDER BY users.full_name ASC`,
      memoryIds
    );
    const membersByMemory = members.reduce((groups, member) => {
      groups[member.memory_id] = groups[member.memory_id] || [];
      groups[member.memory_id].push(member);
      return groups;
    }, {});

    memories.forEach((memory) => {
      memory.members = membersByMemory[memory.id] || [];
    });
  }

  return res.json({ memories });
});

app.post("/api/memories", authenticate, async (req, res) => {
  const { tripId, title, story, mediaUrl, mediaReference, mediaType, memoryDate, memberIds } = req.body;

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
  await syncMemoryMembers(result.insertId, memberIds, req.user.id);

  await logAction(req.user.id, "memory_created", title);
  return res.status(201).json({ id: result.insertId });
});

app.put("/api/memories/:id", authenticate, loadMemory, async (req, res) => {
  if (!canManage(req, req.memory.created_by)) {
    return res.status(403).json({ message: "You can only edit memories you created." });
  }

  const { tripId, title, story, mediaUrl, mediaReference, mediaType, memoryDate, memberIds } = req.body;
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
  await syncMemoryMembers(req.memory.id, memberIds, req.user.id);

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

app.post("/api/memories/:id/reactions", authenticate, loadMemory, async (req, res) => {
  const reaction = String(req.body.reaction || "").trim();
  const allowedReactions = ["love", "funny", "beautiful", "emotional"];

  if (!allowedReactions.includes(reaction)) {
    return res.status(400).json({ message: "Reaction is invalid." });
  }

  await db.execute(
    `INSERT IGNORE INTO memory_reactions (memory_id, user_id, reaction)
     VALUES (?, ?, ?)`,
    [req.memory.id, req.user.id, reaction]
  );

  await logAction(req.user.id, "memory_reacted", `${reaction} on ${req.memory.title}`);
  return res.status(201).json({ message: "Reaction saved." });
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
