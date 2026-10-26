// ==========================================
// CONFIGURATION: Admin PIN & Endpoints
// ==========================================
const ADMIN_PIN = "1234";
const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";
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

// ── Cloud Database Retrieval & Storage ──
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
  } catch (err) {}
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
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

  document.getElementById("participantId").textContent = currentParticipant.id;
  document.getElementById("participantName").textContent = currentParticipant.name;

  const teamEl = document.getElementById("participantTeam");
  if (currentParticipant.team) {
    teamEl.textContent = `Team: ${currentParticipant.team}`;
    teamEl.classList.remove("hidden");
  } else {
    teamEl.classList.add("hidden");
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

  // Collect edited Name and ID if in organizer mode
  const editIdInput = document.getElementById("editParticipantIdInput");
  const editNameInput = document.getElementById("editParticipantNameInput");
  const oldId = currentParticipant.id;

  if (editNameInput && editNameInput.value.trim()) {
    currentParticipant.name = editNameInput.value.trim();
  }
  if (editIdInput && editIdInput.value.trim()) {
    currentParticipant.id = editIdInput.value.trim().toUpperCase();
  }

  // 1. Save to cloud database (handling ID rename if changed)
  const list = await fetchParticipants();
  const idx = list.findIndex(p => p.id.toUpperCase() === oldId.toUpperCase());
  if (idx !== -1) {
    list[idx] = currentParticipant;
  } else {
    list.push(currentParticipant);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

  let ok = false;
  try {
    await fetch(CLOUD_DB_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "socio-o-thon-db",
        data: { participants: list }
      })
    });
    ok = true;
  } catch (e) {
    ok = false;
  }

  // Update display values
  document.getElementById("participantId").textContent = currentParticipant.id;
  document.getElementById("participantName").textContent = currentParticipant.name;

  // Update browser URL bar seamlessly if ID changed so refreshing page doesn't break
  if (currentParticipant.id !== oldId) {
    const newUrl = `${window.location.pathname}?id=${encodeURIComponent(currentParticipant.id)}`;
    window.history.replaceState(null, "", newUrl);
  }

  // 2. Real-time sync to Google Sheet
  await syncToGoogleSheet(currentParticipant, currentParticipant.status, currentParticipant.fields);

  const msg = document.getElementById("saveMessage");
  msg.textContent = ok ? "✅ Saved & Synced to Google Sheet!" : "⚠️ Saved locally";
  msg.style.color = ok ? "#067647" : "#d97706";

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
