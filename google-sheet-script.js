// Google Apps Script (Paste this in Extensions > Apps Script of your Google Sheet)
// Sheet URL: https://docs.google.com/spreadsheets/d/1_zD_fr01PiAwEJlb-LOxJh25_og5GP2kvzUdLJWicNM/edit

const SHEET_ADMIN_PASSWORD = "5678"; // Separate password for committee members to edit the sheet

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const rows = [];
  
  // Headers are in row 0
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    rows.push({
      id: String(data[i][0]),
      name: String(data[i][1] || ""),
      team: String(data[i][2] || ""),
      kit: String(data[i][3]).toUpperCase() === "TRUE" || String(data[i][3]).toLowerCase() === "yes",
      accommodation: String(data[i][4]).toUpperCase() === "TRUE" || String(data[i][4]).toLowerCase() === "yes",
      food: String(data[i][5]).toUpperCase() === "TRUE" || String(data[i][5]).toLowerCase() === "yes",
      lastUpdated: String(data[i][6] || "")
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action; // 'sync_status' (from QR scan) or 'edit_sheet' (manual sheet edit with password)
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // ACTION 1: Status updated via QR scan (changes live in sheet automatically, NO reflection back to cloud)
    if (action === "sync_status") {
      const targetId = String(body.id).trim().toUpperCase();
      let found = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === targetId) {
          if (body.name) sheet.getRange(i + 1, 2).setValue(body.name);
          if (body.team) sheet.getRange(i + 1, 3).setValue(body.team);
          if (body.status) {
            sheet.getRange(i + 1, 4).setValue(body.status.kit ? "TRUE" : "FALSE");
            sheet.getRange(i + 1, 5).setValue(body.status.accommodation ? "TRUE" : "FALSE");
            sheet.getRange(i + 1, 6).setValue(body.status.food ? "TRUE" : "FALSE");
          }
          sheet.getRange(i + 1, 7).setValue(new Date().toLocaleString());
          found = true;
          break;
        }
      }

      // If not present in sheet, append row automatically
      if (!found && targetId) {
        sheet.appendRow([
          targetId,
          body.name || ("Participant " + targetId),
          body.team || "",
          body.status && body.status.kit ? "TRUE" : "FALSE",
          body.status && body.status.accommodation ? "TRUE" : "FALSE",
          body.status && body.status.food ? "TRUE" : "FALSE",
          new Date().toLocaleString()
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Sheet updated in real time" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ACTION 2: Manual Sheet Row Edit (Protected with Password)
    if (action === "edit_sheet") {
      if (body.password !== SHEET_ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unauthorized: Invalid password" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const targetId = String(body.id).trim().toUpperCase();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === targetId) {
          if (body.newName) sheet.getRange(i + 1, 2).setValue(body.newName);
          if (body.newTeam) sheet.getRange(i + 1, 3).setValue(body.newTeam);
          if (body.newStatus) {
            sheet.getRange(i + 1, 4).setValue(body.newStatus.kit ? "TRUE" : "FALSE");
            sheet.getRange(i + 1, 5).setValue(body.newStatus.accommodation ? "TRUE" : "FALSE");
            sheet.getRange(i + 1, 6).setValue(body.newStatus.food ? "TRUE" : "FALSE");
          }
          sheet.getRange(i + 1, 7).setValue(new Date().toLocaleString());
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Sheet row edited with password" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
