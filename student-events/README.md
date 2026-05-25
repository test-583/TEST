# EventSphere — Student Events App
### Complete Guide: How It Works + How to Deploy (Free)

---

## 🗂️ Project Structure

```
student-events/
├── backend/
│   ├── server.js        ← Express server (API)
│   ├── db.js            ← MySQL connection
│   ├── package.json     ← Node.js dependencies
│   └── .env.example     ← Template for secrets
│
└── frontend/
    ├── index.html       ← The webpage
    ├── style.css        ← Styling
    └── app.js           ← JavaScript (talks to backend)
```

---

## 🧠 PART 1 — How the Backend Works

The backend is a **Node.js + Express** server. Think of it like a waiter at a restaurant:

- **Frontend** = Customer who orders food
- **Backend**  = Waiter who takes the order, goes to kitchen, brings food back
- **MySQL**    = Kitchen that stores/retrieves data

### What Express Does
Express is a library that lets you say:
_"When someone sends a GET request to `/api/events`, run this function."_

```js
app.get("/api/events", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM events");
  res.json(rows);  // sends data back to frontend
});
```

That's literally it. `req` = what came in, `res` = what you send back.

### Your API Endpoints (Routes)

| Method | URL                         | What it does                     |
|--------|-----------------------------|----------------------------------|
| GET    | /api/events                 | Get all events                   |
| GET    | /api/events/:id             | Get one event by ID              |
| POST   | /api/events                 | Create a new event               |
| DELETE | /api/events/:id             | Delete an event                  |
| POST   | /api/register               | Register a student for an event  |
| GET    | /api/events/:id/registrations | Get all registrations for event |

### How MySQL is Connected
`db.js` creates a **connection pool** — a group of reusable connections to MySQL.

```js
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
module.exports = pool.promise(); // use async/await
```

The `.env` file keeps secrets safe (never put passwords in code!).

### Database Tables

**events table:**
```
id | title | description | venue | event_date | event_time | max_seats | created_at
```

**registrations table:**
```
id | event_id | name | email | roll_no | dept | created_at
```

`event_id` is a **Foreign Key** — it links a registration to an event.
The `UNIQUE KEY (event_id, email)` prevents the same student from registering twice.

---

## 🎨 PART 2 — How the Frontend Works

The frontend is just **HTML + CSS + JavaScript**. No React, no framework — pure and simple.

- `index.html` = the structure (what's on the page)
- `style.css`  = how it looks (colors, fonts, layout)
- `app.js`     = behavior (what happens when you click buttons)

### The Key Concept: `fetch()`

`fetch()` is a built-in browser function that sends HTTP requests to your backend:

```js
// GET request — fetch all events
const res    = await fetch("https://your-backend.railway.app/api/events");
const events = await res.json(); // converts response to JavaScript object

// POST request — send data to backend
const res = await fetch("https://your-backend.railway.app/api/register", {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify({ name: "Rahul", email: "r@gmail.com", ... }),
});
```

### How Cards Are Built Dynamically

Instead of hardcoding event cards in HTML, `app.js` builds them from the API data:

```js
events.forEach(ev => {
  const card = document.createElement("div"); // create empty div
  card.innerHTML = `<h3>${ev.title}</h3>...`; // fill it
  grid.appendChild(card);                      // add to page
});
```

This means your page is **always up to date** with the database — no hardcoding needed.

---

## 🔗 PART 3 — How Frontend + Backend Work Together

Here's the complete journey of a student registering for an event:

```
Student clicks "Register →"
        ↓
openModal() runs in app.js
  (shows the registration form)
        ↓
Student fills form and submits
        ↓
fetch() sends POST to /api/register
  with { name, email, roll_no, dept, event_id }
        ↓
Backend server.js receives it
        ↓
Backend checks: is event full? already registered?
        ↓
Backend runs SQL: INSERT INTO registrations (...)
        ↓
MySQL saves the row
        ↓
Backend sends back: { message: "Successfully registered! 🎉" }
        ↓
frontend app.js shows the message to student
        ↓
loadEvents() refreshes the cards (seat count updates)
```

### CORS — Why It's Needed
When your frontend (Netlify) talks to your backend (Railway), browsers block this by default for security. `cors()` middleware tells the browser "it's okay, I allow this."

```js
app.use(cors()); // in server.js — allows any frontend to call this backend
```

---

## 🚀 PART 4 — Free Hosting Setup

### Backend + MySQL → Railway (100% Free)

1. Go to **railway.app** → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Push your `backend/` folder to a GitHub repo and connect it
4. In your Railway project, click **+ New** → **Database** → **MySQL**
5. Railway gives you: HOST, USER, PASSWORD, PORT — copy these
6. In Railway, go to your backend service → **Variables** → Add:
   ```
   DB_HOST     = (from Railway MySQL)
   DB_USER     = (from Railway MySQL)
   DB_PASSWORD = (from Railway MySQL)
   DB_NAME     = railway
   DB_PORT     = 3306
   ```
7. Railway auto-detects `package.json` and runs `npm start`
8. Your backend URL will be something like: `https://student-events.up.railway.app`

### Frontend → Netlify (100% Free)

1. Go to **netlify.com** → Sign up with GitHub
2. Push your `frontend/` folder to a GitHub repo
3. In Netlify, click **Add new site** → **Import from Git** → select your repo
4. Build command: leave empty  |  Publish directory: `.`
5. Click **Deploy site**
6. Your frontend URL will be like: `https://eventsphere.netlify.app`

### Final Step: Connect Frontend to Backend

In `frontend/app.js`, line 6:
```js
// Change this:
const API = "https://YOUR-BACKEND-URL.up.railway.app";

// To your actual Railway URL:
const API = "https://student-events-production.up.railway.app";
```

Push to GitHub → Netlify auto-rebuilds → Done! 🎉

---

## ✅ Features Summary

- View all upcoming events with seat availability
- Register for events (duplicate prevention by email)
- Add new events (admin panel)
- Delete events
- Full MySQL database with 2 tables
- Responsive design (works on mobile)
- Deployed free on Railway + Netlify

---

## 🧪 Test Locally

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in your MySQL credentials
node server.js         # runs on localhost:3000

# Frontend — just open index.html in your browser
# But first change API in app.js to: http://localhost:3000
```

---
