// server.js — The main backend file. Think of this as the "brain" of your app.
// It listens for HTTP requests from the frontend and talks to MySQL.

const express = require("express");
const cors    = require("cors");
const db      = require("./db");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
// express.json()  → lets Express read JSON bodies sent from the frontend
// cors()          → allows your frontend (different domain) to talk to this backend
app.use(express.json());
app.use(cors());

// ─── DATABASE SETUP ─────────────────────────────────────────────────────────────
// This runs once on startup to create tables if they don't exist yet.
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(150)  NOT NULL,
      description TEXT,
      venue       VARCHAR(150)  NOT NULL,
      event_date  DATE          NOT NULL,
      event_time  VARCHAR(20)   NOT NULL,
      max_seats   INT           DEFAULT 100,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS registrations (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      event_id   INT          NOT NULL,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(150) NOT NULL,
      roll_no    VARCHAR(30)  NOT NULL,
      dept       VARCHAR(80)  NOT NULL,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE KEY unique_reg (event_id, email)   -- prevents double registration
    )
  `);

  console.log("✅ Tables ready.");
}

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// GET /api/events
// Returns all events, newest first, with a count of how many registered.
app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT e.*,
             COUNT(r.id) AS registered_count
      FROM   events e
      LEFT JOIN registrations r ON r.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id
// Returns a single event by ID.
app.get("/api/events/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM events WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Event not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
// Creates a new event. Body: { title, description, venue, event_date, event_time, max_seats }
app.post("/api/events", async (req, res) => {
  const { title, description, venue, event_date, event_time, max_seats } = req.body;
  if (!title || !venue || !event_date || !event_time) {
    return res.status(400).json({ error: "title, venue, event_date, event_time are required." });
  }
  try {
    const [result] = await db.execute(
      "INSERT INTO events (title, description, venue, event_date, event_time, max_seats) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description || "", venue, event_date, event_time, max_seats || 100]
    );
    res.status(201).json({ message: "Event created!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
// Deletes an event (and all its registrations via CASCADE).
app.delete("/api/events/:id", async (req, res) => {
  try {
    await db.execute("DELETE FROM events WHERE id = ?", [req.params.id]);
    res.json({ message: "Event deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/register
// Registers a student for an event. Body: { event_id, name, email, roll_no, dept }
app.post("/api/register", async (req, res) => {
  const { event_id, name, email, roll_no, dept } = req.body;
  if (!event_id || !name || !email || !roll_no || !dept) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    // Check if event exists and has seats left
    const [events] = await db.execute(
      `SELECT e.max_seats, COUNT(r.id) AS registered_count
       FROM events e LEFT JOIN registrations r ON r.event_id = e.id
       WHERE e.id = ? GROUP BY e.id`,
      [event_id]
    );
    if (events.length === 0) return res.status(404).json({ error: "Event not found." });

    const { max_seats, registered_count } = events[0];
    if (registered_count >= max_seats) {
      return res.status(400).json({ error: "Sorry, event is full!" });
    }

    await db.execute(
      "INSERT INTO registrations (event_id, name, email, roll_no, dept) VALUES (?, ?, ?, ?, ?)",
      [event_id, name, email, roll_no, dept]
    );
    res.status(201).json({ message: "Successfully registered! 🎉" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "You have already registered for this event!" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id/registrations
// Returns all students registered for an event.
app.get("/api/events/:id/registrations", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT name, email, roll_no, dept, created_at FROM registrations WHERE event_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── START SERVER ──────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
