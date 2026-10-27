// Shared Cloud Database Integration for Socio-O-Thon
// Cryptographic SHA-256 hash of default admin PIN (1456)
const DEFAULT_ADMIN_PIN_HASH = "fddc599a3afe6c68b8098f7ef3db02335f7e398e3c0bd34b663f04f424886aeb";

async function computeSha256(text) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {}
  return null;
}

async function isPinValid(enteredPin) {
  if (!enteredPin) return false;
  const trimmed = enteredPin.trim();
  // Clear obsolete custom hash from previous PIN (1234)
  if (localStorage.getItem("socioOthon_admin_pin_hash") === "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4") {
    localStorage.removeItem("socioOthon_admin_pin_hash");
  }
  const customHash = localStorage.getItem("socioOthon_admin_pin_hash");
  const targetHash = customHash || DEFAULT_ADMIN_PIN_HASH;
  const computed = await computeSha256(trimmed);
  if (computed) {
    return computed.toLowerCase() === targetHash.toLowerCase();
  }
  return trimmed === "1456";
}

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/export?format=csv";
const GOOGLE_SHEET_GVIZ_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/gviz/tq";
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec";
const LOCAL_STORAGE_KEY = "socioOthon_participants_v8_2";

// Initial seed loaded safely from data/seed.js or window.SOCIO_DEFAULT_PARTICIPANTS
const defaultSeed = (typeof window !== "undefined" && Array.isArray(window.SOCIO_DEFAULT_PARTICIPANTS))
  ? window.SOCIO_DEFAULT_PARTICIPANTS
  : [];

let isOrganizerUnlocked = false;

// ── Undo & Redo History Stacks ──
let undoStack = [];
let redoStack = [];

function recordState(list) {
  undoStack.push(JSON.stringify(list));
  if (undoStack.length > 30) undoStack.shift(); // Keep last 30 states
  redoStack = []; // Clear redo when a new action is performed
  updateUndoRedoButtons();
}

// ── Google Sheet CSV Parsing & Cloud Retrieval ──
function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) lines.push(row);
  return lines;
}

function isTruthy(val) {
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === "YES" || s === "TRUE" || s === "1" || s === "CHECKED" || s === "Y" || s === "DONE" || s === "RECEIVED" || s === "✓" || s === "✔";
}

function parseGvizTable(data) {
  if (!data || !data.table || !data.table.rows) return null;
  const cols = data.table.cols.map(c => (c.label || c.id || '').trim());
  const rows = data.table.rows;
  
  const idCol = cols.findIndex(h => /participant\s*id/i.test(h));
  const teamIdCol = cols.findIndex(h => /^team\s*id$/i.test(h) || /socio\s*team\s*id/i.test(h));
  const nameCol = cols.findIndex(h => /^name$/i.test(h));
  const kitCol = cols.findIndex(h => /kit/i.test(h));
  const accCol = cols.findIndex(h => /accommodation/i.test(h));
  const foodCol = cols.findIndex(h => /food/i.test(h));
  
  const list = [];
  rows.forEach(r => {
    const cells = r.c || [];
    const getVal = (idx) => {
      if (idx === -1 || !cells[idx]) return '';
      const cell = cells[idx];
      return (cell.f !== undefined && cell.f !== null) ? String(cell.f).trim() : (cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : '');
    };
    
    const id = getVal(idCol).toUpperCase();
    if (!id) return;
    
    const name = getVal(nameCol) || ('Participant ' + id);
    let teamId = getVal(teamIdCol) || '';
    if (teamId === '-') teamId = '';
    
    const status = {
      kit: isTruthy(getVal(kitCol)),
      accommodation: isTruthy(getVal(accCol)),
      food: isTruthy(getVal(foodCol))
    };
    
    const fields = {};
    cols.forEach((colName, cIdx) => {
      if (cIdx === idCol || cIdx === nameCol || cIdx === kitCol || cIdx === accCol || cIdx === foodCol) return;
      if (!colName || /last\s*updated/i.test(colName)) return;
      const val = getVal(cIdx);
      if (val && val !== '-') {
        fields[colName] = val;
      }
    });

    if (!teamId && (fields['Socio Team ID'] || fields['Team ID'])) {
      teamId = fields['Socio Team ID'] || fields['Team ID'] || '';
    }

    const ab2 = fields['AB2 (SOCI-O-THON)'] || fields['AB2'] || '';
    if (ab2) fields['AB2 (SOCI-O-THON)'] = ab2;
    
    list.push({ id, name, teamId, status, fields });
  });
  return list;
}

