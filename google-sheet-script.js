function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var targetId = String(data.id).trim().toUpperCase();
    var values = sheet.getDataRange().getValues();
    var headers = values[0] || [];

    // Helper: Find or create column by header name
    function getColumnIndex(headerName) {
      for (var c = 0; c < headers.length; c++) {
        if (String(headers[c]).trim().toLowerCase() === headerName.trim().toLowerCase()) {
          return c + 1; // 1-indexed for getRange
        }
      }
      // Column does not exist -> Create new column header automatically!
      var newColIdx = headers.length + 1;
      sheet.getRange(1, newColIdx).setValue(headerName);
      headers.push(headerName);
      return newColIdx;
    }

    // Standard column positions
    var idCol = 1; // Col A
    var nameCol = 2; // Col B
    var teamCol = 3; // Col C
    var kitCol = 4; // Col D
    var accCol = 5; // Col E
    var foodCol = 6; // Col F

    // Ensure standard columns exist in header
    if (headers.length < 6) {
      sheet.getRange(1, 1).setValue("Participant ID");
      sheet.getRange(1, 2).setValue("Name");
      sheet.getRange(1, 3).setValue("Team ID");
      sheet.getRange(1, 4).setValue("Kit Received");
      sheet.getRange(1, 5).setValue("Accommodation");
      sheet.getRange(1, 6).setValue("Food Received");
      headers = sheet.getDataRange().getValues()[0];
    }

    // Find row index
    var targetRow = -1;
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][0]).trim().toUpperCase() === targetId) {
        targetRow = r + 1;
        break;
      }
    }

    // If row doesn't exist, create it
    if (targetRow === -1) {
      targetRow = sheet.getLastRow() + 1;
      sheet.getRange(targetRow, idCol).setValue(targetId);
    }

    // Write Name & Team
    if (data.name) sheet.getRange(targetRow, nameCol).setValue(data.name);
    if (data.team) sheet.getRange(targetRow, teamCol).setValue(data.team);

    // Write Checklist statuses (Kit, Accommodation, Food)
    if (data.status) {
      sheet.getRange(targetRow, kitCol).setValue(data.status.kit ? "YES" : "NO");
      sheet.getRange(targetRow, accCol).setValue(data.status.accommodation ? "YES" : "NO");
      sheet.getRange(targetRow, foodCol).setValue(data.status.food ? "YES" : "NO");

      // Any extra custom checkboxes (e.g. T-Shirt, Certificate)
      for (var checkKey in data.status) {
        if (checkKey !== "kit" && checkKey !== "accommodation" && checkKey !== "food") {
          var colIdx = getColumnIndex(checkKey);
          sheet.getRange(targetRow, colIdx).setValue(data.status[checkKey] ? "YES" : "NO");
        }
      }
    }

    // Write Custom Fields (e.g. Email, Contact / Phone, College, etc.)
    if (data.fields && typeof data.fields === "object") {
      for (var fieldKey in data.fields) {
        var colIdx = getColumnIndex(fieldKey);
        sheet.getRange(targetRow, colIdx).setValue(data.fields[fieldKey] || "");
      }
    }

    // Last Updated timestamp column
    var updatedCol = getColumnIndex("Last Updated");
    sheet.getRange(targetRow, updatedCol).setValue(new Date().toLocaleString());

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Synced all custom fields and statuses!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
