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

const LOCAL_STORAGE_KEY = "socioOthon_participants_v5";
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
    modalPinError.textContent = "Too many attempts. Locked for " + remaining + "s.";
    return;
  }

  const entered = modalPinInput.value.trim();
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
      modalPinError.textContent = "5 incorrect attempts. Locked for 30s.";
    } else {
      modalPinError.textContent = "Incorrect PIN (" + (5 - partPinFailCount) + " attempts left).";
    }
    modalPinInput.value = "";
    modalPinInput.focus();
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
    
    const status = {
      kit: kitCol !== -1 ? isTruthy(r[kitCol]) : isTruthy(r[3]),
      accommodation: accCol !== -1 ? isTruthy(r[accCol]) : isTruthy(r[4]),
      food: foodCol !== -1 ? isTruthy(r[foodCol]) : isTruthy(r[5])
    };

    const fields = {};
    for (let c = 0; c < headers.length; c++) {
      if (c === idCol || c === nameCol || c === kitCol || c === accCol || c === foodCol) continue;
      const h = headers[c];
      if (!h || /last\s*updated/i.test(h) || /team/i.test(h)) continue;
      const val = r[c] ? r[c].trim() : "";
      if (val) {
        fields[h] = val;
      }
    }

    list.push({ id, name, status, fields });
  }
  return list;
}

