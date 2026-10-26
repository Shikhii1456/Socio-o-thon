// ==========================================
// CONFIGURATION: Admin PIN & Endpoints
// ==========================================
const ADMIN_PIN = "1234";

// Primary Cloud DB for QR codes
const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";

// Google Apps Script Web App URL (Live Connected Google Sheet)
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec";

const LOCAL_STORAGE_KEY = "socioOthon_shared_participants";
const AUTH_KEY = "socioOthon_admin_auth";

// Extract participant ID from query param (?id=SOT001) or path (/p/SOT001)
const urlParams = new URLSearchParams(window.location.search);
let participantId = urlParams.get("id");

if (!participantId) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const pIndex = pathParts.indexOf("p");
  if (pIndex !== -1 && pathParts[pIndex + 1]) {
    participantId = decodeURIComponent(pathParts[pIndex + 1]);
  }
}

const participantPanel = document.getElementById("participantPanel");
const notFoundPanel = document.getElementById("notFound");
const editStatusBtn = document.getElementById("editStatusBtn");
const saveButton = document.getElementById("saveButton");
const authBanner = document.getElementById("authBanner");
const authStatusText = document.getElementById("authStatusText");
const unlockBtn = document.getElementById("unlockBtn");

const pinModal = document.getElementById("pinModal");
const modalPinInput = document.getElementById("modalPinInput");
const modalPinError = document.getElementById("modalPinError");
const submitPinBtn = document.getElementById("submitPinBtn");
const cancelPinBtn = document.getElementById("cancelPinBtn");

let currentParticipant = null;

function isOrganizerAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function setEditModeEnabled(enabled) {
  const checkboxes = ["kit", "accommodation", "food"];
  checkboxes.forEach(id => {
    document.getElementById(id).disabled = !enabled;
  });

  if (enabled) {
    editStatusBtn.classList.add("hidden");
    saveButton.classList.remove("hidden");
    authBanner.className = "auth-banner unlocked";
    authStatusText.innerHTML = "✅ <strong>Organizer Mode:</strong> Editing enabled";
    unlockBtn.textContent = "Lock";
  } else {
    editStatusBtn.classList.remove("hidden");
    saveButton.classList.add("hidden");
    authBanner.className = "auth-banner";
    authStatusText.innerHTML = "👁️ <strong>Viewing Mode:</strong> Details visible (Read-only)";
    unlockBtn.textContent = "🔒 Organizer Login";
  }
}

function openPinModal() {
  pinModal.classList.remove("hidden");
  modalPinInput.value = "";
  modalPinError.textContent = "";
  modalPinInput.focus();
}

function closePinModal() {
  pinModal.classList.add("hidden");
  modalPinInput.value = "";
  modalPinError.textContent = "";
}

function verifyPin() {
  const entered = modalPinInput.value.trim();
  if (entered === ADMIN_PIN) {
    localStorage.setItem(AUTH_KEY, "true");
    closePinModal();
    setEditModeEnabled(true);
  } else {
    modalPinError.textContent = "Incorrect PIN. Try again.";
    modalPinInput.value = "";
    modalPinInput.focus();
  }
}

// ── Cloud Database Retrieval ──
async function fetchParticipants() {
  try {
    const res = await fetch(CLOUD_DB_URL);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.participants)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data.participants));
        return json.data.participants;
      }
    }
  } catch (err) {
    console.warn("Using local cache:", err);
  }
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

// ── Real-Time Sync to Google Sheet ──
async function syncToGoogleSheet(participant, newStatus) {
  const sheetUrl = GOOGLE_SHEET_API_URL || localStorage.getItem("socioOthon_google_sheet_url");
  if (!sheetUrl) return;

  try {
    await fetch(sheetUrl, {
      method: "POST",
      mode: "no-cors", // Google Apps Script handles no-cors gracefully
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_status",
        id: participant.id,
        name: participant.name,
        team: participant.team || "",
        status: newStatus
      })
    });
    console.log("Synced to Google Sheet in real time");
  } catch (e) {
    console.warn("Google Sheet sync error:", e);
  }
}

