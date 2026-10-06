// ==========================================
// CONFIGURATION: Admin PIN
// You can easily change this PIN anytime!
// ==========================================
const ADMIN_PIN = "1234";

const STORAGE_KEY = "socioOthon_shared_participants";
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

// Check if this device is already authenticated
function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function submitPin() {
  const entered = pinInput.value.trim();
  if (entered === ADMIN_PIN) {
    // Remember authorization on this browser so you don't have to enter PIN every single scan
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

async function loadParticipant() {
  if (!participantId) {
    participantPanel.classList.add("hidden");
    notFoundPanel.classList.remove("hidden");
    return;
  }

  let participant = null;

  // Try fetching from server if running
  try {
    const res = await fetch(`./api/participant/${encodeURIComponent(participantId)}`);
    if (res.ok) participant = await res.json();
  } catch (e) {}

  // Fallback to local storage (for GitHub Pages static hosting)
  if (!participant) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    participant = saved.find(p => p.id.toUpperCase() === participantId.toUpperCase());
    
    // Auto-create entry if scanning valid ID format
    if (!participant && participantId) {
      participant = {
        id: participantId.toUpperCase(),
        name: "Participant " + participantId.toUpperCase(),
        status: { kit: false, accommodation: false, food: false }
      };
      saved.push(participant);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
  }

  if (!participant) {
    participantPanel.classList.add("hidden");
    notFoundPanel.classList.remove("hidden");
    return;
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

  document.getElementById("saveButton").addEventListener("click", async () => {
    const newState = {
      kit: document.getElementById("kit").checked,
      accommodation: document.getElementById("accommodation").checked,
      food: document.getElementById("food").checked,
    };

    // Try server update
    let saved = false;
    try {
      const saveRes = await fetch(`./api/participant/${encodeURIComponent(participant.id)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      });
      if (saveRes.ok) saved = true;
    } catch (e) {}

    // Update localStorage
    const localList = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const item = localList.find(p => p.id === participant.id);
    if (item) {
      item.status = newState;
    } else {
      localList.push({ id: participant.id, name: participant.name, status: newState });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localList));
    saved = true;

    const msg = document.getElementById("saveMessage");
    if (saved) {
      msg.textContent = "✅ Status saved!";
      msg.style.color = "#067647";
    } else {
      msg.textContent = "❌ Failed to save.";
      msg.style.color = "#d92d20";
    }
    setTimeout(() => (msg.textContent = ""), 2500);
  });

  updateBadge();
}

// Initial entry check
if (isAuthenticated()) {
  unlockApp();
} else {
  lockPanel.classList.remove("hidden");
  participantPanel.classList.add("hidden");
}
