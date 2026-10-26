// ==========================================
// CONFIGURATION: Admin PIN & Endpoints
// ==========================================
const ADMIN_PIN = "1234";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/export?format=csv";
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

const addFieldBtn = document.getElementById("addFieldBtn");
const addChecklistBtn = document.getElementById("addChecklistBtn");

const pinModal = document.getElementById("pinModal");
const modalPinInput = document.getElementById("modalPinInput");
const modalPinError = document.getElementById("modalPinError");
const submitPinBtn = document.getElementById("submitPinBtn");
const cancelPinBtn = document.getElementById("cancelPinBtn");

let isOrganizerUnlocked = false;

function isOrganizerAuthenticated() {
  return isOrganizerUnlocked;
}

function setEditModeEnabled(enabled) {
  const idView = document.getElementById("idViewContainer");
  const idEdit = document.getElementById("idEditContainer");
  const nameView = document.getElementById("nameViewContainer");
  const nameEdit = document.getElementById("nameEditContainer");
  const editIdInput = document.getElementById("editParticipantIdInput");
  const editNameInput = document.getElementById("editParticipantNameInput");
  const editTeamInput = document.getElementById("editParticipantTeamInput");

  if (enabled) {
    editStatusBtn.classList.add("hidden");
    saveButton.classList.remove("hidden");
    addFieldBtn.classList.remove("hidden");
    addChecklistBtn.classList.remove("hidden");
    authBanner.className = "auth-banner unlocked";
    authStatusText.innerHTML = "✅ <strong>Organizer Mode:</strong> Name, ID & Info Editing Enabled";
    unlockBtn.textContent = "Lock";

    if (idView && idEdit) {
      idView.classList.add("hidden");
      idEdit.classList.remove("hidden");
      if (editIdInput) editIdInput.value = currentParticipant.id;
    }
    if (nameView && nameEdit) {
      nameView.classList.add("hidden");
      nameEdit.classList.remove("hidden");
      if (editNameInput) editNameInput.value = currentParticipant.name;
      if (editTeamInput) editTeamInput.value = currentParticipant.team || "";
    }
  } else {
    editStatusBtn.classList.remove("hidden");
    saveButton.classList.add("hidden");
    addFieldBtn.classList.add("hidden");
    addChecklistBtn.classList.add("hidden");
    authBanner.className = "auth-banner";
    authStatusText.innerHTML = "👁️ <strong>Viewing Mode:</strong> Details visible (Read-only)";
    unlockBtn.textContent = "🔒 Organizer Login";

    if (idView && idEdit) {
      idView.classList.remove("hidden");
      idEdit.classList.add("hidden");
    }
    if (nameView && nameEdit) {
      nameView.classList.remove("hidden");
      nameEdit.classList.add("hidden");
    }
  }

  renderChecklist();
  renderCustomFields();
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
    isOrganizerUnlocked = true;
    closePinModal();
    setEditModeEnabled(true);
  } else {
    modalPinError.textContent = "Incorrect PIN. Try again.";
    modalPinInput.value = "";
    modalPinInput.focus();
  }
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
  return s === "YES" || s === "TRUE" || s === "1" || s === "CHECKED";
}

function parseParticipantsFromCSV(csvText) {
  const rows = parseCSV(csvText);
  if (!rows || rows.length < 2) return null;
  const headers = rows[0].map(h => h.trim());
  const idCol = headers.findIndex(h => /participant\s*id/i.test(h));
  const nameCol = headers.findIndex(h => /^name$/i.test(h));
  const teamCol = headers.findIndex(h => /team/i.test(h));
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
    const team = (teamCol !== -1 && r[teamCol]) ? r[teamCol].trim() : (r[2] ? r[2].trim() : "");

    const status = {
      kit: kitCol !== -1 ? isTruthy(r[kitCol]) : isTruthy(r[3]),
      accommodation: accCol !== -1 ? isTruthy(r[accCol]) : isTruthy(r[4]),
      food: foodCol !== -1 ? isTruthy(r[foodCol]) : isTruthy(r[5])
    };

    const fields = {};
    for (let c = 0; c < headers.length; c++) {
      if (c === idCol || c === nameCol || c === teamCol || c === kitCol || c === accCol || c === foodCol) continue;
      const h = headers[c];
      if (!h || /last\s*updated/i.test(h)) continue;
      const val = r[c] ? r[c].trim() : "";
      if (val) {
        fields[h] = val;
      }
    }

    list.push({ id, name, team, status, fields });
  }
  return list;
}

