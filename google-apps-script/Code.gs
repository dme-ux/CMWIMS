/**
 * CMW ERP — Google Sheets Live Sync (Apps Script Web App)
 * ---------------------------------------------------------------------------
 * SETUP (one time):
 *   1. Open your Google Sheet → Extensions → Apps Script
 *   2. Delete any code, paste THIS file
 *   3. Set API_KEY below to match GOOGLE_SYNC_API_KEY in your ERP .env
 *   4. Deploy → New deployment → Web app
 *        Execute as: Me   |   Who has access: Anyone
 *   5. Copy the Web App URL → paste into ERP Settings → Google Sheets URL
 *   6. Save. Done — every create/update/delete now syncs here.
 *
 * The ERP POSTs JSON: { apiKey, entity, action, id, data }
 * Each `entity` maps to a sheet/tab of the same name (auto-created).
 */

const API_KEY = "CHANGE_ME_TO_MATCH_ERP"; // must equal GOOGLE_SYNC_API_KEY

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.apiKey !== API_KEY) return json({ ok: false, error: "Unauthorized" });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, body.entity, body.data);

    switch (body.action) {
      case "CREATE":
      case "UPDATE":
        upsertRow(sheet, body.id, body.data);
        break;
      case "DELETE":
        deleteRow(sheet, body.id);
        break;
    }
    return json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, service: "CMW ERP Sheets Sync", status: "running" });
}

/** Return (and lazily create) a sheet with a header row derived from data keys. */
function getOrCreateSheet(ss, name, data) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = ["id"].concat(Object.keys(data || {}));
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Insert a new row or overwrite the existing row matching `id` (column A). */
function upsertRow(sheet, id, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (h) {
    if (h === "id") return id;
    return data && data[h] !== undefined ? data[h] : "";
  });
  const rowIndex = findRowById(sheet, id);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function deleteRow(sheet, id) {
  const rowIndex = findRowById(sheet, id);
  if (rowIndex > 0) sheet.deleteRow(rowIndex);
}

function findRowById(sheet, id) {
  const ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (var i = 1; i < ids.length; i++) if (ids[i][0] === id) return i + 1;
  return -1;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
