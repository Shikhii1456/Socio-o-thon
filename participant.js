// ==========================================
// CONFIGURATION: Admin PIN
// ==========================================
const ADMIN_PIN = "1234";

const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";
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

const lockPanel = document.getElementById("lockPanel");
const participantPanel = document.getElementById("participantPanel");
const notFoundPanel = document.getElementById("notFound");
const pinInput = document.getElementById("pinInput");
const pinError = document.getElementById("pinError");

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function submitPin() {
  const entered = pinInput.value.trim();
  if (entered === ADMIN_PIN) {
    localStorage.setItem(AUTH_KEY, "true");
    pinError.textContent = "";
    unlockApp();
  } else {
    pinError.textContent = "Incorrect PIN. Please try again.";
    pinInput.value = "";
    pinInput.focus();
  }
}

function unlockApp() {
  lockPanel.classList.add("hidden");
  loadParticipant();
}

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

  // Update local cache immediately
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

  // Sync to shared cloud database
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
  let participant = list.find(p => p.id.toUpperCase() === participantId.toUpperCase());

  // Auto-create on first scan if doesn't exist yet
  if (!participant) {
    participant = {
      id: participantId.toUpperCase(),
      name: "Participant " + participantId.toUpperCase(),
      status: { kit: false, accommodation: false, food: false }
    };
    list.push(participant);
    updateCloudStatus(participant.id, participant.status);
  }

  participantPanel.classList.remove("hidden");
  document.getElementById("participantId").textContent = participant.id;
  document.getElementById("participantName").textContent = participant.name;

  const state = participant.status || { kit: false, accommodation: false, food: false };

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

  const saveBtn = document.getElementById("saveButton");
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const newState = {
      kit: document.getElementById("kit").checked,
      accommodation: document.getElementById("accommodation").checked,
      food: document.getElementById("food").checked,
    };

    const ok = await updateCloudStatus(participant.id, newState);

    const msg = document.getElementById("saveMessage");
    msg.textContent = ok ? "✅ Status synced to cloud!" : "⚠️ Saved locally (offline)";
    msg.style.color = ok ? "#067647" : "#d97706";

    saveBtn.disabled = false;
    saveBtn.textContent = "Save status";

    setTimeout(() => (msg.textContent = ""), 3000);
  });

  updateBadge();
}

if (isAuthenticated()) {
  unlockApp();
} else {
  lockPanel.classList.remove("hidden");
  participantPanel.classList.add("hidden");
}