function fetchLiveSheetJsonp() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !document || !document.head) {
      return resolve(null);
    }
    const callbackName = "gvizSheetCallback_" + Math.random().toString(36).slice(2);
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 6000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      const el = document.getElementById(callbackName);
      if (el) el.remove();
    }

    window[callbackName] = function(rawResponse) {
      cleanup();
      try {
        const parsed = parseGvizTable(rawResponse);
        resolve(parsed);
      } catch (e) {
        console.warn("Error parsing Gviz sheet response:", e);
        resolve(null);
      }
    };

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${GOOGLE_SHEET_GVIZ_URL}?tqx=responseHandler:${callbackName}&_t=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

function parseParticipantsFromCSV(csvText) {
  const rows = parseCSV(csvText);
  if (!rows || rows.length < 2) return null;
  const headers = rows[0].map(h => h.trim());
  const idCol = headers.findIndex(h => /participant\s*id/i.test(h));
  const teamIdCol = headers.findIndex(h => /^team\s*id$/i.test(h) || /socio\s*team\s*id/i.test(h));
  const nameCol = headers.findIndex(h => /^name$/i.test(h));
  const kitCol = headers.findIndex(h => /kit/i.test(h));
  const accCol = headers.findIndex(h => /accommodation/i.test(h));
  const foodCol = headers.findIndex(h => /food/i.test(h));

  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawId = (idCol !== -1 && r[idCol]) ? r[idCol].trim() : (r[0] ? r[0].trim() : "");
    if (!rawId) continue;
    const id = rawId.toUpperCase();
    const name = (nameCol !== -1 && r[nameCol]) ? r[nameCol].trim() : (r[1] ? r[1].trim() : ("Participant " + id));
    let teamId = (teamIdCol !== -1 && r[teamIdCol]) ? r[teamIdCol].trim() : "";
    if (teamId === '-') teamId = '';
    
    const status = {
      kit: kitCol !== -1 ? isTruthy(r[kitCol]) : isTruthy(r[3]),
      accommodation: accCol !== -1 ? isTruthy(r[accCol]) : isTruthy(r[4]),
      food: foodCol !== -1 ? isTruthy(r[foodCol]) : isTruthy(r[5])
    };

    const fields = {};
    for (let c = 0; c < headers.length; c++) {
      if (c === idCol || c === nameCol || c === kitCol || c === accCol || c === foodCol) continue;
      const h = headers[c];
      if (!h || /last\s*updated/i.test(h)) continue;

      const val = r[c] ? r[c].trim() : "";
      if (val && val !== '-') {
        const upper = val.toUpperCase();
        if (upper === "YES" || upper === "NO" || upper === "TRUE" || upper === "FALSE") {
          status[h] = isTruthy(val);
        } else {
          fields[h] = val;
        }
      }
    }

    if (!teamId && (fields['Socio Team ID'] || fields['Team ID'])) {
      teamId = fields['Socio Team ID'] || fields['Team ID'] || '';
    }

    const ab2 = fields['AB2 (SOCI-O-THON)'] || fields['AB2'] || '';
    if (ab2) fields['AB2 (SOCI-O-THON)'] = ab2;

    list.push({ id, name, teamId, status, fields });
  }
  return list;
}

async function syncParticipantToGoogleSheet(p) {
  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_status",
        id: p.id,
        teamId: p.teamId || (p.fields && p.fields["Team ID"]) || (p.fields && p.fields["Socio Team ID"]) || "",
        name: p.name,
        status: p.status || {},
        fields: p.fields || {}
      })
    });
  } catch (e) {
    console.warn("Sheet sync error:", e);
  }
}

