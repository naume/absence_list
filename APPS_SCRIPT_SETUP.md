# Google Apps Script Setup - Step by Step

## Step 1: Create a New Project

1. Go to https://script.google.com
2. Click **"New Project"** (or the **"+"** button)
3. A new project will open with a blank `Code.gs` file

## Step 2: Paste the Code

1. **Delete** the default `function myFunction() {}` code
2. **Copy ALL the code** from `google-apps-script.js` file
3. **Paste it** into the Apps Script editor
4. **Save** the project (Ctrl+S or Cmd+S)
5. Give it a name like "Attendance Tracker" (click "Untitled project" at the top)

## Step 3: Verify Configuration

Make sure these constants are set correctly at the top of the file:

```javascript
const SPREADSHEET_ID = "1edGoIYzKpmNFU0Iyr-PmOTI6NHPwFgE0p3eHlKlbLhM";
const SHEET_GID = "21507466";
const SHEET_NAME = "Absenzen";
```

## Step 4: Test Spreadsheet Access

1. In the Apps Script editor, look at the top right
2. You'll see a dropdown that says "Select function" - click it
3. Select **`testSpreadsheetAccess`** from the dropdown
4. Click the **Run** button (▶️ play icon)
5. **Authorize** the script when prompted:
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to Attendance Tracker (unsafe)" (if shown)
   - Click "Allow"
6. Check the **Execution log** at the bottom:
   - You should see logs showing:
     - Spreadsheet opened
     - Total sheets
     - Sheet names and GIDs
     - Whether it found the "Absenzen" sheet

## Step 5: Test Saving Data

1. Select **`testSave`** from the function dropdown
2. Click **Run** (▶️)
3. Check the **Execution log** for any errors
4. Check your **"Absenzen" spreadsheet** to see if a test row was added

## Step 6: Deploy as Web App

1. Click **"Deploy"** in the top right
2. Click **"New deployment"**
3. Click the **gear icon** (⚙️) next to "Select type"
4. Choose **"Web app"**
5. Configure:
   - **Description**: "Attendance Tracker API"
   - **Execute as**: **"Me"** (your account)
   - **Who has access**: **"Anyone"** (for testing) or "Anyone with Google account"
6. Click **"Deploy"**
7. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycbx-.../exec
   ```
8. **Update your `index.html`** - paste this URL into `CONFIG.APPS_SCRIPT_URL`

## Step 7: Test the Web App

1. Go back to your attendance tracker page
2. Click "🔧 Test Connection"
3. Check your "Absenzen" spreadsheet to see if data was saved

## Troubleshooting

### "Authorization required" error

- Make sure you clicked "Allow" when prompted
- The script needs permission to access your spreadsheet

### "Spreadsheet not found" error

- Verify the `SPREADSHEET_ID` is correct
- Make sure the spreadsheet is shared with your Google account

### "Sheet not found" error

- Run `testSpreadsheetAccess` to see all available sheets
- Check if the GID or sheet name is correct

### Test functions not showing in dropdown

- Make sure you saved the file
- Refresh the page
- Check that the functions are in the code (not commented out)

## Quick Test Checklist

- [ ] Project created
- [ ] Code pasted and saved
- [ ] `testSpreadsheetAccess` runs without errors
- [ ] `testSave` runs and adds data to spreadsheet
- [ ] Web app deployed
- [ ] Web app URL copied to `index.html`
- [ ] Test connection works from the web page
