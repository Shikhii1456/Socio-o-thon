// ==========================================
// Digital Google Sheet Client Script
// Full Google Sheets Interface with Dynamic Columns and Rows
// ==========================================
const SHEET_ADMIN_PASSWORD = "5678";
const CLOUD_DB_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1156100f012a9";
const LOCAL_STORAGE_KEY = "socioOthon_shared_participants";
const SHEET_AUTH_KEY = "socioOthon_sheet_admin_auth";
const CUSTOM_COLUMNS_KEY = "socioOthon_sheet_custom_columns";
const EXTRA_SHEET_DATA_KEY = "socioOthon_sheet_extra_data";

// Default columns like Google Sheets
const DEFAULT_COLUMNS = [
  { key: "id", label: "Participant ID", width: "130px" },
  { key: "team", label: "Team ID", width: "120px" },
  { key: "name", label: "Participant Name", width: "200px" },
  { key: "kit", label: "Kit Received", width: "120px", isBoolean: true },
  { key: "accommodation", label: "Accommodation", width: "130px", isBoolean: true },
  { key: "food", label: "Food Received", width: "120px", isBoolean: true }
];

let columns = [];
let sheetRows = [];
let selectedCell = null;
let selectedRowIndex = null;

function isUnlocked() {
  return localStorage.getItem(SHEET_AUTH_KEY) === "true";
}

function loadColumns() {
  const saved = localStorage.getItem(CUSTOM_COLUMNS_KEY);
  if (saved) {
    try {
      columns = JSON.parse(saved);
      return;
    } catch (e) {}
  }
  columns = [...DEFAULT_COLUMNS];
}

function saveColumns() {
  localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
}

function getColumnLetter(index) {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

async function fetchLiveCloudData() {
  try {
    const res = await fetch(CLOUD_DB_URL);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.participants)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data.participants));
        return json.data.participants;
      }
    }
  } catch (e) {}
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  return cached ? JSON.parse(cached) : [];
}

function buildGrid(filterQuery = "") {
  const thead = document.getElementById("sheetThead");
  const tbody = document.getElementById("sheetTbody");
  const unlocked = isUnlocked();

  // Top Column Letter Row (A, B, C, D...) & Name
  let headHtml = `<tr><th class="gs-corner"></th>`;
  columns.forEach((col, idx) => {
    const letter = getColumnLetter(idx);
    headHtml += `
      <th class="gs-th" style="width:${col.width || '140px'};">
        <div style="font-size:10px; color:#94a3b8; font-weight:700;">${letter}</div>
        <div style="font-size:12px; color:#1e293b; margin-top:2px;">${col.label}</div>
      </th>
    `;
  });
  headHtml += `</tr>`;
  thead.innerHTML = headHtml;

  // Render Rows
  tbody.innerHTML = "";
  const filtered = filterQuery
    ? sheetRows.filter(r => {
        return Object.values(r).some(val =>
          String(val).toLowerCase().includes(filterQuery.toLowerCase())
        );
      })
    : sheetRows;

  document.getElementById("statsCounter").textContent = `${filtered.length} Rows | ${columns.length} Columns`;

  filtered.forEach((row, rowIdx) => {
    const tr = document.createElement("tr");
    if (selectedRowIndex === rowIdx) tr.style.background = "#eff6ff";

    // Row Number (1, 2, 3...)
    let trHtml = `<td class="gs-row-num" data-row-idx="${rowIdx}">${rowIdx + 1}</td>`;

    columns.forEach((col, colIdx) => {
      const colLetter = getColumnLetter(colIdx);
      const cellCoordinate = `${colLetter}${rowIdx + 1}`;
      let val = row[col.key];

      if (col.isBoolean) {
        // Boolean check from QR status
        const isTrue = val === true || String(val).toUpperCase() === "TRUE" || String(val).toUpperCase() === "YES";
        const pillClass = isTrue ? "status-true" : "status-false";
        const pillText = isTrue ? "TRUE" : "FALSE";
        trHtml += `
          <td class="gs-td" 
              data-cell-id="${cellCoordinate}" 
              data-col-key="${col.key}" 
              data-row-idx="${rowIdx}" 
              tabindex="0"
              style="text-align:center;">
            <span class="status-badge ${pillClass}">${pillText}</span>
          </td>
        `;
      } else {
        const displayVal = (val === undefined || val === null) ? "" : String(val);
        trHtml += `
          <td class="gs-td" 
              data-cell-id="${cellCoordinate}" 
              data-col-key="${col.key}" 
              data-row-idx="${rowIdx}" 
              contenteditable="${unlocked ? 'true' : 'false'}" 
              tabindex="0">
            ${displayVal}
          </td>
        `;
      }
    });

    tr.innerHTML = trHtml;
    tbody.appendChild(tr);
  });

  attachCellEvents();
}

