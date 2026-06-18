/**
 * Wedding website guest login and household RSVP API.
 *
 * Reads from and writes to the shared Google Sheet:
 *   https://docs.google.com/spreadsheets/d/1dFmW6g8yY7fgT2RpKfxMaCVi76xkoF3a-BiaCcNd1u4/edit
 *
 * Required tabs: Login_Master, Household_Master. RSVPs are written to Household_RSVPs.
 * Import Login_Master and Household_Master from wedding_website_guest_master_corrected.xlsx
 * before deploying.
 *
 * Deploy as a Web App ("Execute as: Me", "Who has access: Anyone").
 * After every code update, deploy a new version. The /exec URL remains unchanged.
 */

var SPREADSHEET_ID = '1dFmW6g8yY7fgT2RpKfxMaCVi76xkoF3a-BiaCcNd1u4';
var DEFAULT_PLANNER_SPREADSHEET_ID = '1-BR35gFTgLMFKOIzIcFgbj04rYEK7nWJKaJgvn4d_n4';
var LOGIN_SHEET = 'Login_Master';
var HOUSEHOLD_SHEET = 'Household_Master';
var RSVP_SHEET = 'Household_RSVPs';
var LOGIN_LOG_SHEET = 'Login_Log';
var PLANNER_RSVP_SHEET = 'Wedding RSVPs';
var TOKEN_DAYS = 30;
var RSVP_ACCEPT_DEADLINE = new Date('2026-09-01T03:59:59.999Z'); // Aug 31, 2026 EOD New York.
var RSVP_DECLINE_CHANGE_DEADLINE = new Date('2026-11-01T03:59:59.999Z'); // Oct 31, 2026 EOD New York.
var RSVP_HEADERS = [
  'Updated At', 'Household ID', 'Submitted By Guest ID', 'Submitted By Name',
  'Accepted Named Guests', 'Declined Named Guests',
  'Additional Adult Names', 'Additional Adult Contacts',
  'Child Names and Ages', 'Total Number of Guests',
  'Email', 'Phone', 'Notes', 'Invite Scope',
  'Guest Group', 'Subgroup',
  'Accepted Guest IDs JSON', 'Declined Guest IDs JSON',
  'Named Child Ages JSON', 'Additional Adults JSON', 'Children JSON'
];
var PLANNER_RSVP_HEADERS = [
  'Updated At', 'Submitted By Name', 'Guest Group', 'Subgroup', 'Email',
  'Accepted Named Guests', 'Declined Named Guests',
  'Additional Adult Names', 'Child Names and Ages',
  'Notes', 'Invite Scope', 'Additional Adult Contacts',
  'Total Number of Guests', 'Phone'
];

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var result;
  try {
    if (p.action === 'login') {
      result = loginGuest(p.firstName, p.lastName);
    } else if (p.action === 'getRsvp') {
      result = getRsvp(p.token);
    } else if (p.action === 'saveRsvp') {
      var lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try { result = saveRsvp(p); } finally { lock.releaseLock(); }
    } else {
      result = { ok: true, message: 'Wedding RSVP endpoint is live.' };
    }
  } catch (err) {
    result = { ok: false, error: friendlyError(err) };
  }
  return output(result, p.callback);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    if (p.action !== 'saveRsvp') return jsonOut({ ok: false, error: 'Unknown action.' });
    return jsonOut(saveRsvp(p));
  } catch (err) {
    return jsonOut({ ok: false, error: friendlyError(err) });
  } finally {
    lock.releaseLock();
  }
}

