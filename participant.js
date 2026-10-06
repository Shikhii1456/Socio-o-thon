const STORAGE_KEY = "socioOthon_shared_participants";

// ── Extract participant ID from query param (?id=SOT001) or path (/p/SOT001) ──
const urlParams = new URLSearchParams(window.location.search);
let participantId = urlParams.get("id");

if (!participantId) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const pIndex = pathParts.indexOf("p");
  if (pIndex !== -1 && pathParts[pIndex + 1]) {
    participantId = decodeURIComponent(pathParts[pIndex + 1]);
  }
}

const panel = document.getElementById("participantPanel");
const notFound = document.getElementById("notFound");

async function init() {
  if (!participantId) {
    panel.classList.add("hidden");
    notFound.classList.remove("hidden");
    return;
  }

  let participant = null;

  // Try fetching from local server if active
  try {
    const res = await fetch(`./api/participant/${encodeURIComponent(participantId)}`);
    if (res.ok) participant = await res.json();
  } catch (e) {}

  // Fallback to localStorage (for GitHub Pages static hosting)
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
    panel.classList.add("hidden");
    notFound.classList.remove("hidden");
    return;
  }

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

    // Always update localStorage
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

init();
