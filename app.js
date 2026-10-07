// Shared Cloud Database Integration for Socio-O-Thon
// ID: ff808181a09d98f701a1156100f012a9
const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";
const LOCAL_STORAGE_KEY = "socioOthon_shared_participants";

const defaultSeed = [
  { id: "SOT001", name: "Participant 001", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT002", name: "Participant 002", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT003", name: "Participant 003", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT004", name: "Participant 004", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT005", name: "Participant 005", status: { kit: false, accommodation: false, food: false } }
];

async function fetchParticipantsFromCloud() {
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
    console.warn("Could not reach cloud database, using local cache:", err);
  }
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return defaultSeed;
}

async function saveParticipantsToCloud(list) {
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
  } catch (err) {
    console.error("Failed to sync to cloud:", err);
    return false;
  }
}

async function getParticipants() {
  return await fetchParticipantsFromCloud();
}

async function addParticipant(id, name) {
  const list = await fetchParticipantsFromCloud();
  const existing = list.find(p => p.id.toUpperCase() === id.toUpperCase());
  if (!existing) {
    list.push({
      id: id.toUpperCase(),
      name: name || `Participant ${id.toUpperCase()}`,
      status: { kit: false, accommodation: false, food: false }
    });
    await saveParticipantsToCloud(list);
  }
  return { ok: true };
}

async function updateParticipantInfo(oldId, newId, newName) {
  const list = await fetchParticipantsFromCloud();
  const target = list.find(p => p.id.toUpperCase() === oldId.toUpperCase());
  if (!target) return false;

  // Check if changing ID to an already existing ID
  if (oldId.toUpperCase() !== newId.toUpperCase()) {
    const duplicate = list.find(p => p.id.toUpperCase() === newId.toUpperCase());
    if (duplicate) {
      alert("Error: Another participant already has ID " + newId);
      return false;
    }
  }

  target.id = newId.toUpperCase();
  target.name = newName.trim();
  await saveParticipantsToCloud(list);
  return true;
}

async function deleteParticipant(id) {
  if (!confirm(`Are you sure you want to delete participant ${id}?`)) return false;
  const list = await fetchParticipantsFromCloud();
  const filtered = list.filter(p => p.id.toUpperCase() !== id.toUpperCase());
  await saveParticipantsToCloud(filtered);
  return true;
}

function participantUrl(id) {
  const base = window.location.href.split("?")[0].split("#")[0].replace(/\/(index\.html)?$/, "");
  return `${base}/participant.html?id=${encodeURIComponent(id)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function render(list) {
  const grid = document.getElementById("participantGrid");
  grid.innerHTML = "";
  document.getElementById("participantCount").textContent = list.length;

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No participants found.</div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "participant-card";

    const completed = [p.status && p.status.kit, p.status && p.status.accommodation, p.status && p.status.food].filter(Boolean).length;
    const statusClass = completed === 3 ? "complete" : "";
    const pUrl = participantUrl(p.id);

    const qrId = `qr-${p.id}`;
    card.innerHTML = `
      <div class="participant-meta" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="id-pill">${p.id}</span>
          <span class="badge small ${statusClass}">${completed}/3</span>
        </div>
        <div style="display:flex; gap:4px;">
          <button class="button small secondary edit-btn" style="padding:4px 8px; font-size:11px;" title="Edit Name/ID">✏️ Edit</button>
          <button class="button small secondary del-btn" style="padding:4px 8px; font-size:11px; color:#ef4444;" title="Delete">🗑️</button>
        </div>
      </div>
      <h3 style="text-align:left; margin-top:8px;">${escapeHtml(p.name)}</h3>
      <div class="qr" id="${qrId}"></div>
      <div class="card-actions">
        <a class="button small" href="${pUrl}">Open record</a>
        <button class="button small secondary copy-btn" data-url="${pUrl}">Copy QR link</button>
      </div>
      <div class="url">${pUrl}</div>
    `;
    grid.appendChild(card);

    new QRCode(document.getElementById(qrId), {
      text: pUrl,
      width: 180,
      height: 180,
      correctLevel: QRCode.CorrectLevel.M
    });

    // Edit button click handler
    card.querySelector(".edit-btn").addEventListener("click", async () => {
      const newId = prompt("Update Participant ID:", p.id);
      if (!newId || !newId.trim()) return;
      const newName = prompt("Update Participant Name:", p.name);
      if (!newName || !newName.trim()) return;

      await updateParticipantInfo(p.id, newId.trim(), newName.trim());
      await init();
    });

    // Delete button click handler
    card.querySelector(".del-btn").addEventListener("click", async () => {
      if (await deleteParticipant(p.id)) {
        await init();
      }
    });
  });

  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(btn.dataset.url);
      const old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => btn.textContent = old, 1200);
    });
  });
}

function exportExcelCSV() {
  const list = allParticipants;
  let csv = "\uFEFFParticipant ID,Name,Kit Received,Accommodation,Food Received,Total Completed\n";
  list.forEach(p => {
    const kit = p.status && p.status.kit ? "YES" : "NO";
    const acc = p.status && p.status.accommodation ? "YES" : "NO";
    const food = p.status && p.status.food ? "YES" : "NO";
    const total = [p.status && p.status.kit, p.status && p.status.accommodation, p.status && p.status.food].filter(Boolean).length;
    csv += `"${p.id}","${p.name.replace(/"/g, '""')}","${kit}","${acc}","${food}","${total}/3"\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Socio-O-Thon-Participants-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let allParticipants = [];

async function init() {
  allParticipants = await getParticipants();
  render(allParticipants);
}

init();

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  render(allParticipants.filter(p =>
    p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  ));
});

// Modal / prompt for adding participant cleanly
document.getElementById("addDemo").addEventListener("click", async () => {
  const nextNum = allParticipants.length + 1;
  const defaultId = `SOT${String(nextNum).padStart(3, "0")}`;
  
  const id = prompt("Enter Participant ID (e.g. SOT006):", defaultId);
  if (!id) return;
  
  const name = prompt("Enter Participant Name:", `Participant ${id.trim().toUpperCase()}`);
  if (!name) return;

  const btn = document.getElementById("addDemo");
  btn.textContent = "Adding...";
  btn.disabled = true;

  await addParticipant(id.trim().toUpperCase(), name.trim());
  await init();

  btn.textContent = "+ Add Participant";
  btn.disabled = false;
});

const exportBtn = document.getElementById("exportCsvBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", exportExcelCSV);
}