async function fetchParticipantsFromCloud() {
  let list = [];

  // 1. Fetch live Google Sheet via JSONP (No CORS restrictions, real-time sync with Google Sheet!)
  try {
    const liveGviz = await fetchLiveSheetJsonp();
    if (liveGviz && Array.isArray(liveGviz) && liveGviz.length > 0) {
      list = liveGviz;
    }
  } catch (err) {
    console.warn("JSONP sheet fetch error:", err);
  }

  // 2. Secondary fetch: Google Sheet CSV export
  if (list.length === 0) {
    try {
      const res = await fetch(GOOGLE_SHEET_CSV_URL + "&_t=" + Date.now());
      if (res.ok) {
        const csv = await res.text();
        const parsed = parseParticipantsFromCSV(csv);
        if (parsed && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch (err) {}
  }

  // If live sheet data is available, update local cache and return
  if (list.length > 0) {
    list.sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
    return list;
  }

  // Fallback 1: localStorage if offline
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const localList = JSON.parse(saved);
      if (Array.isArray(localList) && localList.length > 0) {
        return localList;
      }
    }
  } catch (e) {}

  // Fallback 2: data/participants.json
  try {
    const res = await fetch("./data/participants.json?_t=" + Date.now());
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return json;
      }
    }
  } catch (e) {}

  if (typeof window !== "undefined" && Array.isArray(window.SOCIO_DEFAULT_PARTICIPANTS) && window.SOCIO_DEFAULT_PARTICIPANTS.length > 0) {
    return window.SOCIO_DEFAULT_PARTICIPANTS;
  }
  return defaultSeed;
}

async function saveParticipantsToCloud(list) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  return true;
}

async function getParticipants() {
  return await fetchParticipantsFromCloud();
}

async function addParticipant(id, name) {
  const upperId = id.trim().toUpperCase();
  const list = await fetchParticipantsFromCloud();
  const existing = list.find(p => p.id.toUpperCase() === upperId);
  if (existing) {
    alert("Participant with ID " + upperId + " already exists!");
    return { ok: false, error: "Duplicate ID" };
  }
  recordState(list);
  const newParticipant = {
    id: upperId,
    name: name ? name.trim() : ("Participant " + upperId),
    status: { kit: false, accommodation: false, food: false },
    fields: {}
  };
  list.push(newParticipant);
  list.sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  await saveParticipantsToCloud(list);
  await syncParticipantToGoogleSheet(newParticipant);
  return { ok: true, participant: newParticipant };
}

async function updateParticipantInfo(oldId, newId, newName) {
  const cleanOld = oldId.trim().toUpperCase();
  const cleanNew = newId.trim().toUpperCase();
  const list = await fetchParticipantsFromCloud();
  const target = list.find(p => p.id.toUpperCase() === cleanOld);
  if (!target) return false;

  if (cleanOld !== cleanNew) {
    const duplicate = list.find(p => p.id.toUpperCase() === cleanNew);
    if (duplicate) {
      alert("Error: Another participant already has ID " + cleanNew);
      return false;
    }
  }

  recordState(list);
  target.id = cleanNew;
  target.name = newName.trim();

  list.sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  await saveParticipantsToCloud(list);

  if (cleanOld !== cleanNew) {
    try {
      await fetch(GOOGLE_SHEET_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_participant", id: cleanOld })
      });
    } catch (e) {}
  }

  await syncParticipantToGoogleSheet(target);
  return true;
}

async function deleteParticipant(id) {
  const upperId = id.trim().toUpperCase();
  if (!confirm(`Are you sure you want to delete participant ${upperId}?`)) return false;
  const list = await fetchParticipantsFromCloud();
  recordState(list);
  const filtered = list.filter(p => p.id.toUpperCase() !== upperId);
  filtered.sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  await saveParticipantsToCloud(filtered);

  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_participant",
        id: upperId
      })
    });
  } catch (e) {
    console.warn("Sheet delete error:", e);
  }
  return true;
}