function loginGuest(firstName, lastName) {
  var first = norm(firstName);
  var last = norm(lastName);
  if (!first || !last) return { ok: false, error: 'Please enter both your first and last name.' };

  var logins = readObjects(LOGIN_SHEET);
  var login = null;
  var matchedNonLogin = false;
  for (var i = 0; i < logins.length; i++) {
    if (norm(logins[i].first_name) === first && norm(logins[i].last_name) === last) {
      if (canRsvpForHousehold(logins[i])) {
        login = logins[i];
        break;
      }
      matchedNonLogin = true;
    }
  }
  if (!login && matchedNonLogin) {
    return { ok: false, error: 'Please log in using the household invitation name.' };
  }
  if (!login) return { ok: false, error: 'We could not find that name on the invitation list. Please try again.' };

  var household = findHousehold(login.household_id);
  var namedMembers = householdMembers(logins, login.household_id);
  var capacities = deriveCapacities(household, namedMembers);
  var token = issueToken(login.guest_id, login.household_id);

  logLogin(login.guest_id, text(login.full_name), login.household_id);
  return {
    ok: true,
    guest: {
      guestId: text(login.guest_id),
      householdId: text(login.household_id),
      firstName: text(login.first_name),
      lastName: text(login.last_name),
      fullName: text(login.full_name),
      loginRole: text(login.login_role),
      inviteScope: text(household.invite_scope),
      guestGroup: text(household.bucket),
      invitedMonday: bool(household.invited_monday),
      invitedTuesday: bool(household.invited_tuesday),
      invitedWednesday: bool(household.invited_wednesday),
      totalGuests: capacities.totalGuests,
      unnamedAdultSlots: capacities.unnamedAdultSlots,
      childSlots: capacities.childSlots,
      namedMembers: namedMembers,
      token: token
    }
  };
}

function getRsvp(token) {
  var auth = verifyToken(token);
  var sheet = getOrCreateRsvpSheet();
  var row = findRsvpRow(sheet, auth.householdId);
  return { ok: true, rsvp: row ? rsvpFromRow(sheet, row) : null };
}

