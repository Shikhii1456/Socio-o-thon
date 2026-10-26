// ==========================================
// CONFIGURATION: Admin PIN & Endpoints
// ==========================================
const ADMIN_PIN = "1234";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/export?format=csv";
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec";

const LOCAL_STORAGE_KEY = "socioOthon_participants_v3";
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
        if (baseList.length === 0) {
          baseList = parsed;
        } else {
          const sheetMap = new Map(parsed.map(p => [p.id.toUpperCase(), p]));
          baseList = baseList.map(p => {
            const fromSheet = sheetMap.get(p.id.toUpperCase());
            if (fromSheet) {
              return {
                ...p,
                status: fromSheet.status || p.status,
                fields: { ...p.fields, ...fromSheet.fields }
              };
            }
            return p;
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not load from Google Sheet CSV, using local sources:", err);
  }

  // 3. Overlay any offline or local modifications from localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const localList = JSON.parse(saved);
      if (Array.isArray(localList) && localList.length > 0) {
        if (baseList.length === 0) {
          baseList = localList;
        } else {
          const localMap = new Map(localList.map(p => [p.id.toUpperCase(), p]));
          baseList = baseList.map(p => {
            const fromLocal = localMap.get(p.id.toUpperCase());
            if (fromLocal && fromLocal.status) {
              return { ...p, ...fromLocal };
            }
            return p;
          });
        }
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "team": "",
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
    "name": "HIMANSHU PANDEY",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "240694@kit.ac.in",
      "Contact": "9198003605"
    }
  },
  {
    "id": "SOT019",
    "name": "ANUSTHA SHARMA",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "240466@kit.ac.in",
      "Contact": "7905776123"
    }
  },
  {
    "id": "SOT020",
    "name": "AKASH JOSHI",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "developer.akashjoshi@gmail.com",
      "Contact": "9125847406"
    }
  },
  {
    "id": "SOT021",
    "name": "Kashvee Mehta",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dev.kashvee@gmail.com",
      "Contact": "8887539149"
    }
  },
  {
    "id": "SOT022",
    "name": "Utkarsh Kumar Singh",
    "team": "",
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
    "id": "SOT023",
    "name": "Tiwari Mayank",
    "team": "",
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
    "id": "SOT024",
    "name": "Prativa Sahoo",
    "team": "",
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
    "id": "SOT025",
    "name": "Abhijeet Kumar Singh",
    "team": "",
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
    "id": "SOT026",
    "name": "ISHIKA SINGH",
    "team": "",
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
    "id": "SOT027",
    "name": "Aditya Gupta",
    "team": "",
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
    "id": "SOT028",
    "name": "Ayush Mishra",
    "team": "",
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
    "id": "SOT029",
    "name": "Alok Sahu",
    "team": "",
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
    "id": "SOT030",
    "name": "SARTHAK AGRAWAL",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sarthakag24@iitk.ac.in",
      "Contact": "9696625701"
    }
  },
  {
    "id": "SOT031",
    "name": "rudresh kumar",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rudreshthakur80@gmail.com",
      "Contact": "9369699470"
    }
  },
  {
    "id": "SOT032",
    "name": "Pratik Kumar Yadav",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pratiky24@iitk.ac.in",
      "Contact": "8253084953"
    }
  },
  {
    "id": "SOT033",
    "name": "pranjal gautam",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pranjalg24@iitk.ac.in",
      "Contact": "7454040860"
    }
  },
  {
    "id": "SOT034",
    "name": "Kartikey Agnihotri",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kartikeyofficial12@gmail.com",
      "Contact": "8081260329"
    }
  },
  {
    "id": "SOT035",
    "name": "Kajal Singh",
    "team": "",
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
    "id": "SOT036",
    "name": "Avika Chauhan",
    "team": "",
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
    "id": "SOT037",
    "name": "Vaibhavi Shukla",
    "team": "",
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
    "id": "SOT038",
    "name": "Kalash Mishra",
    "team": "",
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
    "id": "SOT039",
    "name": "Anirudh Mishra",
    "team": "",
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
    "id": "SOT040",
    "name": "Aditya Dhanraj",
    "team": "",
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
    "id": "SOT041",
    "name": "Priyanshi Maurya",
    "team": "",
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
    "id": "SOT042",
    "name": "Nainshi Yadav",
    "team": "",
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
    "id": "SOT043",
    "name": "Tushar Periwal",
    "team": "",
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
    "id": "SOT044",
    "name": "Dipesh Sikhwal",
    "team": "",
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
    "id": "SOT045",
    "name": "ADITYA RAJ",
    "team": "",
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
    "id": "SOT046",
    "name": "KANISHK KRISHAN",
    "team": "",
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
    "id": "SOT047",
    "name": "AYUSHMAAN KESARWANI",
    "team": "",
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
    "id": "SOT048",
    "name": "SANDIHYA SATYA",
    "team": "",
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
    "id": "SOT049",
    "name": "ADITYA SHARMA",
    "team": "",
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
    "id": "SOT050",
    "name": "Vedika Bhatnagar",
    "team": "",
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
    "id": "SOT051",
    "name": "Divya Shahi",
    "team": "",
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
    "id": "SOT052",
    "name": "Srishti Katiyar",
    "team": "",
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
    "id": "SOT053",
    "name": "garima negi",
    "team": "",
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
    "id": "SOT054",
    "name": "B.Nanda kishore",
    "team": "",
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
    "id": "SOT055",
    "name": "DOMMETI TEJA SRIVARDHAN",
    "team": "",
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
    "id": "SOT056",
    "name": "YATHARTH SRIVASTAVA",
    "team": "",
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
    "id": "SOT057",
    "name": "Gitanjali",
    "team": "",
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
    "id": "SOT058",
    "name": "Tiyasa Kundu",
    "team": "",
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
    "id": "SOT059",
    "name": "Soumya Singh",
    "team": "",
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
    "id": "SOT060",
    "name": "MADHURI KUMARI",
    "team": "",
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
    "id": "SOT061",
    "name": "Pranav Mahajan",
    "team": "",
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
    "id": "SOT062",
    "name": "Aryan Kushwaha",
    "team": "",
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
    "id": "SOT063",
    "name": "Devansh",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3020@rgipt.ac.in",
      "Contact": "7417031824"
    }
  },
  {
    "id": "SOT064",
    "name": "Kalavala Maneesh",
    "team": "",
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
    "id": "SOT065",
    "name": "Prince Prajapati",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cd3029@rgipt.ac.in",
      "Contact": "8756224155"
    }
  },
  {
    "id": "SOT066",
    "name": "Deepak Kumar",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25pp3006@rgipt.ac.in",
      "Contact": "7073389905"
    }
  },
  {
    "id": "SOT067",
    "name": "P Darshit",
    "team": "",
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
    "id": "SOT068",
    "name": "Jaiditya Sinha",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "jaidityasinha200@gmail.com",
      "Contact": "9308250700"
    }
  },
  {
    "id": "SOT069",
    "name": "Sriwanth Reddy",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sriwanthalla@gmail.com",
      "Contact": "9515331577"
    }
  },
  {
    "id": "SOT070",
    "name": "Aditya Deshmukh",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "adityadeshmukh5115@gmail.com",
      "Contact": "8830981635"
    }
  },
  {
    "id": "SOT071",
    "name": "Krishna Agrawal",
    "team": "",
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
    "id": "SOT072",
    "name": "Nimish Singh",
    "team": "",
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
    "id": "SOT073",
    "name": "Devesh Singh",
    "team": "",
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
    "id": "SOT074",
    "name": "SANKALP",
    "team": "",
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
    "id": "SOT075",
    "name": "Vaibhav Nehra",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "vaibhavxnehrax@gmail.com",
      "Contact": "8814092519"
    }
  },
  {
    "id": "SOT076",
    "name": "Maittri Tripathi",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24mc3027@rgipt.ac.in",
      "Contact": "7976034702"
    }
  },
  {
    "id": "SOT077",
    "name": "Ayush Kumar Srivastava",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ayushkrsrivastava2005@gmail.com",
      "Contact": "9555532680"
    }
  },
  {
    "id": "SOT078",
    "name": "Divyansh Ojha",
    "team": "",
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
    "id": "SOT079",
    "name": "Amber Pal",
    "team": "",
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
    "id": "SOT080",
    "name": "Nilim Choudhury",
    "team": "",
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
    "id": "SOT081",
    "name": "Disha Agarwal",
    "team": "",
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
    "id": "SOT082",
    "name": "Aman Raj",
    "team": "",
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
    "id": "SOT083",
    "name": "Monali Tiwari",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "monalitiwari.in@gmail.com",
      "Contact": "9831105712"
    }
  },
  {
    "id": "SOT084",
    "name": "Prajukta Jana",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "prajuktaj@gmail.com"
    }
  },
  {
    "id": "SOT085",
    "name": "Dipti Kumari",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "diptikumari2306@gmail.com"
    }
  },
  {
    "id": "SOT086",
    "name": "Dimpy Bhattacharjee",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dimpybhattacharjee213@gmail.com"
    }
  },
  {
    "id": "SOT087",
    "name": "Shikhar Gupta",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3051@rgipt.ac.in",
      "Contact": "7000435256"
    }
  },
  {
    "id": "SOT088",
    "name": "Dev Jangid",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3022@rgipt.ac.in"
    }
  },
  {
    "id": "SOT089",
    "name": "Chirantan Toley",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3020@rgipt.ac.in"
    }
  },
  {
    "id": "SOT090",
    "name": "Gourav Yadav",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3026@rgipt.ac.in"
    }
  },
  {
    "id": "SOT091",
    "name": "VISHWA P",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "babyvishwa2008@gmail.com",
      "Contact": "8838396227"
    }
  },
  {
    "id": "SOT092",
    "name": "SHAMYUKTHA S",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "shamyukthas08@gmail.com",
      "Contact": "8825434574"
    }
  },
  {
    "id": "SOT093",
    "name": "NIRANJAN A M",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "amniranjan007@gmail.com",
      "Contact": "9442798088"
    }
  },
  {
    "id": "SOT094",
    "name": "SUHASHINI V A",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "suhashinivadivel2006@gmail.com",
      "Contact": "8428881222"
    }
  },
  {
    "id": "SOT095",
    "name": "Raghubir Rai",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3064@rgipt.ac.in",
      "Contact": "8957276668"
    }
  },
  {
    "id": "SOT096",
    "name": "Ayush Kumar",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cs3007@rgipt.ac.in"
    }
  },
  {
    "id": "SOT097",
    "name": "Anil Suthar N",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25me3003@rgipt.ac.in"
    }
  },
  {
    "id": "SOT098",
    "name": "Abhinav Jaiswal",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25re3002@rgipt.ac.in"
    }
  },
  {
    "id": "SOT099",
    "name": "SIDDHARTH SINGH",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "240378@kit.ac.in",
      "Contact": "8303558840"
    }
  },
  {
    "id": "SOT100",
    "name": "Kratika Gupta",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "gkratika202@gmail.com",
      "Contact": "9235352300"
    }
  },
  {
    "id": "SOT101",
    "name": "Swati Yadav",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "swatiydv.2805@gmail.com",
      "Contact": "8173939363"
    }
  },
  {
    "id": "SOT102",
    "name": "Rachit Aggarwal",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3054@rgipt.ac.in",
      "Contact": "9528904043"
    }
  },
  {
    "id": "SOT103",
    "name": "HITEN Bansal",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3027@rgipt.ac.in",
      "Contact": "7056390801"
    }
  },
  {
    "id": "SOT104",
    "name": "Aditya Pratap Singh",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3005@rgipt.ac.in",
      "Contact": "9451773050"
    }
  },
  {
    "id": "SOT105",
    "name": "Aditya Awasthi",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3004@rgipt.ac.in",
      "Contact": "8962603638"
    }
  },
  {
    "id": "SOT106",
    "name": "Prashant Lavania",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "prashantlavania9@gmail.com",
      "Contact": "9220369216"
    }
  },
  {
    "id": "SOT107",
    "name": "Dipak Kumar",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dipakbhagat934@gmail.com",
      "Contact": "9341196921"
    }
  },
  {
    "id": "SOT108",
    "name": "Sourya Sarangi",
    "team": "",
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
    "id": "SOT109",
    "name": "Rahul Pradhan",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rgnppr93@gmail.com",
      "Contact": "7008271572"
    }
  },
  {
    "id": "SOT110",
    "name": "DIVYANSHU Raj Raj",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rdivyanshu752@gmail.com",
      "Contact": "8877103516"
    }
  },
  {
    "id": "SOT111",
    "name": "Harshit Anand",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "harshitanand469@gmail.com",
      "Contact": "8789277595"
    }
  },
  {
    "id": "SOT112",
    "name": "Sana Arora",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "arorasana81@gmail.com",
      "Contact": "8700035292"
    }
  },
  {
    "id": "SOT113",
    "name": "NIKHIL KUMAR GAUTAM",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "nikhil73809@gmail.com",
      "Contact": "7380970355"
    }
  },
  {
    "id": "SOT114",
    "name": "OMJEE OJHA",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ojhaaemail@gmail.com",
      "Contact": "8051420231"
    }
  },
  {
    "id": "SOT115",
    "name": "DIPAK OJHA",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ojha09293@gmail.com",
      "Contact": "6299024068"
    }
  },
  {
    "id": "SOT116",
    "name": "ANANYA PANDEY",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pandeyananya848@gmail.com",
      "Contact": "6391039210"
    }
  },
  {
    "id": "SOT117",
    "name": "RUDRANSH MISHRA",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rudranshvns2006@gmail.com",
      "Contact": "6307606696"
    }
  },
  {
    "id": "SOT118",
    "name": "Saumya Ganeshe",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24cs3048@rgipt.ac.in",
      "Contact": "7802020161"
    }
  },
  {
    "id": "SOT119",
    "name": "Riya Chaudhary",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "241027@kit.ac.in",
      "Contact": "9653040087"
    }
  },
  {
    "id": "SOT120",
    "name": "ABHISHEK kumar kumar",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "abhinav87976@gmail.com",
      "Contact": "9631372631"
    }
  },
  {
    "id": "SOT121",
    "name": "Narendra Girjaram Bambarde",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "bambardenarendra5@gmail.com",
      "Contact": "9403858554"
    }
  },
  {
    "id": "SOT122",
    "name": "SREEHARINARAYANAN v s",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sreeharinarayanan_b261276ec@nitc.ac.in",
      "Contact": "7063905161"
    }
  },
  {
    "id": "SOT123",
    "name": "Priyal Shende",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mbatm25033@iimsirmaur.ac.in",
      "Contact": "8805651859"
    }
  },
  {
    "id": "SOT124",
    "name": "Karan Gupta",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "karan.guptaaids24@smslucknow.ac.in",
      "Contact": "7376748506"
    }
  },
  {
    "id": "SOT125",
    "name": "Akanksha Yadav",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3004@rgipt.ac.in",
      "Contact": "8858477375"
    }
  },
  {
    "id": "SOT126",
    "name": "Himmat Singh",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26it3017@rgipt.ac.in",
      "Contact": "8306881391"
    }
  },
  {
    "id": "SOT127",
    "name": "NILOY SAMADDER",
    "team": "",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26mc3046@rgipt.ac.in",
      "Contact": "6291587997"
    }
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
