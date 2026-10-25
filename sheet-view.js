// Digital Google Sheet Client Script
const ADMIN_PASSWORD = "1234";
const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";
const LOCAL_STORAGE_KEY = "socioOthon_shared_participants";
const SHEET_AUTH_KEY = "socioOthon_sheet_admin_auth";

let rowsData = [];
let pendingEditId = null;

function isSheetAdminAuthenticated() {
  return localStorage.getItem(SHEET_AUTH_KEY) === "true";
}

async function fetchSheetData() {
  try {
    const res = await fetch(CLOUD_DB_URL);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.participants)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data.participants));
        return json.data.participants;
      }
    }
  } catch (e) {
    console.warn("Using local cache:", e);
  }
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  return cached ? JSON.parse(cached) : [];
}

function renderTable(list) {
  const tbody = document.getElementById("sheetBody");
  tbody.innerHTML = "";
  document.getElementById("rowCount").textContent = `${list.length} Participants`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No records found.</td></tr>`;
    return;
  }

  const isUnlocked = isSheetAdminAuthenticated();

  list.forEach(p => {
    const tr = document.createElement("tr");

    const kitPill = p.status && p.status.kit
      ? `<span class="status-pill pill-yes">YES</span>`
      : `<span class="status-pill pill-no">NO</span>`;

    const accPill = p.status && p.status.accommodation
      ? `<span class="status-pill pill-yes">YES</span>`
      : `<span class="status-pill pill-no">NO</span>`;

    const foodPill = p.status && p.status.food
      ? `<span class="status-pill pill-yes">YES</span>`
      : `<span class="status-pill pill-no">NO</span>`;

    const actionHtml = isUnlocked
      ? `<button class="button small secondary edit-row-btn" data-id="${p.id}" style="padding:3px 8px; font-size:11px;">✏️ Edit</button>`
      : `<button class="button small secondary lock-row-btn" data-id="${p.id}" style="padding:3px 8px; font-size:11px; color:#64748b;">🔒 Locked</button>`;

    tr.innerHTML = `
      <td><strong>${p.id}</strong></td>
      <td>${p.name || "-"}</td>
      <td><span style="font-size:12px; font-weight:600; color:#4338ca;">${p.team || "Team 1"}</span></td>
      <td>${kitPill}</td>
      <td>${accPill}</td>
      <td>${foodPill}</td>
      <td>${actionHtml}</td>
    `;
    tbody.appendChild(tr);
  });

  // Action listeners
  document.querySelectorAll(".edit-row-btn").forEach(btn => {
    btn.addEventListener("click", () => handleEditRow(btn.dataset.id));
  });

  document.querySelectorAll(".lock-row-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      pendingEditId = btn.dataset.id;
      openPinModal();
    });
  });
}

function openPinModal() {
  document.getElementById("sheetPinModal").classList.remove("hidden");
  document.getElementById("sheetPinInput").value = "";
  document.getElementById("sheetPinError").textContent = "";
  document.getElementById("sheetPinInput").focus();
}

function closePinModal() {
  document.getElementById("sheetPinModal").classList.add("hidden");
  pendingEditId = null;
}

function verifyPassword() {
  const val = document.getElementById("sheetPinInput").value.trim();
  if (val === ADMIN_PASSWORD) {
    localStorage.setItem(SHEET_AUTH_KEY, "true");
    closePinModal();
    updateAuthUi();
    renderTable(rowsData);
    if (pendingEditId) {
      handleEditRow(pendingEditId);
    }
  } else {
    document.getElementById("sheetPinError").textContent = "Incorrect password.";
  }
}

function updateAuthUi() {
  const isUnlocked = isSheetAdminAuthenticated();
  const toggleBtn = document.getElementById("adminEditToggleBtn");
  if (isUnlocked) {
    toggleBtn.textContent = "🔓 Editing Unlocked (Lock)";
    toggleBtn.style.background = "#059669";
  } else {
    toggleBtn.textContent = "🔒 Sheet Edit Access";
    toggleBtn.style.background = "#2563eb";
  }
}

async function handleEditRow(id) {
  const p = rowsData.find(x => x.id.toUpperCase() === id.toUpperCase());
  if (!p) return;

  const newName = prompt(`Edit Name for ${p.id}:`, p.name);
  if (newName === null) return;

  const newTeam = prompt(`Edit Team for ${p.id}:`, p.team || "");
  if (newTeam === null) return;

  p.name = newName.trim();
  p.team = newTeam.trim();

  // Save changes locally in sheet view
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rowsData));
  renderTable(rowsData);

  // Send to Google Sheet script if connected
  const sheetUrl = localStorage.getItem("socioOthon_google_sheet_url");
  if (sheetUrl) {
    try {
      fetch(sheetUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_sheet",
          password: ADMIN_PASSWORD,
          id: p.id,
          newName: p.name,
          newTeam: p.team
        })
      });
    } catch (e) {}
  }

  // NOTE: Requirement 5: "changes made in the sheet must not reflect on the qr cloud details"
  // Therefore, we intentionally do NOT update CLOUD_DB_URL here!
  alert(`Updated ${p.id} on the sheet! (Cloud QR details kept separate)`);
}

async function init() {
  updateAuthUi();
  rowsData = await fetchSheetData();
  renderTable(rowsData);

  // Auto-refresh every 10 seconds to catch real-time QR scans
  setInterval(async () => {
    rowsData = await fetchSheetData();
    const query = document.getElementById("sheetSearch").value.toLowerCase().trim();
    if (query) {
      filterTable(query);
    } else {
      renderTable(rowsData);
    }
  }, 10000);
}

function filterTable(q) {
  const filtered = rowsData.filter(p =>
    p.id.toLowerCase().includes(q) ||
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.team && p.team.toLowerCase().includes(q))
  );
  renderTable(filtered);
}

document.getElementById("sheetSearch").addEventListener("input", (e) => {
  filterTable(e.target.value.toLowerCase().trim());
});

document.getElementById("refreshBtn").addEventListener("click", async () => {
  rowsData = await fetchSheetData();
  renderTable(rowsData);
});

document.getElementById("adminEditToggleBtn").addEventListener("click", () => {
  if (isSheetAdminAuthenticated()) {
    localStorage.removeItem(SHEET_AUTH_KEY);
    updateAuthUi();
    renderTable(rowsData);
  } else {
    openPinModal();
  }
});

document.getElementById("submitSheetPinBtn").addEventListener("click", verifyPassword);
document.getElementById("sheetPinInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyPassword();
});
document.getElementById("cancelSheetPinBtn").addEventListener("click", closePinModal);

document.getElementById("editWebhookBtn").addEventListener("click", () => {
  const cur = localStorage.getItem("socioOthon_google_sheet_url") || "";
  const next = prompt("Enter your Google Apps Script Web App URL:", cur);
  if (next !== null) {
    localStorage.setItem("socioOthon_google_sheet_url", next.trim());
    alert("Google Sheet Web App URL updated!");
  }
});

init();