async function fetchParticipants() {
  let baseList = [];

  // 1. Fetch base imported list from data/participants.json
  try {
    const res = await fetch("./data/participants.json?_t=" + Date.now());
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        baseList = json;
      }
    }
  } catch (e) {}

  // 2. Fetch live Google Sheet CSV to overlay real-time status updates (kit/accommodation/food)
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL + "&_t=" + Date.now());
    if (res.ok) {
      const csv = await res.text();
      const parsed = parseParticipantsFromCSV(csv);
      if (parsed && parsed.length > 0) {
        const sheetMap = new Map(parsed.map(p => [p.id.toUpperCase(), p]));
        baseList = baseList.map(p => {
          const fromSheet = sheetMap.get(p.id.toUpperCase());
          if (fromSheet) {
            return {
              ...p,
              status: fromSheet.status || p.status,
              fields: { ...fromSheet.fields, ...p.fields }
            };
          }
          return p;
        });

        // Add newly created participants found in Google Sheet
        parsed.forEach(sp => {
          const isDeleted = sp.name && (/deleted/i.test(sp.name) || /not\s*paid/i.test(sp.name));
          if (!isDeleted && !baseList.some(bp => bp.id.toUpperCase() === sp.id.toUpperCase())) {
            baseList.push(sp);
          }
        });
      }
    }
  } catch (err) {
    console.warn("Could not load from Google Sheet CSV, using local sources:", err);
  }

  // 3. Overlay any offline or local modifications / additions from localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const localList = JSON.parse(saved);
      if (Array.isArray(localList) && localList.length > 0) {
        const localMap = new Map(localList.map(p => [p.id.toUpperCase(), p]));
        baseList = baseList.map(p => {
          const fromLocal = localMap.get(p.id.toUpperCase());
          if (fromLocal) {
            return {
              ...p,
              ...fromLocal,
              status: fromLocal.status || p.status,
              fields: { ...p.fields, ...fromLocal.fields }
            };
          }
          return p;
        });

        // Crucial: Append any newly added participants stored in localStorage
        localList.forEach(lp => {
          if (!baseList.some(bp => bp.id.toUpperCase() === lp.id.toUpperCase())) {
            baseList.push(lp);
          }
        });
      }
    } catch (e) {}
  }

  if (baseList.length > 0) {
    baseList.sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseList));
    return baseList;
  }

  return [
  {
    "id": "SOT001",
    "name": "Purushottam sam sunder",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pss.purushottam@gmail.com",
      "Contact": "9344141746"
    }
  },
  {
    "id": "SOT002",
    "name": "Rahul Pradhan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ai114028@rgnau.ac.in",
      "Contact": "7008217572"
    }
  },
  {
    "id": "SOT003",
    "name": "NAGABATHULA SASIDHAR",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sasidharnagabathula@gmail.com",
      "Contact": "8790350954"
    }
  },
  {
    "id": "SOT004",
    "name": "Sourya Sritam Sarangi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sourya07sarangi@gmail.com",
      "Contact": "7894742252"
    }
  },
  {
    "id": "SOT005",
    "name": "Himanshu Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "himanshusinghgaur26@gmail.com",
      "Contact": "6388171218"
    }
  },
  {
    "id": "SOT006",
    "name": "Jahnavi Chaurasia",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "jahnavichaurasia67@gmail.com",
      "Contact": "9555531276"
    }
  },
  {
    "id": "SOT007",
    "name": "Umang Shankar Kishore",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ai114037@gmail.com",
      "Contact": "7903317467"
    }
  },
  {
    "id": "SOT008",
    "name": "Priyanshu Kumar Patel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "priyanshukumarpatel789@gmail.com",
      "Contact": "8969776557"
    }
  },
  {
    "id": "SOT009",
    "name": "Atharva Singh Baghel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "athnidhi1676@gmail.com",
      "Contact": "7974640071"
    }
  },
  {
    "id": "SOT010",
    "name": "Krishna Kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "krishna958192@gmail.com",
      "Contact": "8809896525"
    }
  },
  {
    "id": "SOT011",
    "name": "Bhanu Pratap Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "bhanu.singhcse24@smslucknow.ac.in",
      "Contact": "6207776437"
    }
  },
  {
    "id": "SOT012",
    "name": "Shankracharya Bharti",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "shankaracharyabharti40@gmail.com",
      "Contact": "8521566913"
    }
  },
  {
    "id": "SOT013",
    "name": "Saumya Sharma",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "saumya.skdian@gmail.com",
      "Contact": "6306391167"
    }
  },
  {
    "id": "SOT014",
    "name": "Sumit Kumar Patel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sumitkumarpatelcse25@smslucknow.ac.in",
      "Contact": "6201035429"
    }
  },
  {
    "id": "SOT015",
    "name": "Bathula Sanoj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26AE3005@rgipt.ac.in",
      "Contact": "7842961188"
    }
  },
  {
    "id": "SOT016",
    "name": "M. Gireesh Vema Rao",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ae3014@rgipt.ac.in",
      "Contact": "9515169896"
    }
  },
  {
    "id": "SOT017",
    "name": "Suryansh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "suryanshiot@gmail.com",
      "Contact": "6306784525"
    }
  },
  {
    "id": "SOT018",
    "name": "Utkarsh Kumar Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "utkarshphoenix67@gmail.com",
      "Contact": "9235087737"
    }
  },
  {
    "id": "SOT019",
    "name": "Tiwari Mayank",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mayank54xd@gmail.com",
      "Contact": "8856815411"
    }
  },
  {
    "id": "SOT020",
    "name": "Prativa Sahoo",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "prativasahoo2006@gmail.com",
      "Contact": "7978701860"
    }
  },
  {
    "id": "SOT021",
    "name": "Abhijeet Kumar Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "abhirajput1366@gmail.com",
      "Contact": "7783004239"
    }
  },
  {
    "id": "SOT022",
    "name": "ISHIKA SINGH",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ishayyylko@gmail.com",
      "Contact": "7897777641"
    }
  },
  {
    "id": "SOT023",
    "name": "Aditya Gupta",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "adityagupta80098@gmail.com",
      "Contact": "8127657475"
    }
  },
  {
    "id": "SOT024",
    "name": "Ayush Mishra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ayushmishra0205ix@gmail.com",
      "Contact": "9369035137"
    }
  },
  {
    "id": "SOT025",
    "name": "Alok Sahu",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "aloksahu95190@gmail.com",
      "Contact": "9519027901"
    }
  },
  {
    "id": "SOT026",
    "name": "Kajal Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kajalsingh829407@gmail.com",
      "Contact": "8294077701"
    }
  },
  {
    "id": "SOT027",
    "name": "Avika Chauhan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "s4916178@gmail.com",
      "Contact": "8318955925"
    }
  },
  {
    "id": "SOT028",
    "name": "Vaibhavi Shukla",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "vaibhavishukla45@gmail.com",
      "Contact": "7633912311"
    }
  },
  {
    "id": "SOT029",
    "name": "Kalash Mishra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kalashmishra2006@gmail.com",
      "Contact": "9415334228"
    }
  },
  {
    "id": "SOT030",
    "name": "Anirudh Mishra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mishrakumar1192005@gmail.com",
      "Contact": "8175961647"
    }
  },
  {
    "id": "SOT031",
    "name": "Aditya Dhanraj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dhanrajaditya262@gmail.com",
      "Contact": "7376548635"
    }
  },
  {
    "id": "SOT032",
    "name": "Priyanshi Maurya",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mauryapriyanshi2526@gmail.com",
      "Contact": "9569542060"
    }
  },
  {
    "id": "SOT033",
    "name": "Nainshi Yadav",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "nainshi30309@gmail.com",
      "Contact": "8853303228"
    }
  },
  {
    "id": "SOT034",
    "name": "Tushar Periwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "tusharperiwal95@gmail.com",
      "Contact": "9395839383"
    }
  },
  {
    "id": "SOT035",
    "name": "Dipesh Sikhwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "meb25047@tezu.ac.in",
      "Contact": "8617443361"
    }
  },
  {
    "id": "SOT036",
    "name": "ADITYA RAJ",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "araj71248@gmail.com",
      "Contact": "8617391523"
    }
  },
  {
    "id": "SOT037",
    "name": "KANISHK KRISHAN",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kanishk2772@gmail.com",
      "Contact": "7851954942"
    }
  },
  {
    "id": "SOT038",
    "name": "AYUSHMAAN KESARWANI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ayushmaankesarwani6@gmail.com",
      "Contact": "8958272744"
    }
  },
  {
    "id": "SOT039",
    "name": "SANDIHYA SATYA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sanidhyasatya9080@gmail.com",
      "Contact": "8434620922"
    }
  },
  {
    "id": "SOT040",
    "name": "ADITYA SHARMA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kanishk2772@gmail.com",
      "Contact": "8446937220"
    }
  },
  {
    "id": "SOT041",
    "name": "Vedika Bhatnagar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "vedikabhatnagar19@gmail.com",
      "Contact": "9335618757"
    }
  },
  {
    "id": "SOT042",
    "name": "Divya Shahi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "divya1shahi5@gmail.com",
      "Contact": "7898002168"
    }
  },
  {
    "id": "SOT043",
    "name": "Srishti Katiyar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25bb143035@rgnau.ac.in",
      "Contact": "8738928331"
    }
  },
  {
    "id": "SOT044",
    "name": "garima negi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25bb143013@rgnau.ac.in",
      "Contact": "9267923221"
    }
  },
  {
    "id": "SOT045",
    "name": "B.Nanda kishore",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3017@rgipt.ac.in",
      "Contact": "79891 79963"
    }
  },
  {
    "id": "SOT046",
    "name": "DOMMETI TEJA SRIVARDHAN",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3022@rgipt.ac.in",
      "Contact": "9666498388"
    }
  },
  {
    "id": "SOT047",
    "name": "YATHARTH SRIVASTAVA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cd3036@rgipt.ac.in",
      "Contact": "6393848378"
    }
  },
  {
    "id": "SOT048",
    "name": "Gitanjali",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cs3019@rgipt.ac.in",
      "Contact": "7897540955"
    }
  },
  {
    "id": "SOT049",
    "name": "Tiyasa Kundu",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25mc3064@rgipt.ac.in",
      "Contact": "9434060094"
    }
  },
  {
    "id": "SOT050",
    "name": "Soumya Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25it3055@rgipt.ac.in",
      "Contact": "7268909951"
    }
  },
  {
    "id": "SOT051",
    "name": "MADHURI KUMARI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cd3020@rgipt.ac.in",
      "Contact": "9296900602"
    }
  },
  {
    "id": "SOT052",
    "name": "Pranav Mahajan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3038@rgipt.ac.in",
      "Contact": "9389247074"
    }
  },
  {
    "id": "SOT053",
    "name": "Aryan Kushwaha",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3006@rgipt.ac.in",
      "Contact": "7081665856"
    }
  },
  {
    "id": "SOT054",
    "name": "P Darshit",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cd3023@rgipt.ac.in",
      "Contact": "9476109044"
    }
  },
  {
    "id": "SOT055",
    "name": "Krishna Agrawal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "agrk1603@gmail.com",
      "Contact": "9236428463"
    }
  },
  {
    "id": "SOT056",
    "name": "Nimish Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "nimish120838@gmail.com",
      "Contact": "9076721337"
    }
  },
  {
    "id": "SOT057",
    "name": "Devesh Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "deveshsingh2424@gmail.com",
      "Contact": "8604283039"
    }
  },
  {
    "id": "SOT058",
    "name": "SANKALP",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "singhsankalp678@gmail.com",
      "Contact": "7054490586"
    }
  },
  {
    "id": "SOT059",
    "name": "Divyansh Ojha",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3023@rgipt.ac.in",
      "Contact": "9336385828"
    }
  },
  {
    "id": "SOT060",
    "name": "Amber Pal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25re3004@rgipt.ac.in",
      "Contact": "7307264829"
    }
  },
  {
    "id": "SOT061",
    "name": "Nilim Choudhury",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25pp3013@rgipt.ac.in",
      "Contact": "8761011885"
    }
  },
  {
    "id": "SOT062",
    "name": "Disha Agarwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3022@rgipt.ac.in",
      "Contact": "7500023600"
    }
  },
  {
    "id": "SOT063",
    "name": "Aman Raj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3008@rgipt.ac.in",
      "Contact": "7257886304"
    }
  },
  {
    "id": "SOT064",
    "name": "Dhruv Vinod Vishwakarma",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26pe3007@rgipt.ac.in",
      "Contact": "8828036271"
    }
  },
  {
    "id": "SOT065",
    "name": "Arshiya",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "Arshiya130809@gmail.com",
      "Contact": "8828036271"
    }
  },
  {
    "id": "SOT066",
    "name": "Toyshi Choudhary",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "toyshi01k@gmail.com",
      "Contact": "6378787309"
    }
  },
  {
    "id": "SOT067",
    "name": "Om sahu",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3034@rgipt.ac.in",
      "Contact": "9201883639"
    }
  },
  {
    "id": "SOT068",
    "name": "Nelaballi Dheeraj Samuel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3032@rgipt.ac.in",
      "Contact": "7569811612"
    }
  },
  {
    "id": "SOT069",
    "name": "Mahi Kumari",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mahisahani99@gmail.com",
      "Contact": "09569893990"
    }
  },
  {
    "id": "SOT070",
    "name": "Rishika Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "darcy2706already@gmail.com",
      "Contact": "8318284773"
    }
  },
  {
    "id": "SOT071",
    "name": "Yash Jaiswal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cd3035@rgipt.ac.in",
      "Contact": "8840018140"
    }
  },
  {
    "id": "SOT072",
    "name": "Tarun Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26mc3066@rgipt.ac.in",
      "Contact": "8894486898"
    }
  },
  {
    "id": "SOT073",
    "name": "Palak P",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25re3016@rgipt.ac.in",
      "Contact": "6204883242"
    }
  },
  {
    "id": "SOT074",
    "name": "Kriti Kumari Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3030@rgipt.ac.in",
      "Contact": "7439501227"
    }
  },
  {
    "id": "SOT075",
    "name": "Sreeraj Basak",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3053@rgipt.ac.in",
      "Contact": "8276079672"
    }
  },
  {
    "id": "SOT076",
    "name": "Kalavala Maneesh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3028@rgipt.ac.in",
      "Contact": "7569734770"
    }
  },
  {
    "id": "SOT077",
    "name": "PUNEETH PUDI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25pe3044@rgipt.ac.in",
      "Contact": "7382175526"
    }
  },
  {
    "id": "SOT078",
    "name": "Shreyansh Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26it3036@rgipt.ac.in",
      "Contact": "9006846272"
    }
  },
  {
    "id": "SOT079",
    "name": "Abhishek Ekka",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3002@rgipt.ac.in",
      "Contact": "9348638467"
    }
  },
  {
    "id": "SOT080",
    "name": "On-Spot Participant 01",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT081",
    "name": "On-Spot Participant 02",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT082",
    "name": "On-Spot Participant 03",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT083",
    "name": "On-Spot Participant 04",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT084",
    "name": "On-Spot Participant 05",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT085",
    "name": "On-Spot Participant 06",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT086",
    "name": "On-Spot Participant 07",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT087",
    "name": "On-Spot Participant 08",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT088",
    "name": "On-Spot Participant 09",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT089",
    "name": "On-Spot Participant 10",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT090",
    "name": "On-Spot Participant 11",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT091",
    "name": "On-Spot Participant 12",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT092",
    "name": "On-Spot Participant 13",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT093",
    "name": "On-Spot Participant 14",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT094",
    "name": "On-Spot Participant 15",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT095",
    "name": "On-Spot Participant 16",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT096",
    "name": "On-Spot Participant 17",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT097",
    "name": "On-Spot Participant 18",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT098",
    "name": "On-Spot Participant 19",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT099",
    "name": "On-Spot Participant 20",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  }
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
      if (confirm("Remove checklist item \"" + k + "\"?")) {
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
  badge.textContent = `${completed} / ${total} completed`;
  badge.classList.toggle("complete", completed === total && total > 0);
}

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
        if (confirm("Delete information field \"" + k + "\"?")) {
          delete currentParticipant.fields[k];
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

  const initialVal = prompt("Enter " + key + " for " + currentParticipant.name + ":", "");
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

  const cleanQueryId = participantId.trim().toUpperCase();
  const list = await fetchParticipants();
  currentParticipant = list.find(p => {
    if (p.id.toUpperCase() === cleanQueryId) return true;
    const numP = parseInt(String(p.id).replace(/\D/g, ""), 10);
    const numQ = parseInt(String(cleanQueryId).replace(/\D/g, ""), 10);
    return numP && numQ && numP === numQ;
  });

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
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

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
  await syncToGoogleSheet(currentParticipant, currentParticipant.status, currentParticipant.fields);

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