async function fetchParticipants() {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL + "&_t=" + Date.now());
    if (res.ok) {
      const csv = await res.text();
      const parsed = parseParticipantsFromCSV(csv);
      if (parsed && parsed.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not load from Google Sheet CSV, trying localStorage:", err);
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return [
    { id: "SOT001", name: "Participant 001", team: "Team 1", status: { kit: false, accommodation: false, food: false }, fields: {} },
    { id: "SOT002", name: "Participant 002", team: "Team 1", status: { kit: false, accommodation: false, food: false }, fields: {} },
    { id: "SOT003", name: "Participant 003", team: "Team 2", status: { kit: false, accommodation: false, food: false }, fields: {} },
    { id: "SOT004", name: "Participant 004", team: "Team 2", status: { kit: false, accommodation: false, food: false }, fields: {} },
    { id: "SOT005", name: "Participant 005", team: "Team 3", status: { kit: false, accommodation: false, food: false }, fields: {} }
  ];
}

// ── Real-Time Sync to Google Sheet ──
async function syncToGoogleSheet(participant, newStatus, fields) {
  const sheetUrl = GOOGLE_SHEET_API_URL || localStorage.getItem("socioOthon_google_sheet_url");
  if (!sheetUrl) return;

  try {
    await fetch(sheetUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_status",
        id: participant.id,
        name: participant.name,
        team: participant.team || "",
        status: newStatus,
        fields: fields || {}
      })
    });
  } catch (e) {
    console.warn("Google Sheet sync error:", e);
  }
}

async function updateCloudParticipant(updated) {
  const list = await fetchParticipants();
  const idx = list.findIndex(p => p.id.toUpperCase() === updated.id.toUpperCase());
  if (idx !== -1) {
    list[idx] = updated;
  } else {
    list.push(updated);
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
    return false;
  }
}

// ── Rendering Checklist (Default + Custom Checkboxes) ──
function renderChecklist() {
  const container = document.getElementById("checklistContainer");
  container.innerHTML = "";

  const status = currentParticipant.status || {};
  const unlocked = isOrganizerAuthenticated();

  const defaultKeys = [
    { key: "kit", label: "Kit received", desc: "Mark when kit has been handed over." },
    { key: "accommodation", label: "Accommodation", desc: "Mark when accommodation is assigned/confirmed." },
    { key: "food", label: "Food arrangement", desc: "Mark when food coupon/token is issued." }
  ];

  // Combine default with any custom added checklist items
  const allChecks = [...defaultKeys];
  Object.keys(status).forEach(k => {
    if (!defaultKeys.some(d => d.key === k)) {
      allChecks.push({ key: k, label: k, desc: `Custom attendance item: ${k}` });
    }
  });

  allChecks.forEach(item => {
    const isChecked = !!status[item.key];
    const row = document.createElement("label");
    row.className = "check-row";

    const deleteBtn = (unlocked && !defaultKeys.some(d => d.key === item.key))
      ? `<button type="button" class="field-del-btn" data-del-check="${item.key}" title="Delete this check item">🗑️</button>`
      : "";

    row.innerHTML = `
      <input type="checkbox" id="check_${item.key}" ${isChecked ? 'checked' : ''} ${unlocked ? '' : 'disabled'} />
      <span style="flex:1;">
        <strong>${item.label}</strong>
        <small>${item.desc}</small>
      </span>
      ${deleteBtn}
    `;
    container.appendChild(row);
  });

  // Attach delete handlers for custom checklist items
  container.querySelectorAll("[data-del-check]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const k = btn.dataset.delCheck;
      if (confirm(`Remove checklist item "${k}"?`)) {
        delete currentParticipant.status[k];
        renderChecklist();
        updateBadge();
      }
    });
  });

  // Attach change listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener("change", updateBadge);
  });

  updateBadge();
}

