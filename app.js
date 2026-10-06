const STORAGE_KEY = "socioOthon_shared_participants";

const initialParticipants = [
  { id: "SOT001", name: "Participant 001", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT002", name: "Participant 002", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT003", name: "Participant 003", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT004", name: "Participant 004", status: { kit: false, accommodation: false, food: false } },
  { id: "SOT005", name: "Participant 005", status: { kit: false, accommodation: false, food: false } }
];

async function getParticipants() {
  // If running with local Node.js server
  try {
    const res = await fetch("./api/participants");
    if (res.ok) return await res.json();
  } catch (e) {}

  // Otherwise fallback to localStorage (for GitHub Pages static hosting)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialParticipants));
    return [...initialParticipants];
  }
  return JSON.parse(saved);
}

async function addParticipant(id, name) {
  try {
    const res = await fetch("./api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  // Fallback to localStorage
  const list = await getParticipants();
  if (!list.find(p => p.id === id)) {
    list.push({ id, name, status: { kit: false, accommodation: false, food: false } });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  return { ok: true };
}

function participantUrl(id) {
  // Generates permanent direct URL compatible with both local and GitHub Pages
  const base = window.location.href.split("?")[0].split("#")[0].replace(/\/(index\.html)?$/, "");
  return `${base}/participant.html?id=${encodeURIComponent(id)}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({
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

    const completed = [p.status.kit, p.status.accommodation, p.status.food].filter(Boolean).length;
    const statusClass = completed === 3 ? "complete" : "";
    const pUrl = participantUrl(p.id);

    const qrId = `qr-${p.id}`;
    card.innerHTML = `
      <div class="participant-meta">
        <span class="id-pill">${p.id}</span>
        <span class="badge small ${statusClass}">${completed}/3</span>
        <h3>${escapeHtml(p.name)}</h3>
      </div>
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

document.getElementById("addDemo").addEventListener("click", async () => {
  const nextNumber = allParticipants.length + 1;
  const id = `SOT${String(nextNumber).padStart(3, "0")}`;
  const name = `Participant ${String(nextNumber).padStart(3, "0")}`;
  await addParticipant(id, name);
  await init();
});
