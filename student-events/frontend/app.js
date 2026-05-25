// app.js — This is the frontend brain.
// It talks to your backend using fetch() (HTTP requests)
// and updates the HTML page dynamically — no page reloads needed.

// ── IMPORTANT: Change this to your Railway backend URL after deploying ──────
const API = "https://YOUR-BACKEND-URL.up.railway.app";
// While testing locally: const API = "http://localhost:3000";

// ─── LOAD EVENTS ──────────────────────────────────────────────────────────────
// Called once when the page loads.
async function loadEvents() {
  const grid    = document.getElementById("events-grid");
  const noEvts  = document.getElementById("no-events");
  const counter = document.getElementById("event-count");

  try {
    // fetch() sends a GET request to /api/events on the backend
    const res    = await fetch(`${API}/api/events`);
    const events = await res.json();

    counter.textContent = `${events.length} events`;

    if (events.length === 0) {
      noEvts.style.display = "block";
      return;
    }

    grid.innerHTML = ""; // clear old cards
    events.forEach((ev, i) => {
      const card = buildCard(ev, i);
      grid.appendChild(card);
    });
  } catch (err) {
    counter.textContent = "Error";
    grid.innerHTML = `<p style="color:#e84e1b">Could not connect to backend. Is it running?</p>`;
    console.error(err);
  }
}

// ─── BUILD A CARD ─────────────────────────────────────────────────────────────
function buildCard(ev, index) {
  const card   = document.createElement("div");
  card.className = "event-card";
  card.style.animationDelay = `${index * 0.06}s`;

  const date    = new Date(ev.event_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  const left    = ev.max_seats - ev.registered_count;
  const isFull  = left <= 0;

  card.innerHTML = `
    <div class="card-meta">
      <span class="card-date">📅 ${date} · ${ev.event_time}</span>
      <span class="card-seats ${isFull ? "full" : ""}">${isFull ? "FULL" : `${left} seats left`}</span>
    </div>
    <h3>${ev.title}</h3>
    <p class="card-desc">${ev.description || "No description provided."}</p>
    <div class="card-footer">
      <span class="card-venue">📍 <strong>${ev.venue}</strong></span>
      <div style="display:flex;gap:0.5rem;align-items:center">
        <button class="btn-delete" title="Delete event" onclick="deleteEvent(${ev.id})">🗑</button>
        <button class="btn-register" onclick="openModal(${ev.id}, '${ev.title.replace(/'/g,"\\'")}', ${isFull})"
          ${isFull ? "disabled" : ""}>
          ${isFull ? "Full" : "Register →"}
        </button>
      </div>
    </div>
  `;
  return card;
}

// ─── REGISTRATION MODAL ───────────────────────────────────────────────────────
function openModal(eventId, title, isFull) {
  if (isFull) return;
  document.getElementById("reg-event-id").value = eventId;
  document.getElementById("reg-event-title").textContent = title;
  document.getElementById("reg-msg").textContent = "";
  document.getElementById("reg-form").reset();
  document.getElementById("reg-event-id").value = eventId; // restore after reset
  document.getElementById("reg-modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("reg-modal").style.display = "none";
  document.getElementById("admin-panel").style.display = "none";
}

// Close modal when clicking outside
document.getElementById("reg-modal").addEventListener("click", e => {
  if (e.target.id === "reg-modal") closeModal();
});
document.getElementById("admin-panel").addEventListener("click", e => {
  if (e.target.id === "admin-panel") closeModal();
});

// ─── HANDLE REGISTRATION FORM ─────────────────────────────────────────────────
document.getElementById("reg-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // stop the browser from refreshing
  const msg = document.getElementById("reg-msg");

  const payload = {
    event_id: document.getElementById("reg-event-id").value,
    name:     document.getElementById("f-name").value.trim(),
    email:    document.getElementById("f-email").value.trim(),
    roll_no:  document.getElementById("f-roll").value.trim(),
    dept:     document.getElementById("f-dept").value,
  };

  try {
    // POST request to backend with JSON body
    const res  = await fetch(`${API}/api/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      msg.className = "form-msg ok";
      msg.textContent = data.message;
      setTimeout(() => { closeModal(); loadEvents(); }, 1800);
    } else {
      msg.className = "form-msg err";
      msg.textContent = data.error;
    }
  } catch (err) {
    msg.className = "form-msg err";
    msg.textContent = "Network error. Try again.";
  }
});

// ─── ADMIN: TOGGLE ADD EVENT PANEL ───────────────────────────────────────────
function toggleAdmin() {
  const p = document.getElementById("admin-panel");
  p.style.display = p.style.display === "none" ? "flex" : "none";
  document.getElementById("event-msg").textContent = "";
}

// ─── HANDLE ADD EVENT FORM ────────────────────────────────────────────────────
document.getElementById("event-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("event-msg");

  const payload = {
    title:       document.getElementById("e-title").value.trim(),
    description: document.getElementById("e-desc").value.trim(),
    venue:       document.getElementById("e-venue").value.trim(),
    event_date:  document.getElementById("e-date").value,
    event_time:  document.getElementById("e-time").value,
    max_seats:   parseInt(document.getElementById("e-seats").value) || 100,
  };

  try {
    const res  = await fetch(`${API}/api/events`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      msg.className = "form-msg ok";
      msg.textContent = "Event published! 🎉";
      document.getElementById("event-form").reset();
      setTimeout(() => { toggleAdmin(); loadEvents(); }, 1500);
    } else {
      msg.className = "form-msg err";
      msg.textContent = data.error;
    }
  } catch (err) {
    msg.className = "form-msg err";
    msg.textContent = "Network error. Try again.";
  }
});

// ─── DELETE EVENT ────────────────────────────────────────────────────────────
async function deleteEvent(id) {
  if (!confirm("Delete this event and all its registrations?")) return;
  try {
    await fetch(`${API}/api/events/${id}`, { method: "DELETE" });
    loadEvents(); // refresh the grid
  } catch (err) {
    alert("Could not delete. Check connection.");
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadEvents(); // run on page load
