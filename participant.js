function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

// ==========================================
// CONFIGURATION: Admin PIN & Endpoints
// ==========================================
const ADMIN_PIN = "1234";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/export?format=csv";
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec";

const LOCAL_STORAGE_KEY = "socioOthon_participants_v8_1";
const AUTH_KEY = "socioOthon_admin_auth";

// Initial seed loaded safely from data/seed.js or window.SOCIO_DEFAULT_PARTICIPANTS
const defaultSeed = (typeof window !== "undefined" && Array.isArray(window.SOCIO_DEFAULT_PARTICIPANTS))
  ? window.SOCIO_DEFAULT_PARTICIPANTS
  : [];

// ==========================================
// BULLETPROOF PARTICIPANT ID EXTRACTION
// ==========================================
function getRequestedParticipantId() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get("id") || urlParams.get("participantId") || urlParams.get("p");
    if (!id) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const pIndex = pathParts.indexOf("p");
      if (pIndex !== -1 && pathParts[pIndex + 1]) {
        id = decodeURIComponent(pathParts[pIndex + 1]);
      }
    }
    if (typeof id === "string") {
      return id.trim();
    }
  } catch (err) {
    console.warn("Could not parse participant ID from URL:", err);
  }
  return "";
}

// Cached DOM Elements
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
let currentParticipant = null;

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

  if (enabled) {
    if (editStatusBtn) editStatusBtn.classList.add("hidden");
    if (saveButton) saveButton.classList.remove("hidden");
    if (addFieldBtn) addFieldBtn.classList.remove("hidden");
    if (addChecklistBtn) addChecklistBtn.classList.remove("hidden");
    if (authBanner) authBanner.className = "auth-banner unlocked";
    if (authStatusText) authStatusText.innerHTML = "✅ <strong>Organizer Mode:</strong> Name, ID & Info Editing Enabled";
    if (unlockBtn) unlockBtn.textContent = "Lock";

    if (idView && idEdit) {
      idView.classList.add("hidden");
      idEdit.classList.remove("hidden");
      if (editIdInput && currentParticipant) editIdInput.value = currentParticipant.id;
    }
    if (nameView && nameEdit) {
      nameView.classList.add("hidden");
      nameEdit.classList.remove("hidden");
      if (editNameInput && currentParticipant) editNameInput.value = currentParticipant.name;
    }
  } else {
    if (editStatusBtn) editStatusBtn.classList.remove("hidden");
    if (saveButton) saveButton.classList.add("hidden");
    if (addFieldBtn) addFieldBtn.classList.add("hidden");
    if (addChecklistBtn) addChecklistBtn.classList.add("hidden");
    if (authBanner) authBanner.className = "auth-banner";
    if (authStatusText) authStatusText.innerHTML = "👁️ <strong>Viewing Mode:</strong> Details visible (Read-only)";
    if (unlockBtn) unlockBtn.textContent = "🔒 Organizer Login";

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
  if (pinModal) {
    pinModal.classList.remove("hidden");
    if (modalPinInput) {
      modalPinInput.value = "";
      modalPinInput.focus();
    }
    if (modalPinError) modalPinError.textContent = "";
  }
}

function closePinModal() {
  if (pinModal) {
    pinModal.classList.add("hidden");
    if (modalPinInput) modalPinInput.value = "";
    if (modalPinError) modalPinError.textContent = "";
  }
}

let partPinFailCount = 0;
let partPinLockoutUntil = 0;
let partInactivityTimer = null;

function resetPartInactivityTimer() {
  clearTimeout(partInactivityTimer);
  if (isOrganizerUnlocked) {
    partInactivityTimer = setTimeout(() => {
      isOrganizerUnlocked = false;
      setEditModeEnabled(false);
      console.log("Organizer mode locked due to 10-minute inactivity.");
    }, 10 * 60 * 1000);
  }
}

