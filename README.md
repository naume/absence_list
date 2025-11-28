# Soccer Team Attendance Tracker

A web-based attendance tracking system for soccer teams that integrates with Google Sheets.

## Features

- 📅 Date picker to select the attendance date
- 🏃 Activity type selection (Training/Turnier)
- 👥 Load kids list from Google Spreadsheet
- ✅ Toggle attendance for each kid (Present/Absent)
- 💾 Save attendance data to Google Spreadsheet
- 🔒 Password protection
- 📊 Real-time statistics (Total, Present, Absent)

## Setup Instructions

### 1. Google Sheets Setup

#### Kids List Spreadsheet
1. Create a new Google Spreadsheet for the kids list
2. In column A, list all kids' names (one per row)
3. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

#### Attendance Spreadsheet
1. Create a new Google Spreadsheet for storing attendance records
2. The script will automatically create columns: Date, Activity Type, Present Kids, Absent Count
3. Copy the Spreadsheet ID from the URL

### 2. Google API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - (Optional) Restrict the API key to only Google Sheets API for security

### 3. Google Apps Script Setup (for saving data)

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the code from `google-apps-script.js` into the editor
4. Update the `SPREADSHEET_ID` constant with your attendance spreadsheet ID
5. Save the project
6. Deploy as a web app:
   - Click "Deploy" > "New deployment"
   - Click the gear icon ⚙️ next to "Select type"
   - Choose "Web app"
   - Set:
     - Description: "Attendance Tracker"
     - Execute as: "Me"
     - Who has access: "Anyone" (or "Anyone with Google account" for more security)
   - Click "Deploy"
   - Copy the **Web App URL** (you'll need this for the next step)

### 4. Configure the HTML File

Open `index.html` and update the `CONFIG` object with your values:

```javascript
const CONFIG = {
    KIDS_SHEET_ID: 'your-kids-spreadsheet-id',
    KIDS_SHEET_NAME: 'Sheet1',
    KIDS_COLUMN: 'A',
    
    ATTENDANCE_SHEET_ID: 'your-attendance-spreadsheet-id',
    ATTENDANCE_SHEET_NAME: 'Sheet1',
    
    API_KEY: 'your-google-api-key',
    
    PASSWORD: 'your-secure-password',
    
    APPS_SCRIPT_URL: 'your-google-apps-script-web-app-url'
};
```

### 5. Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Prepare your files:**
   - Make sure all files are ready (especially `index.html` with your configuration)
   - Commit and push to a Git repository (GitHub, GitLab, or Bitbucket)

2. **Deploy to Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect your Git repository
   - Configure build settings:
     - **Build command:** (leave empty - no build needed)
     - **Publish directory:** `.` (root directory)
   - Click "Deploy site"

3. **Set up Password Protection (Netlify Pro/Team feature):**
   - Go to Site settings > Access control
   - Enable "Password protection"
   - Set a password (this is more secure than JavaScript-based protection)
   - Or use "Visitor access" to restrict by email domain

#### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

#### Option C: Use JavaScript Password (Fallback)

If you don't have Netlify Pro/Team, the app includes JavaScript-based password protection:
- Change the password in the `CONFIG` object in `index.html`
- Note: This is less secure as the password is visible in the code

### 6. Netlify Configuration

The project includes `netlify.toml` with:
- Security headers
- Cache settings
- Redirect rules

No additional configuration needed - just deploy!

## File Structure

```
absence_list/
├── index.html              # Main application file
├── google-apps-script.js   # Google Apps Script code (deploy separately)
├── netlify.toml            # Netlify configuration
├── _redirects              # Netlify redirects file
├── .gitignore             # Git ignore file
├── README.md              # This file
└── LICENSE                # License file
```

## Usage

1. Open the web page
2. Enter the password
3. Select the date
4. Select activity type (Training or Turnier)
5. Toggle each kid's attendance (Present/Absent)
6. Click "Save Attendance"
7. Data will be saved to your Google Spreadsheet

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Security**: The Google API key is visible in the client-side code. For read-only access to the kids list, this is acceptable, but consider:
   - Restricting the API key to only Google Sheets API
   - Restricting the API key to specific IP addresses (if possible)
   - Using a service account for more security

2. **Password Protection**: 
   - **Netlify (Recommended)**: Use Netlify's built-in password protection (Pro/Team feature) - more secure
   - **JavaScript Fallback**: The app includes client-side password protection as a fallback
   - For better security, use Netlify's password protection or OAuth 2.0

3. **Google Apps Script**: The Apps Script URL should be kept private. Anyone with the URL can write to your spreadsheet. Consider:
   - Using "Anyone with Google account" access level
   - Adding additional validation in the Apps Script
   - Using a service account with limited permissions

## Troubleshooting

### Kids list not loading
- Check that the API key is correct
- Verify the Spreadsheet ID is correct
- Ensure the Google Sheets API is enabled
- Check that the spreadsheet is shared (if using a service account, share with the service account email)

### Attendance not saving
- Verify the Google Apps Script URL is correct
- Check that the Apps Script is deployed as a web app
- Ensure the deployment has "Anyone" or appropriate access
- Check the browser console for error messages

### CORS errors
- The Google Sheets API should work from any origin
- If using Apps Script, ensure it's deployed with proper access settings

## License

See LICENSE file for details.

## Support

For issues or questions, please check:
- Google Sheets API documentation
- Google Apps Script documentation
- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Password Protection](https://docs.netlify.com/visitor-access/password-protection/)