function participantUrl(id) {
  let base;
  if (
    !window.location.protocol ||
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === ""
  ) {
    base = "https://shikhii1456.github.io/Socio-o-thon";
  } else {
    base = window.location.href.split("?")[0].split("#")[0].replace(/\/+$/, "").replace(/\/index\.html$/i, "");
  }
  return `${base}/participant.html?id=${encodeURIComponent(id)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}


// ── In-Memory QR Code Cache for Instant Performance ──
const qrCache = new Map();
let activeQrQueue = [];
let qrAnimationId = null;

function generateQR(containerId, url) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (el.dataset.rendered === "true") return;

  if (qrCache.has(url)) {
    el.innerHTML = qrCache.get(url);
    el.dataset.rendered = "true";
    return;
  }

  el.innerHTML = "";
  new QRCode(el, {
    text: url,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });
  el.dataset.rendered = "true";
  setTimeout(() => {
    if (el.innerHTML && !qrCache.has(url)) {
      qrCache.set(url, el.innerHTML);
    }
  }, 100);
}

function processQRQueue() {
  if (!activeQrQueue.length) return;
  const chunk = activeQrQueue.splice(0, 8);
  chunk.forEach(item => generateQR(item.id, item.url));
  if (activeQrQueue.length > 0) {
    qrAnimationId = requestAnimationFrame(processQRQueue);
  }
}

// Ensure all QRs complete immediately before printing
window.addEventListener("beforeprint", () => {
  if (qrAnimationId) cancelAnimationFrame(qrAnimationId);
  while (activeQrQueue.length) {
    const item = activeQrQueue.shift();
    generateQR(item.id, item.url);
  }
});

function render(list) {
  const grid = document.getElementById("participantGrid");
  grid.innerHTML = "";
  document.getElementById("participantCount").textContent = list.length;

  if (qrAnimationId) cancelAnimationFrame(qrAnimationId);
  activeQrQueue = [];

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No participants found.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "participant-card";

    const checks = p.status ? Object.values(p.status) : [];
    const completed = checks.filter(Boolean).length;
    const totalChecks = checks.length || 3;
    const statusClass = (completed === totalChecks && totalChecks > 0) ? "complete" : "";
    const pUrl = participantUrl(p.id);

    let fieldsHtml = "";
    if (p.fields && Object.keys(p.fields).length > 0) {
      fieldsHtml = `<div style="font-size:12px; color:#64748b; margin-top:6px; line-height:1.4; text-align:left;">`;
      Object.entries(p.fields).forEach(([k, v]) => {
        if (!v || v === "-") return;
        if (k.toLowerCase() === "team id" && p.fields["Socio Team ID"]) return;
        fieldsHtml += `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`;
      });
      fieldsHtml += `</div>`;
    }

    const organizerControls = isOrganizerUnlocked
      ? `<div style="display:flex; gap:4px;">
           <button class="button small secondary edit-btn" style="padding:4px 8px; font-size:11px;" title="Edit Name/ID">✏️ Edit</button>
           <button class="button small secondary del-btn" style="padding:4px 8px; font-size:11px; color:#ef4444;" title="Delete">🗑️</button>
         </div>`
      : "";

    const qrId = `qr-${p.id}`;
    card.innerHTML = `
      <div class="participant-meta" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="id-pill">${escapeHtml(p.id)}</span>
          <span class="badge small ${statusClass}">${completed}/${totalChecks}</span>
        </div>
        ${organizerControls}
      </div>
      <div style="text-align:left; margin-top:8px;">
        <h3 class="print-participant-name" style="margin-top:2px;">${escapeHtml(p.name)}</h3>
        <div class="card-details-extra">${fieldsHtml}</div>
      </div>
      <div class="qr" id="${qrId}"></div>
      <div class="card-actions">
        <a class="button small" href="${pUrl}">👁️ View Record</a>
        <button class="button small secondary copy-btn" data-url="${pUrl}">Copy QR link</button>
      </div>
      <div class="url">${pUrl}</div>
    `;
    fragment.appendChild(card);

    if (idx < 12) {
      setTimeout(() => generateQR(qrId, pUrl), 0);
    } else {
      activeQrQueue.push({ id: qrId, url: pUrl });
    }

    if (isOrganizerUnlocked) {
      card.querySelector(".edit-btn").addEventListener("click", async () => {
        const newId = prompt("Update Participant ID:", p.id);
        if (!newId || !newId.trim()) return;
        const newName = prompt("Update Participant Name:", p.name);
        if (!newName || !newName.trim()) return;

        await updateParticipantInfo(p.id, newId.trim(), newName.trim());
        await init();
      });

      card.querySelector(".del-btn").addEventListener("click", async () => {
        if (await deleteParticipant(p.id)) {
          await init();
        }
      });
    }
  });

  grid.appendChild(fragment);

  if (activeQrQueue.length > 0) {
    qrAnimationId = requestAnimationFrame(processQRQueue);
  }

  grid.querySelectorAll(".copy-btn").forEach(btn => {
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
  const customFieldKeys = new Set();
  list.forEach(p => {
    if (p.fields) Object.keys(p.fields).forEach(k => customFieldKeys.add(k));
  });
  const fieldKeysArr = Array.from(customFieldKeys);

  let csv = "\uFEFFParticipant ID,Name,Kit Received,Accommodation,Food Received";
  fieldKeysArr.forEach(k => csv += `,${k}`);
  csv += ",Total Checks Completed\n";

  list.forEach(p => {
    const kit = p.status && p.status.kit ? "YES" : "NO";
    const acc = p.status && p.status.accommodation ? "YES" : "NO";
    const food = p.status && p.status.food ? "YES" : "NO";
    const checks = p.status ? Object.values(p.status) : [];
    const completed = checks.filter(Boolean).length;
    
    let line = `"${p.id}","${p.name.replace(/"/g, '""')}","${kit}","${acc}","${food}"`;
    
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
  // 1. Instant Paint from LocalStorage or defaultSeed (0ms delay!)
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allParticipants = parsed;
        render(allParticipants);
      }
    } catch (e) {}
  }
  if (!allParticipants.length) {
    allParticipants = [...defaultSeed];
    render(allParticipants);
  }

  // 2. Refresh from Google Sheet in background without UI freeze
  try {
    const fresh = await getParticipants();
    if (fresh && fresh.length > 0) {
      allParticipants = fresh;
      const searchVal = document.getElementById("search").value.toLowerCase().trim();
      if (!searchVal) {
        render(allParticipants);
      }
    }
  } catch (err) {
    console.warn("Background refresh note:", err.message);
  }
}