["click", "keydown", "touchstart"].forEach(evt => {
  window.addEventListener(evt, () => {
    if (isOrganizerUnlocked) resetPartInactivityTimer();
  }, { passive: true });
});

function verifyPin() {
  const now = Date.now();
  if (now < partPinLockoutUntil) {
    const remaining = Math.ceil((partPinLockoutUntil - now) / 1000);
    if (modalPinError) modalPinError.textContent = "Too many attempts. Locked for " + remaining + "s.";
    return;
  }

  const entered = modalPinInput ? modalPinInput.value.trim() : "";
  if (entered === ADMIN_PIN) {
    partPinFailCount = 0;
    isOrganizerUnlocked = true;
    closePinModal();
    setEditModeEnabled(true);
    resetPartInactivityTimer();
  } else {
    partPinFailCount++;
    if (partPinFailCount >= 5) {
      partPinLockoutUntil = Date.now() + 30000;
      if (modalPinError) modalPinError.textContent = "5 incorrect attempts. Locked for 30s.";
    } else {
      if (modalPinError) modalPinError.textContent = "Incorrect PIN (" + (5 - partPinFailCount) + " attempts left).";
    }
    if (modalPinInput) {
      modalPinInput.value = "";
      modalPinInput.focus();
    }
  }
}

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
  const teamIdCol = headers.findIndex(h => /team\s*id/i.test(h));
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
    const teamId = (teamIdCol !== -1 && r[teamIdCol]) ? r[teamIdCol].trim() : "";
    
    const status = {
      kit: kitCol !== -1 ? isTruthy(r[kitCol]) : isTruthy(r[3]),
      accommodation: accCol !== -1 ? isTruthy(r[accCol]) : isTruthy(r[4]),
      food: foodCol !== -1 ? isTruthy(r[foodCol]) : isTruthy(r[5])
    };

    const isOnSpot = name.toLowerCase().startsWith("on-spot");

    const fields = {};
    if (teamId) {
      fields["Team ID"] = teamId;
    }

    for (let c = 0; c < headers.length; c++) {
      if (c === idCol || c === nameCol || c === kitCol || c === accCol || c === foodCol || c === teamIdCol) continue;
      const h = headers[c];
      if (!h || /last\s*updated/i.test(h)) continue;
      // Strip email and contact only for blank on-spot walk-in slots
      if (isOnSpot && (/email|mail/i.test(h) || /contact|phone/i.test(h))) continue;

      const val = r[c] ? r[c].trim() : "";
      if (val) {
        const upper = val.toUpperCase();
        if (upper === "YES" || upper === "NO" || upper === "TRUE" || upper === "FALSE") {
          status[h] = isTruthy(val);
        } else {
          fields[h] = val;
        }
      }
    }

    list.push({ id, name, teamId, status, fields });
  }
  return list;
}

async function fetchParticipants() {
  let list = [];

  // 1. Fetch live Google Sheet CSV (primary attached real-time source)
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL + "&_t=" + Date.now());
    if (res.ok) {
      const csv = await res.text();
      const parsed = parseParticipantsFromCSV(csv);
      if (parsed && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.warn("Could not load from Google Sheet CSV, falling back to local:", err);
  }

  // If live sheet data is available, it is the primary attached source
  if (list.length > 0) {
    // Strip email and contact for all on-spot participants (SOT080+)
    list.forEach(p => {
      const num = parseInt(String(p.id).replace(/\D/g, ""), 10) || 0;
      if (num >= 80 && p.fields) {
        delete p.fields.Email;
        delete p.fields.Contact;
        delete p.fields["email"];
        delete p.fields["contact"];
      }
    });

    list.sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

    // Keep local cache perfectly synchronized with the sheet
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
        localList.forEach(p => {
          const num = parseInt(String(p.id).replace(/\D/g, ""), 10) || 0;
          if (num >= 80 && p.fields) {
            delete p.fields.Email;
            delete p.fields.Contact;
          }
        });
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

  // Fallback 3: window.SOCIO_DEFAULT_PARTICIPANTS
  if (typeof window !== "undefined" && Array.isArray(window.SOCIO_DEFAULT_PARTICIPANTS) && window.SOCIO_DEFAULT_PARTICIPANTS.length > 0) {
    return window.SOCIO_DEFAULT_PARTICIPANTS;
  }

  return defaultSeed;
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
        teamId: participant.teamId || (participant.fields && participant.fields["Team ID"]) || "",
        status: newStatus,
        fields: fields || {}
      })
    });
  } catch (e) {
    console.warn("Google Sheet sync error:", e);
  }
}

