const fs = require('fs');
const path = require('path');

const SHEET_ID = '1_zD_fr01PiAwEJlb-LOxJh25_og5GP2kvzUdLJWicNM';
const GID = '965136516';
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec';

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

async function loadCSVText() {
  const possibleLocalFiles = [
    path.join('C:', 'Users', 'OMEN', 'Downloads', 'participants.csv'),
    path.join(__dirname, 'participants.csv'),
    path.join(__dirname, 'sheet.csv'),
    path.join('C:', 'Users', 'OMEN', 'Downloads', 'sheet.csv'),
    path.join('C:', 'Users', 'OMEN', 'Downloads', 'Socio-O-Thon.csv')
  ];

  for (const f of possibleLocalFiles) {
    if (fs.existsSync(f)) {
      console.log(`Loading from local file: ${f}`);
      return fs.readFileSync(f, 'utf8');
    }
  }

  console.log(`Attempting to fetch from Google Sheet: ${GOOGLE_SHEET_CSV_URL}`);
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (res.status === 401 || res.status === 302) {
    throw new Error('AUTH_REQUIRED: Sheet permission is currently Restricted. Please set "Anyone with the link can view".');
  }
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
  }
  return await res.text();
}

async function run() {
  try {
    const csvText = await loadCSVText();
    const rows = parseCSV(csvText);
    if (!rows || rows.length < 2) {
      console.error('Error: Sheet contains no data rows.');
      return;
    }

    const headers = rows[0].map(h => h.trim());
    console.log('Headers found:', headers);

    const nameCol = headers.findIndex(h => /^(participant\s*name|student\s*name|full\s*name|name)$/i.test(h)) !== -1
      ? headers.findIndex(h => /^(participant\s*name|student\s*name|full\s*name|name)$/i.test(h))
      : headers.findIndex(h => /name/i.test(h));

    const emailCol = headers.findIndex(h => /email|mail|e-mail/i.test(h));
    const contactCol = headers.findIndex(h => /contact|phone|mobile|whatsapp|number/i.test(h));
    const paidCol = headers.findIndex(h => /^paid$/i.test(h));

    console.log(`Detected columns -> Name: [Col ${nameCol}], Email: [Col ${emailCol}], Contact: [Col ${contactCol}], Paid: [Col ${paidCol}]`);

    const participants = [];
    let counter = 1;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const rawName = nameCol !== -1 && row[nameCol] ? row[nameCol].trim() : '';
      const rawEmail = emailCol !== -1 && row[emailCol] ? row[emailCol].trim() : '';
      const rawContact = contactCol !== -1 && row[contactCol] ? row[contactCol].trim() : '';
      const rawPaid = paidCol !== -1 && row[paidCol] ? row[paidCol].trim() : '';

      if (!rawName || rawName.toLowerCase() === 'participant name') continue;

      // Filter out not paid and blank! Only include Paid
      if (!/^paid$/i.test(rawPaid)) continue;

      const pid = `SOT${String(counter).padStart(3, '0')}`;

      // Only Email, Contact No., and Name as explicitly requested
      const fields = {};
      if (rawEmail) fields['Email'] = rawEmail;
      if (rawContact) fields['Contact'] = rawContact;

      participants.push({
        id: pid,
        name: rawName || `Participant ${pid}`,
        status: {
          kit: false,
          accommodation: false,
          food: false
        },
        fields: fields
      });
      counter++;
    }

    // Add 20 extras for on-spot registration
    for (let s = 1; s <= 20; s++) {
      const pid = `SOT${String(counter).padStart(3, '0')}`;
      participants.push({
        id: pid,
        name: `On-Spot Participant ${String(s).padStart(2, '0')}`,
        status: {
          kit: false,
          accommodation: false,
          food: false
        },
        fields: {}
      });
      counter++;
    }

    console.log(`\nSuccessfully imported ${participants.length} participants (including 20 on-spot extras)!`);

    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // Write to data/participants.json
    fs.writeFileSync(path.join(dataDir, 'participants.json'), JSON.stringify(participants, null, 2));
    console.log('Saved to data/participants.json');

    return participants;
  } catch (err) {
    console.error('\n' + err.message);
    process.exit(1);
  }
}

run();