function attachCellEvents() {
  const cells = document.querySelectorAll("td.gs-td");
  const formulaInput = document.getElementById("formulaInput");
  const selectedCellId = document.getElementById("selectedCellId");

  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      document.querySelectorAll("td.gs-td.selected").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
      selectedCell = cell;

      const cellId = cell.dataset.cellId;
      selectedCellId.textContent = cellId;

      const rowIdx = parseInt(cell.dataset.rowIdx, 10);
      const colKey = cell.dataset.colKey;
      selectedRowIndex = rowIdx;

      const currentVal = sheetRows[rowIdx] ? (sheetRows[rowIdx][colKey] || "") : "";
      formulaInput.value = currentVal;
    });

    // Handle in-cell direct typing when unlocked
    if (isUnlocked()) {
      cell.addEventListener("blur", () => {
        const rowIdx = parseInt(cell.dataset.rowIdx, 10);
        const colKey = cell.dataset.colKey;
        const col = columns.find(c => c.key === colKey);
        if (!col || col.isBoolean) return;

        const newVal = cell.innerText.trim();
        if (sheetRows[rowIdx]) {
          sheetRows[rowIdx][colKey] = newVal;
          saveExtraData();
          formulaInput.value = newVal;
        }
      });

      // Toggle boolean cell on double click
      cell.addEventListener("dblclick", () => {
        const rowIdx = parseInt(cell.dataset.rowIdx, 10);
        const colKey = cell.dataset.colKey;
        const col = columns.find(c => c.key === colKey);
        if (col && col.isBoolean) {
          const cur = sheetRows[rowIdx][colKey];
          sheetRows[rowIdx][colKey] = !cur;
          buildGrid();
        }
      });
    }
  });

  // Row header click to select whole row
  document.querySelectorAll("td.gs-row-num").forEach(numCell => {
    numCell.addEventListener("click", () => {
      selectedRowIndex = parseInt(numCell.dataset.rowIdx, 10);
      buildGrid();
    });
  });
}

function saveExtraData() {
  localStorage.setItem(EXTRA_SHEET_DATA_KEY, JSON.stringify(sheetRows));
}

// Merge cloud participants with extra custom sheet data
async function loadFullSheetData() {
  const cloudList = await fetchLiveCloudData();
  const savedExtra = localStorage.getItem(EXTRA_SHEET_DATA_KEY);
  let extraRows = [];
  if (savedExtra) {
    try { extraRows = JSON.parse(savedExtra); } catch (e) {}
  }

  // Create unified rows
  const merged = [];
  cloudList.forEach((p, idx) => {
    const extra = extraRows.find(e => e.id === p.id) || {};
    merged.push({
      id: p.id,
      team: p.team || extra.team || "Team 1",
      name: p.name || extra.name || "",
      kit: p.status && p.status.kit,
      accommodation: p.status && p.status.accommodation,
      food: p.status && p.status.food,
      ...extra
    });
  });

  // Append any locally added custom rows not in cloud
  extraRows.forEach(extra => {
    if (extra.id && !merged.some(m => m.id === extra.id)) {
      merged.push(extra);
    }
  });

  sheetRows = merged;
  buildGrid();
}

// ── Toolbar Actions (Add Row, Add Column, Export) ──

function handleAddRow() {
  if (!isUnlocked()) {
    openPasswordModal();
    return;
  }
  const nextNum = sheetRows.length + 1;
  const newRow = {
    id: `SOT${String(nextNum).padStart(3, "0")}`,
    team: "Team 1",
    name: `Participant ${String(nextNum).padStart(3, "0")}`,
    kit: false,
    accommodation: false,
    food: false
  };
  sheetRows.push(newRow);
  saveExtraData();
  buildGrid();
}

