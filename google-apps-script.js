/**
 * Google Apps Script to handle attendance data saving
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Update the SPREADSHEET_ID constant with your attendance spreadsheet ID
 * 5. Deploy as a web app:
 *    - Click "Deploy" > "New deployment"
 *    - Choose "Web app" as type
 *    - Execute as: Me
 *    - Who has access: Anyone (or specific users)
 *    - Click "Deploy"
 *    - Copy the Web App URL and use it in index.html as APPS_SCRIPT_URL
 */

const SPREADSHEET_ID = '1edGoIYzKpmNFU0Iyr-PmOTI6NHPwFgE0p3eHlKlbLhM'; // Replace with your spreadsheet ID
const SHEET_GID = '21507466'; // GID of the "Absenzen" sheet tab (from URL: gid=21507466)
const SHEET_NAME = 'Absenzen'; // Name of the sheet tab (for reference)
// Note: "Spieler Liste" sheet has GID 0 (used for reading kids list)

function doPost(e) {
  try {
    // Log the incoming request for debugging
    Logger.log('doPost called');
    Logger.log('postData: ' + JSON.stringify(e.postData));
    Logger.log('parameter: ' + JSON.stringify(e.parameter));
    
    // Parse data - handle both JSON and form data
    let data;
    
    // First, try to get data from form-encoded body (most common)
    if (e.postData && e.postData.contents) {
      const body = e.postData.contents;
      Logger.log('Body contents: ' + body);
      
      // Check if it's form-encoded (data=...)
      if (body.includes('data=')) {
        const dataMatch = body.match(/data=([^&]+)/);
        if (dataMatch) {
          const decoded = decodeURIComponent(dataMatch[1]);
          Logger.log('Decoded data: ' + decoded);
          data = JSON.parse(decoded);
        } else {
          throw new Error('No data parameter found in form body');
        }
      } else {
        // Try parsing as direct JSON
        try {
          data = JSON.parse(body);
        } catch (parseError) {
          throw new Error('Failed to parse JSON from body: ' + parseError.toString());
        }
      }
    } else if (e.parameter && e.parameter.data) {
      // Get from URL parameters
      data = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No data provided. postData: ' + (e.postData ? JSON.stringify(e.postData) : 'null') + ', parameter: ' + (e.parameter ? JSON.stringify(e.parameter) : 'null'));
    }
    
    Logger.log('Parsed data: ' + JSON.stringify(data));
    
    // Validate required fields
    if (!data.date || !data.activityType) {
      throw new Error('Missing required fields: date and activityType. Received: ' + JSON.stringify(data));
    }
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Try to get sheet by GID first (more reliable)
    let sheet = null;
    try {
      const sheets = ss.getSheets();
      for (let i = 0; i < sheets.length; i++) {
        try {
          const sheetId = sheets[i].getSheetId();
          if (sheetId.toString() === SHEET_GID) {
            sheet = sheets[i];
            break;
          }
        } catch (idError) {
          // Continue to next sheet
        }
      }
    } catch (gidError) {
      // If GID lookup fails, try by name
    }
    
    // If not found by GID, try by name
    if (!sheet) {
      try {
        sheet = ss.getSheetByName(SHEET_NAME);
      } catch (nameError) {
        // Will create new sheet below
      }
    }
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 4).setValues([['Date', 'Activity Type', 'Present Kids', 'Absent Count']]);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    
    // Get the last row (handle empty sheet)
    let lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      lastRow = 1; // Header row
    }
    const newRow = lastRow + 1;
    
    // Prepare data
    const presentKidsString = Array.isArray(data.presentKids) 
      ? data.presentKids.join(', ') 
      : String(data.presentKids || '');
    
    // Write data: Date, Activity Type, Present Kids (comma-separated), Absent Count
    try {
      sheet.getRange(newRow, 1).setValue(data.date);
      sheet.getRange(newRow, 2).setValue(data.activityType);
      sheet.getRange(newRow, 3).setValue(presentKidsString);
      sheet.getRange(newRow, 4).setValue(data.absentKids || 0);
    } catch (writeError) {
      throw new Error('Failed to write data to sheet: ' + writeError.toString() + '. Row: ' + newRow + ', Sheet: ' + sheet.getName());
    }
    
    // Format the row
    try {
      sheet.getRange(newRow, 1, 1, 4).setBorder(true, true, true, true, true, true);
    } catch (formatError) {
      // Formatting is optional, continue
    }
    
    // Return with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Attendance saved successfully',
      row: newRow,
      sheet: sheet.getName(),
      sheetId: sheet.getSheetId().toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error with CORS headers and more details
    const errorInfo = {
      success: false,
      error: error.toString(),
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack || 'No stack trace available'
    };
    
    // Log to Apps Script execution log
    console.error('Error in doPost:', errorInfo);
    
    return ContentService.createTextOutput(JSON.stringify(errorInfo))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle OPTIONS request for CORS preflight
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Test function - run this directly in Apps Script editor to debug
function testSave() {
  try {
    const testData = {
      date: '2025-11-28',
      activityType: 'Test',
      presentKids: ['Test Kid'],
      totalKids: 1,
      absentKids: 0
    };
    
    // Simulate the request
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData)
      }
    };
    
    const result = doPost(mockEvent);
    Logger.log('Test result: ' + result.getContent());
    return result.getContent();
  } catch (error) {
    Logger.log('Test error: ' + error.toString());
    return error.toString();
  }
}