function saveRsvp(p) {
  var auth = verifyToken(p.token);
  if (text(p.householdId) !== auth.householdId) throw new Error('Household authorization failed.');
  if (text(p.submittedByGuestId) !== auth.guestId) throw new Error('Guest authorization failed.');

  var logins = readObjects(LOGIN_SHEET);
  var household = findHousehold(auth.householdId);
  var members = householdMembers(logins, auth.householdId);
  var memberIds = {};
  for (var i = 0; i < members.length; i++) memberIds[members[i].guestId] = true;

  var accepted = parseArray(p.acceptedGuestIds);
  var declined = parseArray(p.declinedGuestIds);
  var namedChildAges = cleanNamedChildAges(parseArray(p.namedChildAges));
  var additionalAdults = cleanAdults(parseArray(p.additionalAdults));
  var children = cleanChildren(parseArray(p.children));
  var capacities = deriveCapacities(household, members);
  var acceptedMap = {};
  var memberMap = {};

  for (var m = 0; m < members.length; m++) memberMap[members[m].guestId] = members[m];
  for (var j = 0; j < accepted.length; j++) {
    accepted[j] = text(accepted[j]);
    if (!memberIds[accepted[j]]) throw new Error('An RSVP selection is not part of this household.');
    acceptedMap[accepted[j]] = true;
  }
  accepted = unique(accepted);
  for (var d = 0; d < declined.length; d++) {
    declined[d] = text(declined[d]);
    if (!memberIds[declined[d]]) throw new Error('An RSVP selection is not part of this household.');
    if (acceptedMap[declined[d]]) throw new Error('A named guest cannot be both attending and declined.');
  }
  declined = unique(declined);

  if (!accepted.length && !declined.length) throw new Error('Choose Attend or Decline for each named household member.');
  if (!accepted.length && (additionalAdults.length || children.length)) {
    throw new Error('Additional guests can only be added when at least one named guest is attending.');
  }
  validateNamedChildAges(namedChildAges, acceptedMap, memberMap);
  if (additionalAdults.length > capacities.unnamedAdultSlots) throw new Error('Too many additional adult guests.');
  if (children.length > capacities.childSlots) throw new Error('Too many child guests.');
  if (accepted.length + additionalAdults.length + children.length > capacities.totalGuests) {
    throw new Error('This RSVP exceeds the household invitation size.');
  }

  var sheet = getOrCreateRsvpSheet();
  var existingRow = findRsvpRow(sheet, auth.householdId);
  var existingRsvp = existingRow ? rsvpFromRow(sheet, existingRow) : null;
  validateRsvpDeadline(existingRsvp, accepted, additionalAdults, children);

  var namesById = {};
  for (var k = 0; k < members.length; k++) namesById[members[k].guestId] = members[k].fullName;
  var submittedByName = namesById[auth.guestId] || '';
  var acceptedNames = accepted.map(function(id) { return namesById[id] || id; });
  var declinedNames = declined.map(function(id) { return namesById[id] || id; });
  var additionalAdultNames = additionalAdults.map(function(guest) {
    return guest.firstName + ' ' + guest.lastName;
  });
  var additionalAdultContacts = additionalAdults.map(function(guest) {
    var parts = [];
    if (guest.email) parts.push(guest.email);
    if (guest.phone) {
      var ph = guest.phoneCountry ? guest.phoneCountry + ' ' + guest.phone : guest.phone;
      parts.push(ph);
    }
    var name = guest.firstName + ' ' + guest.lastName;
    return name + (parts.length ? ' (' + parts.join(', ') + ')' : '');
  });
  var childNamesAndAges = children.map(function(child) {
    return child.firstName + ' ' + child.lastName + ' (age ' + child.age + ')';
  });
  var namedChildNamesAndAges = namedChildAges.map(function(child) {
    return (namesById[child.guestId] || child.fullName || child.guestId) + ' (age ' + child.age + ')';
  });
  var totalGuests = accepted.length + additionalAdults.length + children.length;
  var valuesByHeader = {
    'Updated At': new Date(),
    'Household ID': auth.householdId,
    'Submitted By Guest ID': auth.guestId,
    'Submitted By Name': submittedByName,
    'Accepted Named Guests': acceptedNames.join(', '),
    'Declined Named Guests': declinedNames.join(', '),
    'Additional Adult Names': additionalAdultNames.join(', '),
    'Additional Adult Contacts': additionalAdultContacts.join('; '),
    'Child Names and Ages': namedChildNamesAndAges.concat(childNamesAndAges).join(', '),
    'Total Number of Guests': totalGuests,
    'Email': text(p.email),
    'Phone': (text(p.phoneCountry) + ' ' + text(p.phone)).trim(),
    'Notes': text(p.notes),
    'Invite Scope': text(household.invite_scope),
    'Guest Group': text(household.bucket),
    'Subgroup': text(household.subgroup),
    'Accepted Guest IDs JSON': JSON.stringify(accepted),
    'Declined Guest IDs JSON': JSON.stringify(declined),
    'Named Child Ages JSON': JSON.stringify(namedChildAges),
    'Additional Adults JSON': JSON.stringify(additionalAdults),
    'Children JSON': JSON.stringify(children)
  };
  var activeHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var values = activeHeaders.map(function(header) {
    return Object.prototype.hasOwnProperty.call(valuesByHeader, header) ? valuesByHeader[header] : '';
  });
  var rowNumber = existingRow || sheet.getLastRow() + 1;
  sheet.getRange(rowNumber, 1).setValue(values[0]);
  var textRange = sheet.getRange(rowNumber, 2, 1, values.length - 1);
  textRange.setNumberFormat('@');
  textRange.setValues([values.slice(1)]);
  try {
    syncPlannerRsvps(sheet);
  } catch (syncErr) {
    Logger.log('Planner RSVP sync failed: ' + friendlyError(syncErr));
  }
  return { ok: true };
}

function deriveCapacities(household, members) {
  var total = number(household.total_guests);
  var namedCount = members.length;
  var namedChildCount = members.filter(function(member) { return member.requiresAge; }).length;
  var unnamed = Math.max(0, total - namedCount);
  var childSlots = Math.min(Math.max(0, number(household.children_count) - namedChildCount), unnamed);
  return {
    totalGuests: total,
    childSlots: childSlots,
    unnamedAdultSlots: Math.max(0, unnamed - childSlots)
  };
}

function householdMembers(logins, householdId) {
  var rows = [];
  for (var i = 0; i < logins.length; i++) {
    if (text(logins[i].household_id) === text(householdId)) {
      rows.push({
        guestId: text(logins[i].guest_id),
        firstName: text(logins[i].first_name),
        lastName: text(logins[i].last_name),
        fullName: text(logins[i].full_name),
        loginRole: text(logins[i].login_role),
        canRsvpForHousehold: canRsvpForHousehold(logins[i]),
        requiresAge: isChildRole(logins[i].login_role)
      });
    }
  }
  rows.sort(function(a, b) {
    if (a.loginRole === 'primary') return -1;
    if (b.loginRole === 'primary') return 1;
    return a.fullName.localeCompare(b.fullName);
  });
  return rows;
}

