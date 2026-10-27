// Google Apps Script Web App for Socio-O-Thon
// Handles check-in syncing, dynamic columns, Team ID, Theme, AB2, and sorting

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    var headers = values[0];
    var result = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var rowObj = {};
      for (var c = 0; c < headers.length; c++) {
        var h = String(headers[c] || "").trim();
        if (h) rowObj[h] = row[c];
      }
      result.push(rowObj);
    }
    var callback = e && e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "sync_status").trim().toLowerCase();

    // ── 1. ACTION: DELETE PARTICIPANT ──
    if (action === "delete_participant" || action === "delete") {
      var targetId = String(data.id || "").trim().toUpperCase();
      if (!targetId) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing ID" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var values = sheet.getDataRange().getValues();
      var deleted = false;
      for (var r = values.length - 1; r >= 1; r--) {
        if (String(values[r][0]).trim().toUpperCase() === targetId) {
          sheet.deleteRow(r + 1);
          deleted = true;
        }
      }
      sortSheetInOrder(sheet);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", deleted: deleted }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 2. ACTION: PURGE DELETED ROWS & SORT ──
    if (action === "clean_and_sort" || action === "sort") {
      var values = sheet.getDataRange().getValues();
      for (var r = values.length - 1; r >= 1; r--) {
        var idVal = String(values[r][0]).trim().toUpperCase();
        var nameVal = String(values[r][2] || values[r][1] || "").trim();
        if (/deleted/i.test(nameVal) || /not\s*paid/i.test(nameVal) || idVal === "TEST_NON_EXISTENT") {
          sheet.deleteRow(r + 1);
        }
      }
      sortSheetInOrder(sheet);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Cleaned and sorted sheet!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── ENSURE TEAM ID COLUMN IS INSERTED BEFORE NAME ──
    ensureColumnLayout(sheet);

    var values = sheet.getDataRange().getValues();
    var headers = values[0] || [];

    // Helper: Find or dynamically create column by header name
    function getColumnIndex(headerName) {
      for (var c = 0; c < headers.length; c++) {
        if (String(headers[c]).trim().toLowerCase() === headerName.trim().toLowerCase()) {
          return c + 1; // 1-indexed for getRange
        }
      }
      var newColIdx = headers.length + 1;
      sheet.getRange(1, newColIdx).setValue(headerName);
      headers.push(headerName);
      return newColIdx;
    }

    function getTeamIdColumn() {
      for (var c = 0; c < headers.length; c++) {
        var h = String(headers[c]).trim().toLowerCase();
        if (h === "socio team id" || h === "team id") {
          return c + 1;
        }
      }
      return getColumnIndex("Socio Team ID");
    }

    var idCol = getColumnIndex("Participant ID");
    var teamIdCol = getTeamIdColumn();
    var nameCol = getColumnIndex("Name");
    var kitCol = getColumnIndex("Kit Received");
    var accCol = getColumnIndex("Accommodation");
    var foodCol = getColumnIndex("Food Received");
    var updatedCol = getColumnIndex("Last Updated");

    // ── 3. ACTION: BATCH SYNC ──
    if (action === "batch_sync" && Array.isArray(data.participants)) {
      var count = 0;
      data.participants.forEach(function(p) {
        syncSingleParticipant(sheet, p, getColumnIndex, idCol, teamIdCol, nameCol, kitCol, accCol, foodCol, updatedCol);
        count++;
      });
      sortSheetInOrder(sheet);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", updatedCount: count }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 4. ACTION: SYNC / ADD / UPDATE SINGLE PARTICIPANT ──
    var targetId = String(data.id || "").trim().toUpperCase();
    if (!targetId) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing participant ID" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    syncSingleParticipant(sheet, data, getColumnIndex, idCol, teamIdCol, nameCol, kitCol, accCol, foodCol, updatedCol);
    sortSheetInOrder(sheet);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: targetId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Helper: Ensure column layout puts "Team ID" right before "Name"
function ensureColumnLayout(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return;
  var headers = values[0];

  var teamIdIdx = -1;
  var nameIdx = -1;

  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim().toLowerCase();
    if (h === "socio team id" || h === "team id") teamIdIdx = i;
    if (h === "name") nameIdx = i;
  }

  // If Socio Team ID does not exist, insert it before Name
  if (teamIdIdx === -1) {
    if (nameIdx !== -1) {
      sheet.insertColumnBefore(nameIdx + 1);
      sheet.getRange(1, nameIdx + 1).setValue("Socio Team ID");
    } else {
      sheet.insertColumnBefore(2);
      sheet.getRange(1, 2).setValue("Socio Team ID");
    }
  } else if (nameIdx !== -1 && teamIdIdx > nameIdx) {
    // If Socio Team ID is after Name, we move the Socio Team ID column before Name
    sheet.moveColumns(sheet.getRange(1, teamIdIdx + 1, sheet.getLastRow(), 1), nameIdx + 1);
  }
}

// Helper: Sync one participant's row
function syncSingleParticipant(sheet, data, getColumnIndex, idCol, teamIdCol, nameCol, kitCol, accCol, foodCol, updatedCol) {
  var targetId = String(data.id || "").trim().toUpperCase();
  if (!targetId) return;

  var values = sheet.getDataRange().getValues();
  var targetRow = -1;
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol - 1]).trim().toUpperCase() === targetId) {
      targetRow = r + 1;
      break;
    }
  }

  if (targetRow === -1) {
    targetRow = sheet.getLastRow() + 1;
    sheet.getRange(targetRow, idCol).setValue(targetId);
  }

  // Update Socio Team ID
  var teamVal = data.teamId !== undefined ? data.teamId : (data.fields && (data.fields["Socio Team ID"] || data.fields["Team ID"]));
  if (teamVal !== undefined) {
    sheet.getRange(targetRow, teamIdCol).setValue(teamVal || "");
  }

  // Update Name
  if (data.name !== undefined) {
    sheet.getRange(targetRow, nameCol).setValue(data.name);
  }

  // Update Attendance Checkboxes
  if (data.status) {
    if (data.status.kit !== undefined) sheet.getRange(targetRow, kitCol).setValue(data.status.kit ? "YES" : "NO");
    if (data.status.accommodation !== undefined) sheet.getRange(targetRow, accCol).setValue(data.status.accommodation ? "YES" : "NO");
    if (data.status.food !== undefined) sheet.getRange(targetRow, foodCol).setValue(data.status.food ? "YES" : "NO");

    for (var checkKey in data.status) {
      if (checkKey !== "kit" && checkKey !== "accommodation" && checkKey !== "food") {
        var colIdx = getColumnIndex(checkKey);
        sheet.getRange(targetRow, colIdx).setValue(data.status[checkKey] ? "YES" : "NO");
      }
    }
  }

  // Update Custom Info Fields (Theme, AB2, Email, Contact, etc.)
  if (data.fields && typeof data.fields === "object") {
    for (var fieldKey in data.fields) {
      if (fieldKey.toLowerCase() === "team id" || fieldKey.toLowerCase() === "socio team id") continue; // Already updated above
      var colIdx = getColumnIndex(fieldKey);
      var fVal = data.fields[fieldKey];
      sheet.getRange(targetRow, colIdx).setValue(fVal !== undefined && fVal !== null ? fVal : "");
    }
  }

  // Update Last Updated timestamp
  if (updatedCol) {
    sheet.getRange(targetRow, updatedCol).setValue(new Date().toLocaleString());
  }
}

// Helper: Perfectly sort all participant rows numerically (SOT001, SOT002, SOT003...)
function sortSheetInOrder(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 2) return;

  var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var data = range.getValues();
  data.sort(function(a, b) {
    var numA = parseInt(String(a[0]).replace(/\D/g, ""), 10) || 0;
    var numB = parseInt(String(b[0]).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  range.setValues(data);
}
