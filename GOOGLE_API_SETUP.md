# Google API Setup Guide

## Quick Fix for "Google Sheets API has not been used" Error

If you're seeing this error, you need to enable the Google Sheets API in your Google Cloud project.

### Step-by-Step Instructions

1. **Go to the Google Cloud Console**

   - Visit: https://console.cloud.google.com/
   - Make sure you're signed in with the correct Google account

2. **Select or Create a Project**

   - If you see project `1024982393380` in the dropdown, select it
   - If not, create a new project:
     - Click the project dropdown at the top
     - Click "New Project"
     - Give it a name (e.g., "Soccer Attendance Tracker")
     - Click "Create"

3. **Enable Google Sheets API**

   - **Option A: Direct Link (Fastest)**

     - Click this link: https://console.developers.google.com/apis/api/sheets.googleapis.com/overview
     - Make sure the correct project is selected in the dropdown
     - Click the **"Enable"** button

   - **Option B: Manual Steps**
     - In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
     - Search for **"Google Sheets API"**
     - Click on **"Google Sheets API"**
     - Click the **"Enable"** button

4. **Wait a Few Minutes**

   - After enabling, wait 2-5 minutes for the API to propagate
   - Refresh your attendance tracker page and try again

5. **Verify API is Enabled**
   - Go to **"APIs & Services"** → **"Enabled APIs"**
   - You should see "Google Sheets API" in the list

### Create/Verify API Key

1. **Go to Credentials**

   - Navigate to **"APIs & Services"** → **"Credentials"**

2. **Create API Key (if you don't have one)**

   - Click **"Create Credentials"** → **"API Key"**
   - Copy the API key that's generated

3. **Restrict API Key (Recommended for Security)**

   - Click on your API key to edit it
   - Under **"API restrictions"**, select **"Restrict key"**
   - Choose **"Google Sheets API"** from the list
   - Click **"Save"**

4. **Update Your index.html**
   - Open `index.html`
   - Find the `CONFIG` object
   - Update `API_KEY: 'your-google-api-key'` with your actual API key

### Common Issues

**Issue: "API not enabled" error persists after enabling**

- **Solution:** Wait 5-10 minutes and try again. Sometimes it takes time to propagate.

**Issue: "API key invalid" error**

- **Solution:**
  - Verify you copied the entire API key
  - Check that the API key is not restricted to specific IPs (unless you're testing from that IP)
  - Make sure the API key is for the correct project

**Issue: "Access denied" or "Permission denied"**

- **Solution:**
  - Make sure your Google Spreadsheet is shared appropriately
  - If using a service account, share the spreadsheet with the service account email
  - For personal use, make sure you're signed in with the correct Google account

### Testing Your Setup

1. **Test API Key:**

   ```
   https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Sheet1!A:A?key=YOUR_API_KEY
   ```

   Replace `YOUR_SHEET_ID` and `YOUR_API_KEY` with your actual values.
   You should see JSON data with your spreadsheet values.

2. **Check Browser Console:**
   - Open your attendance tracker page
   - Press F12 to open Developer Tools
   - Go to the "Console" tab
   - Look for any error messages

### Security Best Practices

1. **Restrict API Key:**

   - Only allow Google Sheets API
   - Don't restrict by IP unless you have a static IP

2. **Spreadsheet Sharing:**

   - Only share with people who need access
   - Use "Viewer" permission for the kids list spreadsheet if possible

3. **API Key Storage:**
   - Never commit your API key to public repositories
   - Consider using environment variables if possible (though for static sites, this is limited)

### Need More Help?

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Console Help](https://cloud.google.com/docs)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