function updateBadge() {
  const checkboxes = document.querySelectorAll('#checklistContainer input[type="checkbox"]');
  const total = checkboxes.length;
  const completed = Array.from(checkboxes).filter(c => c.checked).length;
  const badge = document.getElementById("statusBadge");
  badge.textContent = `${completed} / ${total} completed`;
  badge.classList.toggle("complete", completed === total && total > 0);
}

// ── Rendering Custom Text Fields (Email, Phone, College, etc.) ──
function renderCustomFields() {
  const container = document.getElementById("customFieldsContainer");
  container.innerHTML = "";

  const fields = currentParticipant.fields || {};
  const unlocked = isOrganizerAuthenticated();

  const keys = Object.keys(fields);
  if (keys.length === 0) {
    container.innerHTML = `<div style="font-size:13px; color:#94a3b8; padding:8px 0;">No extra fields added yet (e.g. Email, Phone, College).</div>`;
    return;
  }

  keys.forEach(k => {
    const val = fields[k] || "";
    const row = document.createElement("div");
    row.className = "field-row";

    if (unlocked) {
      row.innerHTML = `
        <span class="field-label">${k}</span>
        <div style="display:flex; align-items:center; gap:6px; flex:1; justify-content:flex-end;">
          <input type="text" class="field-input" data-field-key="${k}" value="${val}" placeholder="Enter ${k}..." />
          <button type="button" class="field-del-btn" data-del-field="${k}" title="Delete field">🗑️</button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <span class="field-label">${k}</span>
        <span class="field-value">${val || '<em style="color:#94a3b8;">Not provided</em>'}</span>
      `;
    }
    container.appendChild(row);
  });

  if (unlocked) {
    // Delete field listener
    container.querySelectorAll("[data-del-field]").forEach(btn => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.delField;
        if (confirm(`Delete information field "${k}"?`)) {
          delete currentParticipant.fields[k];
          renderCustomFields();
        }
      });
    });

    // Input changes
    container.querySelectorAll(".field-input").forEach(input => {
      input.addEventListener("input", (e) => {
        const k = input.dataset.fieldKey;
        currentParticipant.fields[k] = e.target.value.trim();
      });
    });
  }
}

// ── Add New Information Field (Email, Phone, College, etc.) ──
addFieldBtn.addEventListener("click", () => {
  if (!isOrganizerAuthenticated()) return;
  const fieldName = prompt("Enter Field Name (e.g. Email, Phone Number, College, Food Preference):");
  if (!fieldName || !fieldName.trim()) return;

  const key = fieldName.trim();
  if (!currentParticipant.fields) currentParticipant.fields = {};
  if (currentParticipant.fields[key] !== undefined) {
    alert("Field already exists!");
    return;
  }

  const initialVal = prompt(`Enter ${key} for ${currentParticipant.name}:`, "");
  currentParticipant.fields[key] = initialVal !== null ? initialVal.trim() : "";
  renderCustomFields();
});

// ── Add New Checkbox Item ──
addChecklistBtn.addEventListener("click", () => {
  if (!isOrganizerAuthenticated()) return;
  const checkName = prompt("Enter New Checkbox Name (e.g. ID Card Issued, Certificate Given, T-Shirt):");
  if (!checkName || !checkName.trim()) return;

  const key = checkName.trim();
  if (!currentParticipant.status) currentParticipant.status = {};
  currentParticipant.status[key] = false;
  renderChecklist();
});