init();

// Auto-refresh when tab gains focus or periodically so changes in Google Sheet appear automatically
window.addEventListener("focus", () => {
  if (!isOrganizerUnlocked) init();
});

setInterval(() => {
  const searchInput = document.getElementById("search");
  const searchVal = searchInput ? searchInput.value.trim() : "";
  if (!searchVal && !isOrganizerUnlocked) {
    getParticipants().then(fresh => {
      if (fresh && fresh.length > 0) {
        allParticipants = fresh;
        render(allParticipants);
      }
    }).catch(() => {});
  }
}, 25000);

const refreshSheetBtn = document.getElementById("refreshSheetBtn");
if (refreshSheetBtn) {
  refreshSheetBtn.addEventListener("click", async () => {
    refreshSheetBtn.textContent = "⏳ Syncing...";
    refreshSheetBtn.disabled = true;
    try {
      const fresh = await fetchLiveSheetJsonp();
      if (fresh && fresh.length > 0) {
        allParticipants = fresh;
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh)); } catch(e) {}
        render(allParticipants);
        refreshSheetBtn.textContent = "✅ Synced!";
        setTimeout(() => { refreshSheetBtn.textContent = "🔄 Sync Sheet"; refreshSheetBtn.disabled = false; }, 1500);
        return;
      }
    } catch(e) {
      console.warn("Manual sync error:", e);
    }
    refreshSheetBtn.textContent = "🔄 Sync Sheet";
    refreshSheetBtn.disabled = false;
  });
}

// ── Debounced Search for 60 FPS Performance ──
let searchTimer = null;
document.getElementById("search").addEventListener("input", e => {
  clearTimeout(searchTimer);
  const q = e.target.value.toLowerCase().trim();
  searchTimer = setTimeout(() => {
    render(allParticipants.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.fields && Object.values(p.fields).some(v => String(v).toLowerCase().includes(q)))
    ));
  }, 100);
});

// ── Organizer Lock / Unlock Handler ──
const organizerToggleBtn = document.getElementById("organizerToggleBtn");
const organizerModeTag = document.getElementById("organizerModeTag");
const addParticipantBtn = document.getElementById("addParticipantBtn");
const dashPinModal = document.getElementById("dashPinModal");
const dashPinInput = document.getElementById("dashPinInput");
const dashPinError = document.getElementById("dashPinError");
const submitDashPinBtn = document.getElementById("submitDashPinBtn");
const cancelDashPinBtn = document.getElementById("cancelDashPinBtn");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

function updateUndoRedoButtons() {
  if (!undoBtn || !redoBtn) return;
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
  undoBtn.style.opacity = undoStack.length === 0 ? "0.5" : "1";
  redoBtn.style.opacity = redoStack.length === 0 ? "0.5" : "1";
}

async function handleUndo() {
  if (undoStack.length === 0) return;
  const currentJson = JSON.stringify(allParticipants);
  redoStack.push(currentJson);
  const previousJson = undoStack.pop();
  allParticipants = JSON.parse(previousJson);
  await saveParticipantsToCloud(allParticipants);
  render(allParticipants);
  updateUndoRedoButtons();
}

async function handleRedo() {
  if (redoStack.length === 0) return;
  const currentJson = JSON.stringify(allParticipants);
  undoStack.push(currentJson);
  const nextJson = redoStack.pop();
  allParticipants = JSON.parse(nextJson);
  await saveParticipantsToCloud(allParticipants);
  render(allParticipants);
  updateUndoRedoButtons();
}

if (undoBtn) undoBtn.addEventListener("click", handleUndo);
if (redoBtn) redoBtn.addEventListener("click", handleRedo);

