# Troubleshooting Guide

## 500 Error from Apps Script

If you're getting a 500 error, the Apps Script is failing. Here's how to debug:

### Step 1: Check Apps Script Execution Logs

1. Go to https://script.google.com
2. Open your project
3. Click **"Executions"** in the left sidebar
4. Find the most recent execution (should show ❌ error)
5. Click on it to see the error details

### Step 2: Common Errors and Fixes

#### Error: "Cannot find method getSheetId"

- **Fix**: Make sure you're using the latest Google Apps Script API
- The `getSheetId()` method should work in modern Apps Script

#### Error: "Spreadsheet not found" or "Permission denied"

- **Fix**:
  - Verify the `SPREADSHEET_ID` in your Apps Script matches your spreadsheet
  - Make sure the spreadsheet is shared with your Google account
  - The Apps Script needs edit permissions on the spreadsheet

#### Error: "Sheet not found"

- **Fix**:
  - Check that the sheet name "Absenzen" exists
  - Or verify the GID (21507466) is correct
  - The script will create the sheet if it doesn't exist, but only if it has permissions

#### Error: "No data provided" or parsing errors

- **Fix**: The data format might be wrong. Check that:
  - `date` is in format YYYY-MM-DD
  - `activityType` is "Training" or "Turnier"
  - `presentKids` is an array

### Step 3: Test the Apps Script Directly

You can test the Apps Script directly in the editor:

1. In Apps Script editor, add this test function:

```javascript
function testSave() {
  const testData = {
    date: "2025-11-28",
    activityType: "Test",
    presentKids: ["Test Kid"],
    totalKids: 1,
    absentKids: 0,
  };

  // Simulate the request
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData),
    },
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
```

2. Run this function (click Run → testSave)
3. Check the execution logs to see if it works

### Step 4: Verify Deployment Settings

1. Go to **Deploy** → **Manage deployments**
2. Make sure:
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (for testing) or "Anyone with Google account"
   - **Version**: Latest version

### Step 5: Check Spreadsheet Permissions

1. Open your Google Spreadsheet
2. Click **Share** button
3. Make sure your Google account has **Editor** access
4. The Apps Script runs as "Me", so it needs your account to have edit access

### Quick Test Checklist

- [ ] Apps Script is deployed and active
- [ ] Spreadsheet ID is correct in Apps Script
- [ ] Sheet name/GID is correct
- [ ] Your Google account has edit access to the spreadsheet
- [ ] Apps Script execution logs show the actual error
- [ ] Test data appears in the "Absenzen" sheet (check manually)

### Still Not Working?

1. **Check the execution logs** - This is the most important step!
2. **Share the error message** from the execution logs
3. **Verify the spreadsheet** - Open it and check if any data was saved despite the error
4. **Test with minimal data** - Try saving just one kid to see if it's a data size issue