// ── Rendering Checklist (Default + Custom Checkboxes) ──
function renderChecklist() {
  const container = document.getElementById("checklistContainer");
  if (!container || !currentParticipant) return;
  container.innerHTML = "";

  const status = currentParticipant.status || {};
  const unlocked = isOrganizerAuthenticated();

  const defaultKeys = [
    { key: "kit", label: "Kit received", desc: "Mark when kit has been handed over." },
    { key: "accommodation", label: "Accommodation", desc: "Mark when accommodation is assigned/confirmed." },
    { key: "food", label: "Food arrangement", desc: "Mark when food coupon/token is issued." }
  ];

  const allChecks = [...defaultKeys];
  Object.keys(status).forEach(k => {
    if (!defaultKeys.some(d => d.key === k)) {
      allChecks.push({ key: k, label: k, desc: "Custom attendance item: " + k });
    }
  });

  allChecks.forEach(item => {
    const isChecked = !!status[item.key];
    const row = document.createElement("label");
    row.className = "check-row";

    const deleteBtn = (unlocked && !defaultKeys.some(d => d.key === item.key))
      ? '<button type="button" class="field-del-btn" data-del-check="' + escapeHtml(item.key) + '" title="Delete this check item">🗑️</button>'
      : "";

    row.innerHTML = `
      <input type="checkbox" id="check_${escapeHtml(item.key)}" ${isChecked ? 'checked' : ''} ${unlocked ? '' : 'disabled'} />
      <span style="flex:1;">
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.desc)}</small>
      </span>
      ${deleteBtn}
    `;
    container.appendChild(row);
  });

  container.querySelectorAll("[data-del-check]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const k = btn.dataset.delCheck;
      if (confirm('Remove checklist item "' + k + '"?')) {
        delete currentParticipant.status[k];
        renderChecklist();
        updateBadge();
      }
    });
  });

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
  if (badge) {
    badge.textContent = `${completed} / ${total} completed`;
    badge.classList.toggle("complete", completed === total && total > 0);
  }
}