function findHousehold(householdId) {
  var households = readObjects(HOUSEHOLD_SHEET);
  for (var i = 0; i < households.length; i++) {
    if (text(households[i].household_id) === text(householdId)) return households[i];
  }
  throw new Error('Household record not found.');
}

function getOrCreateRsvpSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(RSVP_SHEET) || ss.insertSheet(RSVP_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    for (var i = 0; i < RSVP_HEADERS.length; i++) {
      if (currentHeaders.indexOf(RSVP_HEADERS[i]) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(RSVP_HEADERS[i]);
        currentHeaders.push(RSVP_HEADERS[i]);
      }
    }
  }
  return sheet;
}

function findRsvpRow(sheet, householdId) {
  if (sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var householdColumn = headers.indexOf('Household ID') + 1;
  if (!householdColumn) return 0;
  var ids = sheet.getRange(2, householdColumn, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) {
    if (text(ids[i][0]) === text(householdId)) return i + 2;
  }
  return 0;
}

function rsvpFromRow(sheet, row) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var record = {};
  for (var i = 0; i < headers.length; i++) record[headers[i]] = values[i];
  return {
    updatedAt: record['Updated At'],
    householdId: record['Household ID'],
    submittedByGuestId: record['Submitted By Guest ID'],
    email: record['Email'],
    phoneCountry: (record['Phone'] || '').replace(/^(\+\d+)\s.*$/, '$1') || '+1',
    phone: (record['Phone'] || '').replace(/^\+\d+\s?/, ''),
    acceptedGuestIds: parseArray(record['Accepted Guest IDs JSON']),
    declinedGuestIds: parseArray(record['Declined Guest IDs JSON']),
    namedChildAges: parseArray(record['Named Child Ages JSON']),
    additionalAdults: parseArray(record['Additional Adults JSON']),
    children: parseArray(record['Children JSON']),
    notes: record['Notes'],
    inviteScope: record['Invite Scope']
  };
}

function syncPlannerRsvpsManual() {
  return syncPlannerRsvps();
}

function syncPlannerRsvps(sourceSheet) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var plannerSpreadsheetId = PropertiesService.getScriptProperties().getProperty('PLANNER_SPREADSHEET_ID') || DEFAULT_PLANNER_SPREADSHEET_ID || SPREADSHEET_ID;
  var plannerSs = plannerSpreadsheetId === SPREADSHEET_ID ? ss : SpreadsheetApp.openById(plannerSpreadsheetId);
  sourceSheet = sourceSheet || getOrCreateRsvpSheet();

  var plannerSheet = plannerSs.getSheetByName(PLANNER_RSVP_SHEET) || plannerSs.insertSheet(PLANNER_RSVP_SHEET);
  if (plannerSs.getId() === ss.getId() && plannerSheet.getSheetId() === sourceSheet.getSheetId()) {
    throw new Error('Refusing to sync planner RSVPs into the source RSVP sheet.');
  }
  var rows = buildPlannerRsvpRows(sourceSheet);
  if (plannerSheet.getMaxColumns() < PLANNER_RSVP_HEADERS.length) {
    plannerSheet.insertColumnsAfter(plannerSheet.getMaxColumns(), PLANNER_RSVP_HEADERS.length - plannerSheet.getMaxColumns());
  }
  if (plannerSheet.getMaxRows() < rows.length) {
    plannerSheet.insertRowsAfter(plannerSheet.getMaxRows(), rows.length - plannerSheet.getMaxRows());
  }

  plannerSheet.clearContents();
  plannerSheet.getRange(1, 1, rows.length, PLANNER_RSVP_HEADERS.length).setValues(rows);
  plannerSheet.setFrozenRows(1);
  plannerSheet.getRange(1, 1, 1, PLANNER_RSVP_HEADERS.length)
    .setFontWeight('bold')
    .setWrap(true)
    .setBackground('#e8dbba');
  plannerSheet.autoResizeColumns(1, PLANNER_RSVP_HEADERS.length);

  var extraColumns = plannerSheet.getMaxColumns() - PLANNER_RSVP_HEADERS.length;
  if (extraColumns > 0) {
    plannerSheet.deleteColumns(PLANNER_RSVP_HEADERS.length + 1, extraColumns);
  }

  return {
    ok: true,
    plannerSheet: PLANNER_RSVP_SHEET,
    rowsSynced: rows.length - 1
  };
}