async function loadParticipant() {
  if (!participantId) {
    participantPanel.classList.add("hidden");
    notFoundPanel.classList.remove("hidden");
    return;
  }

  const list = await fetchParticipants();
  currentParticipant = list.find(p => p.id.toUpperCase() === participantId.toUpperCase());

  if (!currentParticipant) {
    participantPanel.classList.add("hidden");
    notFoundPanel.classList.remove("hidden");
    return;
  }

  if (!currentParticipant.fields) currentParticipant.fields = {};
  if (!currentParticipant.status) currentParticipant.status = {};

  participantPanel.classList.remove("hidden");
  notFoundPanel.classList.add("hidden");

  const idEl = document.getElementById("participantId");
  if (idEl) idEl.textContent = currentParticipant.id;
  const nameEl = document.getElementById("participantName");
  if (nameEl) nameEl.textContent = currentParticipant.name;

  const teamEl = document.getElementById("participantTeam");
  if (teamEl) {
    if (currentParticipant.team) {
      teamEl.textContent = `Team: ${currentParticipant.team}`;
      teamEl.classList.remove("hidden");
    } else {
      teamEl.classList.add("hidden");
    }
  }

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
    isOrganizerUnlocked = false;
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

  // Collect all checkbox statuses
  const updatedStatus = {};
  document.querySelectorAll('#checklistContainer input[type="checkbox"]').forEach(c => {
    const k = c.id.replace("check_", "");
    updatedStatus[k] = c.checked;
  });
  currentParticipant.status = updatedStatus;

  // Collect all custom fields
  const updatedFields = {};
  document.querySelectorAll(".field-input").forEach(input => {
    const k = input.dataset.fieldKey;
    updatedFields[k] = input.value.trim();
  });
  currentParticipant.fields = updatedFields;

  // Collect edited Name, ID, Team if in organizer mode
  const editIdInput = document.getElementById("editParticipantIdInput");
  const editNameInput = document.getElementById("editParticipantNameInput");
  const editTeamInput = document.getElementById("editParticipantTeamInput");
  const oldId = currentParticipant.id;

  if (editNameInput && editNameInput.value.trim()) {
    currentParticipant.name = editNameInput.value.trim();
  }
  if (editIdInput && editIdInput.value.trim()) {
    currentParticipant.id = editIdInput.value.trim().toUpperCase();
  }
  if (editTeamInput) {
    currentParticipant.team = editTeamInput.value.trim();
  }

  // 1. Save to local storage cache immediately
  const list = await fetchParticipants();
  const idx = list.findIndex(p => p.id.toUpperCase() === oldId.toUpperCase());
  if (idx !== -1) {
    list[idx] = currentParticipant;
  } else {
    list.push(currentParticipant);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

  // 2. Real-time sync to Google Sheet
  await syncToGoogleSheet(currentParticipant, currentParticipant.status, currentParticipant.fields);

  // Update display values
  const idEl = document.getElementById("participantId");
  if (idEl) idEl.textContent = currentParticipant.id;
  const nameEl = document.getElementById("participantName");
  if (nameEl) nameEl.textContent = currentParticipant.name;
  const teamEl = document.getElementById("participantTeam");
  if (teamEl) {
    if (currentParticipant.team) {
      teamEl.textContent = `Team: ${currentParticipant.team}`;
      teamEl.classList.remove("hidden");
    } else {
      teamEl.classList.add("hidden");
    }
  }

  // Update browser URL bar seamlessly if ID changed so refreshing page doesn't break
  if (currentParticipant.id !== oldId) {
    const newUrl = `${window.location.pathname}?id=${encodeURIComponent(currentParticipant.id)}`;
    window.history.replaceState(null, "", newUrl);
  }

  const msg = document.getElementById("saveMessage");
  msg.textContent = "✅ Saved & Synced to Google Sheet!";
  msg.style.color = "#067647";

  // Automatically lock immediately after saving!
  setTimeout(() => {
    isOrganizerUnlocked = false;
    setEditModeEnabled(false);
    msg.textContent = "";
    saveButton.disabled = false;
    saveButton.textContent = "💾 Save Updates";
  }, 1800);
});

loadParticipant();