function updateOrganizerUi() {
  if (isOrganizerUnlocked) {
    organizerToggleBtn.textContent = "🔓 Lock Dashboard";
    organizerToggleBtn.style.background = "#059669";
    organizerModeTag.classList.remove("hidden");
    addParticipantBtn.classList.remove("hidden");
    if (undoBtn) undoBtn.classList.remove("hidden");
    if (redoBtn) redoBtn.classList.remove("hidden");
  } else {
    organizerToggleBtn.textContent = "🔒 Organizer Login";
    organizerToggleBtn.style.background = "#2563eb";
    organizerModeTag.classList.add("hidden");
    addParticipantBtn.classList.add("hidden");
    if (undoBtn) undoBtn.classList.add("hidden");
    if (redoBtn) redoBtn.classList.add("hidden");
  }
  updateUndoRedoButtons();
  render(allParticipants);
}

organizerToggleBtn.addEventListener("click", () => {
  if (isOrganizerUnlocked) {
    isOrganizerUnlocked = false;
    updateOrganizerUi();
  } else {
    dashPinModal.classList.remove("hidden");
    dashPinInput.value = "";
    dashPinError.textContent = "";
    dashPinInput.focus();
  }
});

let pinFailCount = 0;
let pinLockoutUntil = 0;
let inactivityTimer = null;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (isOrganizerUnlocked) {
    inactivityTimer = setTimeout(() => {
      isOrganizerUnlocked = false;
      updateOrganizerUi();
      console.log("Organizer mode locked due to 10-minute inactivity.");
    }, 10 * 60 * 1000);
  }
}

["click", "keydown", "touchstart"].forEach(evt => {
  window.addEventListener(evt, () => {
    if (isOrganizerUnlocked) resetInactivityTimer();
  }, { passive: true });
});

async function verifyDashPin() {
  const now = Date.now();
  if (now < pinLockoutUntil) {
    const remaining = Math.ceil((pinLockoutUntil - now) / 1000);
    dashPinError.textContent = "Too many attempts. Locked for " + remaining + "s.";
    return;
  }

  const entered = dashPinInput ? dashPinInput.value.trim() : "";
  const valid = await isPinValid(entered);

  if (valid) {
    pinFailCount = 0;
    isOrganizerUnlocked = true;
    dashPinModal.classList.add("hidden");
    updateOrganizerUi();
    resetInactivityTimer();
  } else {
    pinFailCount++;
    if (pinFailCount >= 5) {
      pinLockoutUntil = Date.now() + 30000;
      dashPinError.textContent = "5 incorrect attempts. Locked for 30s.";
    } else {
      dashPinError.textContent = "Incorrect PIN (" + (5 - pinFailCount) + " attempts left).";
    }
    dashPinInput.value = "";
    dashPinInput.focus();
  }
}

if (submitDashPinBtn) submitDashPinBtn.addEventListener("click", verifyDashPin);
if (dashPinInput) {
  dashPinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyDashPin();
  });
}
if (cancelDashPinBtn) {
  cancelDashPinBtn.addEventListener("click", () => {
    dashPinModal.classList.add("hidden");
  });
}
if (dashPinModal) {
  dashPinModal.addEventListener("click", (e) => {
    if (e.target === dashPinModal) dashPinModal.classList.add("hidden");
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && dashPinModal && !dashPinModal.classList.contains("hidden")) {
    dashPinModal.classList.add("hidden");
  }
});

addParticipantBtn.addEventListener("click", async () => {
  if (!isOrganizerUnlocked) return;
  const nextNum = allParticipants.length + 1;
  const defaultId = "SOT" + String(nextNum).padStart(3, "0");
  
  const id = prompt("Enter Participant ID (e.g. " + defaultId + "):", defaultId);
  if (!id || !id.trim()) return;
  
  const name = prompt("Enter Participant Name:", "Participant " + id.trim().toUpperCase());
  if (!name || !name.trim()) return;

  addParticipantBtn.textContent = "Adding...";
  addParticipantBtn.disabled = true;

  try {
    const res = await addParticipant(id.trim().toUpperCase(), name.trim());
    if (res && res.ok) {
      await init();
    }
  } catch (err) {
    console.error("Add participant failed:", err);
    alert("Error adding participant: " + err.message);
  } finally {
    addParticipantBtn.textContent = "➕ Add Participant";
    addParticipantBtn.disabled = false;
  }
});

const exportBtn = document.getElementById("exportCsvBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", exportExcelCSV);
}