function handleAddColumn() {
  if (!isUnlocked()) {
    openPasswordModal();
    return;
  }
  const colName = prompt("Enter New Column Header Name (e.g. T-Shirt Size, College, Payment Status):");
  if (!colName || !colName.trim()) return;

  const key = "col_" + Date.now();
  columns.push({
    key: key,
    label: colName.trim(),
    width: "150px",
    isBoolean: false
  });
  saveColumns();
  buildGrid();
}

function handleDeleteRow() {
  if (!isUnlocked()) {
    openPasswordModal();
    return;
  }
  if (selectedRowIndex === null || !sheetRows[selectedRowIndex]) {
    alert("Please click a row number on the left first to select it for deletion.");
    return;
  }
  const target = sheetRows[selectedRowIndex];
  if (!confirm(`Delete Row ${selectedRowIndex + 1} (${target.id} - ${target.name}) from sheet?`)) return;

  sheetRows.splice(selectedRowIndex, 1);
  selectedRowIndex = null;
  saveExtraData();
  buildGrid();
}

function exportCsv() {
  let csv = "\uFEFF";
  // Header row
  csv += columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(",") + "\n";
  // Rows
  sheetRows.forEach(row => {
    const line = columns.map(col => {
      let val = row[col.key];
      if (col.isBoolean) {
        val = val ? "TRUE" : "FALSE";
      }
      return `"${String(val || '').replace(/"/g, '""')}"`;
    }).join(",");
    csv += line + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Socio-O-Thon-GoogleSheet-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Password Modal Handling ──
function openPasswordModal() {
  document.getElementById("pwdModal").classList.remove("hidden");
  document.getElementById("sheetPwdInput").value = "";
  document.getElementById("pwdError").textContent = "";
  document.getElementById("sheetPwdInput").focus();
}

function closePasswordModal() {
  document.getElementById("pwdModal").classList.add("hidden");
}

function verifyPassword() {
  const entered = document.getElementById("sheetPwdInput").value.trim();
  if (entered === SHEET_ADMIN_PASSWORD) {
    localStorage.setItem(SHEET_AUTH_KEY, "true");
    closePasswordModal();
    updateLockUi();
    buildGrid();
  } else {
    document.getElementById("pwdError").textContent = "Incorrect committee password.";
  }
}

function updateLockUi() {
  const btn = document.getElementById("lockToggleBtn");
  if (isUnlocked()) {
    btn.textContent = "🔓 Sheet Unlocked (Click to Lock)";
    btn.style.background = "#2563eb";
    btn.style.borderColor = "#2563eb";
  } else {
    btn.textContent = "🔒 Unlock Sheet (Password: 5678)";
    btn.style.background = "#0f9d58";
    btn.style.borderColor = "#0f9d58";
  }
}

// ── Event Listeners ──
document.getElementById("addRowBtn").addEventListener("click", handleAddRow);
document.getElementById("addColBtn").addEventListener("click", handleAddColumn);
document.getElementById("deleteRowBtn").addEventListener("click", handleDeleteRow);
document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);

document.getElementById("searchBox").addEventListener("input", (e) => {
  buildGrid(e.target.value.trim());
});

document.getElementById("lockToggleBtn").addEventListener("click", () => {
  if (isUnlocked()) {
    localStorage.removeItem(SHEET_AUTH_KEY);
    updateLockUi();
    buildGrid();
  } else {
    openPasswordModal();
  }
});

document.getElementById("submitPwdBtn").addEventListener("click", verifyPassword);
document.getElementById("sheetPwdInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyPassword();
});
document.getElementById("cancelPwdBtn").addEventListener("click", closePasswordModal);

// Auto-refresh from QR scans every 10 seconds
setInterval(async () => {
  const cloudList = await fetchLiveCloudData();
  let updated = false;
  cloudList.forEach(p => {
    const existing = sheetRows.find(r => r.id === p.id);
    if (existing) {
      if (
        existing.kit !== (p.status && p.status.kit) ||
        existing.accommodation !== (p.status && p.status.accommodation) ||
        existing.food !== (p.status && p.status.food)
      ) {
        existing.kit = p.status && p.status.kit;
        existing.accommodation = p.status && p.status.accommodation;
        existing.food = p.status && p.status.food;
        updated = true;
      }
    }
  });
  if (updated) {
    const q = document.getElementById("searchBox").value.trim();
    buildGrid(q);
  }
}, 8000);

// Initialize
loadColumns();
updateLockUi();
loadFullSheetData();
