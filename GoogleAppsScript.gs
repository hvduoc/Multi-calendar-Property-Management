
/**
 * GOOGLE APPS SCRIPT - BACKEND CODE (V3 - Contact & Notes)
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet() ? SpreadsheetApp.getActiveSpreadsheet().getId() : "YOUR_SPREADSHEET_ID_HERE";
const SHEET_ROOMS = "Rooms";
const SHEET_PRICES = "Prices";

function doGet(e) {
  try {
    const rooms = getRoomsAndPrices();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: rooms }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (params.action === 'updatePrice') {
      const sheet = ss.getSheetByName(SHEET_PRICES) || ss.insertSheet(SHEET_PRICES);
      if (sheet.getLastRow() === 0) sheet.appendRow(["RoomID", "Date", "Price"]);
      const data = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == params.roomId && data[i][1] == params.date) {
          sheet.getRange(i + 1, 3).setValue(params.price);
          found = true; break;
        }
      }
      if (!found) sheet.appendRow([params.roomId, params.date, params.price]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = ss.getSheetByName(SHEET_ROOMS) || ss.insertSheet(SHEET_ROOMS);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "Tên phòng", "Tòa nhà", "Loại", "Link iCal", "Link Listing", "Liên hệ", "Ghi chú"]);
    }
    const id = Utilities.getUuid();
    sheet.appendRow([id, params.name, params.building, params.type, params.icalLink, params.listingUrl || "", params.contact || "", params.notes || ""]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getRoomsAndPrices() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const priceMap = {};
  const priceSheet = ss.getSheetByName(SHEET_PRICES);
  if (priceSheet) {
    const pData = priceSheet.getDataRange().getValues();
    pData.shift();
    pData.forEach(row => {
      const rId = row[0];
      const d = row[1];
      const p = row[2];
      if (!priceMap[rId]) priceMap[rId] = {};
      priceMap[rId][d] = p;
    });
  }

  const sheet = ss.getSheetByName(SHEET_ROOMS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  data.shift();
  
  return data.map(row => {
    const roomId = row[0];
    const room = {
      id: roomId,
      name: row[1],
      building: row[2],
      type: row[3],
      icalLink: row[4],
      listingUrl: row[5] || "",
      contact: row[6] || "",
      notes: row[7] || "",
      bookings: [],
      prices: priceMap[roomId] || {}
    };
    if (room.icalLink) room.bookings = fetchAndParseIcal(room.icalLink);
    return room;
  });
}

function fetchAndParseIcal(url) {
  try {
    const response = UrlFetchApp.fetch(url);
    const icalContent = response.getContentText();
    const events = [];
    const veventMatches = icalContent.split("BEGIN:VEVENT");
    veventMatches.shift(); 
    veventMatches.forEach(eventBlock => {
      const startMatch = eventBlock.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
      const endMatch = eventBlock.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);
      const summaryMatch = eventBlock.match(/SUMMARY:(.*)/);
      if (startMatch && endMatch) {
        events.push({
          start: formatDateString(startMatch[1]),
          end: formatDateString(endMatch[1]),
          guestName: summaryMatch ? summaryMatch[1].trim() : "Airbnb"
        });
      }
    });
    return events;
  } catch (e) { return []; }
}

function formatDateString(str) {
  return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
}
