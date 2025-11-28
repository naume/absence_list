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

const SPREADSHEET_ID = 'YOUR_ATTENDANCE_SPREADSHEET_ID'; // Replace with your spreadsheet ID

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Sheet1');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Sheet1');
      // Add headers
      sheet.getRange(1, 1, 1, 4).setValues([['Date', 'Activity Type', 'Present Kids', 'Absent Count']]);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    
    // Get the last row
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    // Prepare data
    const presentKidsString = data.presentKids.join(', ');
    
    // Write data: Date, Activity Type, Present Kids (comma-separated), Absent Count
    sheet.getRange(newRow, 1).setValue(data.date);
    sheet.getRange(newRow, 2).setValue(data.activityType);
    sheet.getRange(newRow, 3).setValue(presentKidsString);
    sheet.getRange(newRow, 4).setValue(data.absentKids);
    
    // Format the row
    sheet.getRange(newRow, 1, 1, 4).setBorder(true, true, true, true, true, true);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Attendance saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Optional: Add a test endpoint
  return ContentService.createTextOutput(JSON.stringify({
    status: 'OK',
    message: 'Google Apps Script is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

