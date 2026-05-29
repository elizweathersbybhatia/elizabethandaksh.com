/**
 * RSVP <-> Google Sheet
 * Paste this into the Apps Script editor of your RSVP spreadsheet
 * (Extensions -> Apps Script), then deploy as a Web App.
 *
 * If you UPDATE this code later, you must publish a new version:
 *   Deploy -> Manage deployments -> (pencil/Edit) -> Version: New version -> Deploy
 * The Web App URL stays the same, so the website needs no changes.
 *
 * Endpoints:
 *   GET  /exec                                            -> "RSVP endpoint is live." (sanity check)
 *   GET  /exec?action=check&firstName=X&lastName=Y       -> {"rsvpd": true|false}
 *        + optional &callback=cb                          -> wraps as JSONP for the browser
 *   POST /exec  (form-urlencoded: firstName, lastName,
 *                email, phone, guests, children, notes,
 *                access)                                  -> appends a row
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // avoid two RSVPs writing the same row at once
  try {
    var sheet = getOrCreateRSVPSheet();
    var p = (e && e.parameter) ? e.parameter : {};
    var row = [
      new Date(),
      p.firstName || '',
      p.lastName  || '',
      p.email     || '',
      p.phone     || '',
      p.guests    || '',
      p.children  || '',
      p.notes     || '',
      p.access    || ''
    ];
    var r = sheet.getLastRow() + 1;
    // Timestamp stays a real date.
    sheet.getRange(r, 1).setValue(row[0]);
    // Columns 2..9 are forced to plain text BEFORE writing, so values such as
    // "+1 (555) 123-4567" (or anything starting with = + - @) are stored literally
    // instead of being parsed as a formula.
    var textRange = sheet.getRange(r, 2, 1, row.length - 1);
    textRange.setNumberFormat('@');
    textRange.setValues([row.slice(1)]);
    return jsonOut({ result: 'success' });
  } catch (err) {
    return jsonOut({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  e = e || {};
  var p = e.parameter || {};

  if (p.action === 'check') {
    var rsvpd = false;
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSVPs');
      if (sheet && sheet.getLastRow() > 1) {
        // Read just the First Name (col B) and Last Name (col C) of every data row.
        var data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues();
        var fn = norm(p.firstName);
        var ln = norm(p.lastName);
        if (fn && ln) {
          for (var i = 0; i < data.length; i++) {
            if (norm(data[i][0]) === fn && norm(data[i][1]) === ln) {
              rsvpd = true;
              break;
            }
          }
        }
      }
    } catch (err) { /* default rsvpd:false on any read error */ }

    // If the browser asked for JSONP (it does, to read across origins), wrap the
    // response in the callback function name they passed in. Otherwise return JSON.
    if (p.callback) {
      return ContentService
        .createTextOutput(p.callback + '(' + JSON.stringify({ rsvpd: rsvpd }) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonOut({ rsvpd: rsvpd });
  }

  return ContentService
    .createTextOutput('RSVP endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateRSVPSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('RSVPs') || ss.insertSheet('RSVPs');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'First Name', 'Last Name', 'Email',
      'Phone', 'Attendees', 'Children', 'Notes', 'Access'
    ]);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function norm(s) {
  return String(s == null ? '' : s).trim().toLowerCase();
}