function buildPlannerRsvpRows(sourceSheet) {
  var rows = [PLANNER_RSVP_HEADERS.slice()];
  if (sourceSheet.getLastRow() < 2 || sourceSheet.getLastColumn() < 1) return rows;

  var values = sourceSheet.getRange(1, 1, sourceSheet.getLastRow(), sourceSheet.getLastColumn()).getDisplayValues();
  var sourceHeaders = values[0].map(function(value) { return text(value).trim(); });
  var indexes = {};
  for (var i = 0; i < sourceHeaders.length; i++) indexes[sourceHeaders[i]] = i;
  var updatedAtIndex = indexes['Updated At'];

  for (var r = 1; r < values.length; r++) {
    if (updatedAtIndex == null || !text(values[r][updatedAtIndex]).trim()) continue;
    rows.push(PLANNER_RSVP_HEADERS.map(function(header) {
      var index = indexes[header];
      return index == null ? '' : values[r][index];
    }));
  }
  return rows;
}

function readObjects(sheetName) {
  var sheet = findOrNameMasterSheet(sheetName);
  if (!sheet) throw new Error('Missing required sheet: ' + sheetName);
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(value) { return text(value).trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(value) { return text(value).trim() !== ''; });
  }).map(function(row) {
    var item = {};
    for (var i = 0; i < headers.length; i++) item[headers[i]] = row[i];
    return item;
  });
}

function findOrNameMasterSheet(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var exact = ss.getSheetByName(sheetName);
  if (exact) return exact;

  var requiredHeaders = sheetName === LOGIN_SHEET
    ? ['guest_id', 'household_id', 'first_name', 'last_name']
    : ['household_id', 'primary_guest', 'total_guests', 'login_count'];
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (sheet.getLastColumn() < requiredHeaders.length || sheet.getLastRow() < 1) continue;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
      .map(function(value) { return text(value).trim(); });
    var matches = requiredHeaders.every(function(header) { return headers.indexOf(header) !== -1; });
    if (matches) {
      sheet.setName(sheetName);
      return sheet;
    }
  }
  return null;
}

function cleanAdults(items) {
  return items.map(function(item) {
    var guest = {
      firstName: text(item && item.firstName).trim(),
      lastName: text(item && item.lastName).trim()
    };
    if (!guest.firstName || !guest.lastName) throw new Error('Every additional adult guest needs a first and last name.');
    guest.email = text(item && item.email).trim();
    guest.phoneCountry = text(item && item.phoneCountry).trim();
    guest.phone = text(item && item.phone).trim();
    return guest;
  });
}

function cleanChildren(items) {
  return items.map(function(item) {
    var guest = {
      firstName: text(item && item.firstName).trim(),
      lastName: text(item && item.lastName).trim()
    };
    if (!guest.firstName || !guest.lastName) throw new Error('Every child guest needs a first and last name.');
    var age = number(item && item.age);
    if (text(item && item.age).trim() === '' || age < 0 || age > 17) {
      throw new Error('Every child needs an age from 0 to 17.');
    }
    guest.age = age;
    return guest;
  });
}

function cleanNamedChildAges(items) {
  return items.map(function(item) {
    var guest = {
      guestId: text(item && item.guestId).trim(),
      fullName: text(item && item.fullName).trim()
    };
    var age = number(item && item.age);
    if (!guest.guestId) throw new Error('A named child age is missing its guest ID.');
    if (text(item && item.age).trim() === '' || age < 0 || age > 17) {
      throw new Error('Every attending named child needs an age from 0 to 17.');
    }
    guest.age = age;
    return guest;
  });
}

function validateNamedChildAges(namedChildAges, acceptedMap, memberMap) {
  var agesByGuestId = {};
  for (var i = 0; i < namedChildAges.length; i++) {
    var child = namedChildAges[i];
    var member = memberMap[child.guestId];
    if (!member || !member.requiresAge) throw new Error('A named child age does not match this household.');
    if (!acceptedMap[child.guestId]) throw new Error('Only attending named children should include an age.');
    agesByGuestId[child.guestId] = true;
  }
  for (var id in acceptedMap) {
    if (memberMap[id] && memberMap[id].requiresAge && !agesByGuestId[id]) {
      throw new Error('Every attending named child needs an age.');
    }
  }
}