function renderCustomFields() {
  const container = document.getElementById("customFieldsContainer");
  if (!container || !currentParticipant) return;
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
        <span class="field-label">${escapeHtml(k)}</span>
        <div style="display:flex; align-items:center; gap:6px; flex:1; justify-content:flex-end;">
          <input type="text" class="field-input" data-field-key="${escapeHtml(k)}" value="${escapeHtml(val)}" placeholder="Enter ${escapeHtml(k)}..." />
          <button type="button" class="field-del-btn" data-del-field="${escapeHtml(k)}" title="Delete field">🗑️</button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <span class="field-label">${escapeHtml(k)}</span>
        <span class="field-value">${val ? escapeHtml(val) : '<em style="color:#94a3b8;">Not provided</em>'}</span>
      `;
    }
    container.appendChild(row);
  });

  if (unlocked) {
    container.querySelectorAll("[data-del-field]").forEach(btn => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.delField;
        if (confirm('Delete information field "' + k + '"?')) {
          delete currentParticipant.fields[k];
          if (!currentParticipant._deletedFields) currentParticipant._deletedFields = [];
          if (!currentParticipant._deletedFields.includes(k)) currentParticipant._deletedFields.push(k);
          renderCustomFields();
        }
      });
    });

    container.querySelectorAll(".field-input").forEach(input => {
      input.addEventListener("input", (e) => {
        const k = input.dataset.fieldKey;
        currentParticipant.fields[k] = e.target.value.trim();
      });
    });
  }
}

// ── Add New Information Field ──
if (addFieldBtn) {
  addFieldBtn.addEventListener("click", () => {
    if (!isOrganizerAuthenticated() || !currentParticipant) return;
    const fieldName = prompt("Enter Field Name (e.g. Email, Phone Number, College, Food Preference):");
    if (!fieldName || !fieldName.trim()) return;

    const key = fieldName.trim();
    if (!currentParticipant.fields) currentParticipant.fields = {};
    if (currentParticipant.fields[key] !== undefined) {
      alert("Field already exists!");
      return;
    }

    const initialVal = prompt("Enter " + key + " for " + currentParticipant.name + ":", "");
    currentParticipant.fields[key] = initialVal !== null ? initialVal.trim() : "";
    renderCustomFields();
  });
}

// ── Add New Checkbox Item ──
if (addChecklistBtn) {
  addChecklistBtn.addEventListener("click", () => {
    if (!isOrganizerAuthenticated() || !currentParticipant) return;
    const checkName = prompt("Enter New Checkbox Name (e.g. ID Card Issued, Certificate Given, T-Shirt):");
    if (!checkName || !checkName.trim()) return;

    const key = checkName.trim();
    if (!currentParticipant.status) currentParticipant.status = {};
    currentParticipant.status[key] = false;
    renderChecklist();
  });
}

async function loadParticipant() {
  try {
    const queryId = getRequestedParticipantId();
    if (!queryId) {
      if (participantPanel) participantPanel.classList.add("hidden");
      if (notFoundPanel) {
        notFoundPanel.classList.remove("hidden");
        const msgEl = notFoundPanel.querySelector("p");
        if (msgEl) msgEl.textContent = "No participant ID provided in the link. Please scan a valid QR code or select a participant from the dashboard.";
      }
      return;
    }

    const cleanQueryId = queryId.toUpperCase();
    const list = await fetchParticipants();

    currentParticipant = list.find(p => {
      if (!p || !p.id) return false;
      const pidUpper = String(p.id).trim().toUpperCase();
      if (pidUpper === cleanQueryId) return true;
      const numP = parseInt(pidUpper.replace(/\D/g, ""), 10);
      const numQ = parseInt(cleanQueryId.replace(/\D/g, ""), 10);
      return !isNaN(numP) && !isNaN(numQ) && numP === numQ;
    });

    if (!currentParticipant) {
      if (participantPanel) participantPanel.classList.add("hidden");
      if (notFoundPanel) {
        notFoundPanel.classList.remove("hidden");
        const msgEl = notFoundPanel.querySelector("p");
        if (msgEl) msgEl.innerHTML = `Participant <strong>${escapeHtml(queryId)}</strong> was not found in the records.`;
      }
      return;
    }

    if (!currentParticipant.fields) currentParticipant.fields = {};
    if (!currentParticipant.status) currentParticipant.status = {};

    const numCurrent = parseInt(String(currentParticipant.id).replace(/\D/g, ""), 10) || 0;
    if (numCurrent >= 80 && currentParticipant.fields) {
      delete currentParticipant.fields.Email;
      delete currentParticipant.fields.Contact;
      delete currentParticipant.fields["email"];
      delete currentParticipant.fields["contact"];
    }

    if (notFoundPanel) notFoundPanel.classList.add("hidden");
    if (participantPanel) participantPanel.classList.remove("hidden");

    const idEl = document.getElementById("participantId");
    if (idEl) idEl.textContent = currentParticipant.id;
    const nameEl = document.getElementById("participantName");
    if (nameEl) nameEl.textContent = currentParticipant.name;

    setEditModeEnabled(isOrganizerAuthenticated());
  } catch (err) {
    console.error("Critical error in loadParticipant:", err);
    if (notFoundPanel) {
      if (participantPanel) participantPanel.classList.add("hidden");
      notFoundPanel.classList.remove("hidden");
      const msgEl = notFoundPanel.querySelector("p");
      if (msgEl) msgEl.textContent = "An error occurred while loading participant data: " + err.message;
    }
  }
}

// ── Event Handlers ──
if (editStatusBtn) {
  editStatusBtn.addEventListener("click", () => {
    if (isOrganizerAuthenticated()) {
      setEditModeEnabled(true);
    } else {
      openPinModal();
    }
  });
}

if (unlockBtn) {
  unlockBtn.addEventListener("click", () => {
    if (isOrganizerAuthenticated()) {
      isOrganizerUnlocked = false;
      setEditModeEnabled(false);
    } else {
      openPinModal();
    }
  });
}

if (submitPinBtn) submitPinBtn.addEventListener("click", verifyPin);
if (modalPinInput) {
  modalPinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyPin();
  });
}
if (cancelPinBtn) cancelPinBtn.addEventListener("click", closePinModal);
if (pinModal) {
  pinModal.addEventListener("click", (e) => {
    if (e.target === pinModal) closePinModal();
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pinModal && !pinModal.classList.contains("hidden")) {
    closePinModal();
  }
});

if (saveButton) {
  saveButton.addEventListener("click", async () => {
    if (!currentParticipant) return;
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
    currentParticipant.fields = { ...updatedFields };

    // For Google Sheet sync, pass empty string for any explicitly deleted fields so the cell is blanked!
    const syncFields = { ...updatedFields };
    if (currentParticipant._deletedFields && Array.isArray(currentParticipant._deletedFields)) {
      currentParticipant._deletedFields.forEach(k => {
        syncFields[k] = "";
      });
    }

    // Collect edited Name, ID if in organizer mode
    const editIdInput = document.getElementById("editParticipantIdInput");
    const editNameInput = document.getElementById("editParticipantNameInput");
    const oldId = currentParticipant.id;

    if (editNameInput && editNameInput.value.trim()) {
      currentParticipant.name = editNameInput.value.trim();
    }
    if (editIdInput && editIdInput.value.trim()) {
      currentParticipant.id = editIdInput.value.trim().toUpperCase();
    }

    // 1. Save to local storage cache immediately
    const list = await fetchParticipants();
    const idx = list.findIndex(p => p.id.toUpperCase() === oldId.toUpperCase());
    if (idx !== -1) {
      list[idx] = currentParticipant;
    } else {
      list.push(currentParticipant);
    }
    list.sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    if (currentParticipant.id.toUpperCase() !== oldId.toUpperCase()) {
      try {
        fetch(GOOGLE_SHEET_API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_participant", id: oldId.toUpperCase() })
        });
      } catch (e) {}
    }

    // 2. Real-time sync to Google Sheet
    await syncToGoogleSheet(currentParticipant, currentParticipant.status, syncFields);

    // Update display values
    const idEl = document.getElementById("participantId");
    if (idEl) idEl.textContent = currentParticipant.id;
    const nameEl = document.getElementById("participantName");
    if (nameEl) nameEl.textContent = currentParticipant.name;

    // Update browser URL bar seamlessly if ID changed so refreshing page doesn't break
    if (currentParticipant.id !== oldId) {
      const newUrl = `${window.location.pathname}?id=${encodeURIComponent(currentParticipant.id)}`;
      window.history.replaceState(null, "", newUrl);
    }

    const msg = document.getElementById("saveMessage");
    if (msg) {
      msg.textContent = "✅ Saved & Synced to Google Sheet!";
      msg.style.color = "#067647";
    }

    // Automatically lock immediately after saving!
    setTimeout(() => {
      isOrganizerUnlocked = false;
      setEditModeEnabled(false);
      if (msg) msg.textContent = "";
      saveButton.disabled = false;
      saveButton.textContent = "💾 Save Updates";
    }, 1800);
  });
}

// Initial load on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadParticipant);
} else {
  loadParticipant();
}
