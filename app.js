// Shared Cloud Database Integration for Socio-O-Thon
const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";
const LOCAL_STORAGE_KEY = "socioOthon_shared_participants";

const defaultSeed = [
  { id: "SOT001", name: "Participant 001", team: "Team 1", status: { kit: false, accommodation: false, food: false }, fields: {} },
  { id: "SOT002", name: "Participant 002", team: "Team 1", status: { kit: false, accommodation: false, food: false }, fields: {} },
  { id: "SOT003", name: "Participant 003", team: "Team 2", status: { kit: false, accommodation: false, food: false }, fields: {} },
  { id: "SOT004", name: "Participant 004", team: "Team 2", status: { kit: false, accommodation: false, food: false }, fields: {} },
  { id: "SOT005", name: "Participant 005", team: "Team 3", status: { kit: false, accommodation: false, food: false }, fields: {} }
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
  } catch (err) {}
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
    return false;
  }
}

async function getParticipants() {
  return await fetchParticipantsFromCloud();
}

async function addParticipant(id, name, team) {
  const list = await fetchParticipantsFromCloud();
  const existing = list.find(p => p.id.toUpperCase() === id.toUpperCase());
  if (!existing) {
    list.push({
      id: id.toUpperCase(),
      team: team || "Team 1",
      name: name || `Participant ${id.toUpperCase()}`,
      status: { kit: false, accommodation: false, food: false },
      fields: {}
    });
    await saveParticipantsToCloud(list);
  }
  return { ok: true };
}

async function updateParticipantInfo(oldId, newId, newName, newTeam) {
  const list = await fetchParticipantsFromCloud();
  const target = list.find(p => p.id.toUpperCase() === oldId.toUpperCase());
  if (!target) return false;

  if (oldId.toUpperCase() !== newId.toUpperCase()) {
    const duplicate = list.find(p => p.id.toUpperCase() === newId.toUpperCase());
    if (duplicate) {
      alert("Error: Another participant already has ID " + newId);
      return false;
    }
  }

  target.id = newId.toUpperCase();
  target.name = newName.trim();
  target.team = newTeam.trim();
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

    const checks = p.status ? Object.values(p.status) : [];
    const completed = checks.filter(Boolean).length;
    const totalChecks = checks.length || 3;
    const statusClass = (completed === totalChecks && totalChecks > 0) ? "complete" : "";
    const pUrl = participantUrl(p.id);

    // Render extra fields preview on dashboard card (e.g. Email, Phone)
    let fieldsHtml = "";
    if (p.fields && Object.keys(p.fields).length > 0) {
      fieldsHtml = `<div style="font-size:12px; color:#64748b; margin-top:6px; line-height:1.4; text-align:left;">`;
      Object.entries(p.fields).forEach(([k, v]) => {
        if (v) fieldsHtml += `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`;
      });
      fieldsHtml += `</div>`;
    }

    const qrId = `qr-${p.id}`;
    card.innerHTML = `
      <div class="participant-meta" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="id-pill">${p.id}</span>
          <span class="badge small ${statusClass}">${completed}/${totalChecks}</span>
        </div>
      </div>
      <div style="text-align:left; margin-top:8px;">
        <span style="font-size:12px; font-weight:700; color:#4338ca; background:#e0e7ff; padding:2px 6px; border-radius:4px;">👥 ${escapeHtml(p.team || 'Team 1')}</span>
        <h3 style="margin-top:4px;">${escapeHtml(p.name)}</h3>
        ${fieldsHtml}
      </div>
      <div class="qr" id="${qrId}"></div>
      <div class="card-actions">
        <a class="button small" href="${pUrl}">👁️ View Record</a>
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
  
  // Find all unique custom field keys and custom checklist keys
  const customFieldKeys = new Set();
  list.forEach(p => {
    if (p.fields) Object.keys(p.fields).forEach(k => customFieldKeys.add(k));
  });
  const fieldKeysArr = Array.from(customFieldKeys);

  let csv = "\uFEFFParticipant ID,Team ID,Name,Kit Received,Accommodation,Food Received";
  fieldKeysArr.forEach(k => csv += `,${k}`);
  csv += ",Total Checks Completed\n";

  list.forEach(p => {
    const kit = p.status && p.status.kit ? "YES" : "NO";
    const acc = p.status && p.status.accommodation ? "YES" : "NO";
    const food = p.status && p.status.food ? "YES" : "NO";
    const checks = p.status ? Object.values(p.status) : [];
    const completed = checks.filter(Boolean).length;
    
    let line = `"${p.id}","${(p.team || '').replace(/"/g, '""')}","${p.name.replace(/"/g, '""')}","${kit}","${acc}","${food}"`;
    
    fieldKeysArr.forEach(k => {
      const val = (p.fields && p.fields[k]) ? p.fields[k] : "";
      line += `,"${String(val).replace(/"/g, '""')}"`;
    });

    line += `,"${completed}/${checks.length || 3}"\n`;
    csv += line;
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
    p.id.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    (p.team && p.team.toLowerCase().includes(q)) ||
    (p.fields && Object.values(p.fields).some(v => String(v).toLowerCase().includes(q)))
  ));
});

const exportBtn = document.getElementById("exportCsvBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", exportExcelCSV);
}