function validateRsvpDeadline(existingRsvp, accepted, additionalAdults, children) {
  var now = new Date();
  if (now > RSVP_DECLINE_CHANGE_DEADLINE) {
    throw new Error('RSVP changes are now closed. Please contact us directly if you need help.');
  }
  if (now <= RSVP_ACCEPT_DEADLINE) return;

  var previousAccepted = {};
  if (existingRsvp && existingRsvp.acceptedGuestIds) {
    for (var i = 0; i < existingRsvp.acceptedGuestIds.length; i++) {
      previousAccepted[text(existingRsvp.acceptedGuestIds[i])] = true;
    }
  }
  var addsNamedAcceptance = accepted.some(function(id) {
    return !previousAccepted[text(id)];
  });
  var previousTotal = attendingTotal(existingRsvp);
  var nextTotal = accepted.length + additionalAdults.length + children.length;
  if (nextTotal > previousTotal || addsNamedAcceptance) {
    throw new Error('The RSVP deadline for adding attendees was August 31. Please contact us directly if you need help.');
  }
}

function attendingTotal(rsvp) {
  if (!rsvp) return 0;
  return (rsvp.acceptedGuestIds || []).length +
    (rsvp.additionalAdults || []).length +
    (rsvp.children || []).length;
}

function canRsvpForHousehold(row) {
  var value = text(row && row.can_rsvp_for_household).trim();
  return value === '' || bool(value);
}

function isChildRole(role) {
  return /child/i.test(text(role));
}

function issueToken(guestId, householdId) {
  var payload = {
    guestId: text(guestId),
    householdId: text(householdId),
    expires: Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000
  };
  var body = webSafeEncode(JSON.stringify(payload));
  return body + '.' + sign(body);
}

function verifyToken(token) {
  var parts = text(token).split('.');
  if (parts.length !== 2 || sign(parts[0]) !== parts[1]) throw new Error('Your login session is invalid. Please log in again.');
  var payload = JSON.parse(webSafeDecode(parts[0]));
  if (!payload.expires || Number(payload.expires) < Date.now()) throw new Error('Your login session has expired. Please log in again.');
  return payload;
}

function sign(value) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('RSVP_TOKEN_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('RSVP_TOKEN_SECRET', secret);
  }
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value, secret)).replace(/=+$/, '');
}

function webSafeEncode(value) {
  return Utilities.base64EncodeWebSafe(value).replace(/=+$/, '');
}

function webSafeDecode(value) {
  var padded = value + '==='.slice((value.length + 3) % 4);
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString();
}

function output(obj, callback) {
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOut(obj);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  var parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Invalid RSVP data.');
  return parsed;
}

function unique(values) {
  var seen = {};
  return values.filter(function(value) {
    value = text(value);
    if (seen[value]) return false;
    seen[value] = true;
    return true;
  });
}

function norm(value) {
  return text(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function text(value) {
  return value == null ? '' : String(value);
}

function number(value) {
  var n = Number(value);
  return isFinite(n) ? n : 0;
}

function bool(value) {
  return value === true || /^(true|yes|1)$/i.test(text(value).trim());
}

function logLogin(guestId, fullName, householdId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(LOGIN_LOG_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(LOGIN_LOG_SHEET);
      sheet.appendRow(['Guest ID', 'Full Name', 'Household ID', 'Login Count', 'First Login', 'Last Login']);
      sheet.setFrozenRows(1);
    }
    var id = text(guestId);
    var now = new Date();
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      for (var i = 0; i < ids.length; i++) {
        if (text(ids[i][0]) === id) {
          var row = i + 2;
          var count = Number(sheet.getRange(row, 4).getValue()) || 0;
          sheet.getRange(row, 4).setValue(count + 1);
          sheet.getRange(row, 6).setValue(now);
          return;
        }
      }
    }
    sheet.appendRow([id, text(fullName), text(householdId), 1, now, now]);
  } catch (e) {
    Logger.log('Login log failed: ' + e.message);
  }
}

function friendlyError(err) {
  var message = err && err.message ? err.message : text(err);
  return message.replace(/^Exception:\s*/, '');
}