// ── Update QR Cloud Status ──
async function updateCloudStatus(targetId, newStatus) {
  const list = await fetchParticipants();
  let found = list.find(p => p.id.toUpperCase() === targetId.toUpperCase());
  if (found) {
    found.status = newStatus;
  } else {
    found = {
      id: targetId.toUpperCase(),
      name: "Participant " + targetId.toUpperCase(),
      status: newStatus
    };
    list.push(found);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

  try {
    await fetch(CLOUD_DB_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "socio-o-thon-db",
        data: { participants: list }
      })
    });
    return true;
  } catch (e) {
    console.error("Cloud sync error:", e);
    return false;
  }
}

async function loadParticipant() {
  if (!participantId) {
    participantPanel.classList.add("hidden");
    notFoundPanel.classList.remove("hidden");
    return;
  }

  const list = await fetchParticipants();
  currentParticipant = list.find(p => p.id.toUpperCase() === participantId.toUpperCase());

  // If not found, show not found
  if (!currentParticipant) {
    participantPanel.classList.add("hidden");
    notFoundPanel.classList.remove("hidden");
    return;
  }

  participantPanel.classList.remove("hidden");
  notFoundPanel.classList.add("hidden");

  // Populate Participant Info Instantly
  document.getElementById("participantId").textContent = currentParticipant.id;
  document.getElementById("participantName").textContent = currentParticipant.name;

  const teamEl = document.getElementById("participantTeam");
  if (currentParticipant.team) {
    teamEl.textContent = `Team: ${currentParticipant.team}`;
    teamEl.classList.remove("hidden");
  } else {
    teamEl.classList.add("hidden");
  }

  const state = currentParticipant.status || { kit: false, accommodation: false, food: false };
  document.getElementById("kit").checked = !!state.kit;
  document.getElementById("accommodation").checked = !!state.accommodation;
  document.getElementById("food").checked = !!state.food;

  function updateBadge() {
    const checks = ["kit", "accommodation", "food"];
    const completed = checks.filter(id => document.getElementById(id).checked).length;
    const badge = document.getElementById("statusBadge");
    badge.textContent = `${completed} / 3 completed`;
    badge.classList.toggle("complete", completed === 3);
  }

  ["kit", "accommodation", "food"].forEach(id => {
    document.getElementById(id).addEventListener("change", updateBadge);
  });

  updateBadge();
  setEditModeEnabled(isOrganizerAuthenticated());
}

// ── Event Handlers ──
editStatusBtn.addEventListener("click", () => {
  if (isOrganizerAuthenticated()) {
    setEditModeEnabled(true);
  } else {
    openPinModal();
  }
});

unlockBtn.addEventListener("click", () => {
  if (isOrganizerAuthenticated()) {
    // Lock / Logout
    localStorage.removeItem(AUTH_KEY);
    setEditModeEnabled(false);
  } else {
    openPinModal();
  }
});

submitPinBtn.addEventListener("click", verifyPin);
modalPinInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyPin();
});
cancelPinBtn.addEventListener("click", closePinModal);

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  const newState = {
    kit: document.getElementById("kit").checked,
    accommodation: document.getElementById("accommodation").checked,
    food: document.getElementById("food").checked,
  };

  // 1. Save to cloud DB
  const ok = await updateCloudStatus(currentParticipant.id, newState);

  // 2. Real-time sync directly into Google Sheet
  await syncToGoogleSheet(currentParticipant, newState);

  const msg = document.getElementById("saveMessage");
  msg.textContent = ok ? "✅ Saved & Synced to Google Sheet!" : "⚠️ Saved locally";
  msg.style.color = ok ? "#067647" : "#d97706";

  saveButton.disabled = false;
  saveButton.textContent = "💾 Save & Sync to Sheet";

  setTimeout(() => (msg.textContent = ""), 3000);
});

// Load on start
loadParticipant();