// Test function to check spreadsheet access
function testSpreadsheetAccess() {
  try {
    Logger.log('Testing spreadsheet access...');
    Logger.log('Spreadsheet ID: ' + SPREADSHEET_ID);
    Logger.log('Sheet GID: ' + SHEET_GID);
    Logger.log('Sheet Name: ' + SHEET_NAME);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Spreadsheet opened: ' + ss.getName());
    
    const sheets = ss.getSheets();
    Logger.log('Total sheets: ' + sheets.length);
    
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      const sheetId = sheet.getSheetId();
      Logger.log('Sheet ' + i + ': ' + sheet.getName() + ' (GID: ' + sheetId + ')');
    }
    
    // Try to find the target sheet
    let targetSheet = null;
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId().toString() === SHEET_GID) {
        targetSheet = sheets[i];
        Logger.log('Found sheet by GID: ' + targetSheet.getName());
        break;
      }
    }
    
    if (!targetSheet) {
      targetSheet = ss.getSheetByName(SHEET_NAME);
      if (targetSheet) {
        Logger.log('Found sheet by name: ' + targetSheet.getName());
      } else {
        Logger.log('Sheet not found! Will create it.');
      }
    }
    
    return 'Test completed - check logs';
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return 'Error: ' + error.toString();
  }
}

function doGet(e) {
  // Handle GET requests (for testing and small data)
  try {
    const dataParam = e.parameter.data;
    if (dataParam) {
      // For large data, redirect to POST
      if (dataParam.length > 1000) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Data too large for GET request. Please use POST.',
          message: 'GET requests have URL length limits. Use POST method instead.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = JSON.parse(dataParam);
      
      // Open the spreadsheet
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      
      // Try to get sheet by GID first (more reliable)
      let sheet = null;
      try {
        const sheets = ss.getSheets();
        for (let i = 0; i < sheets.length; i++) {
          try {
            const sheetId = sheets[i].getSheetId();
            if (sheetId.toString() === SHEET_GID) {
              sheet = sheets[i];
              break;
            }
          } catch (idError) {
            // Continue to next sheet
          }
        }
      } catch (gidError) {
        // If GID lookup fails, try by name
      }
      
      // If not found by GID, try by name
      if (!sheet) {
        try {
          sheet = ss.getSheetByName(SHEET_NAME);
        } catch (nameError) {
          // Will create new sheet below
        }
      }
      
      // Create sheet if it doesn't exist
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Add headers
        sheet.getRange(1, 1, 1, 4).setValues([['Date', 'Activity Type', 'Present Kids', 'Absent Count']]);
        sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      }
      
      // Get the last row (handle empty sheet)
      let lastRow = sheet.getLastRow();
      if (lastRow === 0) {
        lastRow = 1; // Header row
      }
      const newRow = lastRow + 1;
      
      // Prepare data
      const presentKidsString = Array.isArray(data.presentKids) 
        ? data.presentKids.join(', ') 
        : String(data.presentKids || '');
      
      // Write data: Date, Activity Type, Present Kids (comma-separated), Absent Count
      sheet.getRange(newRow, 1).setValue(data.date);
      sheet.getRange(newRow, 2).setValue(data.activityType);
      sheet.getRange(newRow, 3).setValue(presentKidsString);
      sheet.getRange(newRow, 4).setValue(data.absentKids || 0);
      
      // Format the row
      try {
        sheet.getRange(newRow, 1, 1, 4).setBorder(true, true, true, true, true, true);
      } catch (formatError) {
        // Formatting is optional, continue
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Attendance saved successfully',
        row: newRow,
        sheet: sheet.getName(),
        sheetId: sheet.getSheetId().toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Test endpoint
    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK',
      message: 'Google Apps Script is running',
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      sheetGid: SHEET_GID
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace available'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

