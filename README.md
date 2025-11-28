# Soccer Team Attendance Tracker

A web-based attendance tracking system for soccer teams that integrates with Google Sheets and Supabase.

## Features

- 📅 Date picker to select the attendance date
- 🏃 Activity type selection (Training/Turnier)
- 👥 Load kids list from Google Spreadsheet (with grouping by team and role)
- ✅ Toggle attendance for each kid (Present/Absent)
- 💾 Save attendance data to Supabase database via Netlify Functions
- 🔒 Password protection
- 📊 Real-time statistics (Total, Present, Absent) with coach/player separation
- 📁 Collapsible groups by team (Junior-A, Junior-B, etc.) and role (Coach/Player)

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

### 3. Supabase Database Setup (for saving data)

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Create the `attendance` table (see `SUPABASE_SETUP.md` for detailed instructions)
4. Get your API credentials:
   - Go to Settings → API
   - Copy your `Project URL` and `service_role` key
5. See `SUPABASE_SETUP.md` for complete setup instructions

### 4. Configure the HTML File

Open `index.html` and update the `CONFIG` object with your values:

```javascript
const CONFIG = {
  KIDS_SHEET_ID: "your-kids-spreadsheet-id",
  KIDS_SHEET_NAME: "Spieler Liste", // Your sheet name
  KIDS_FIRST_NAME_COLUMN: "A",
  KIDS_LAST_NAME_COLUMN: "B",
  KIDS_TEAM_COLUMN: "C",
  KIDS_ROLE_COLUMN: "D",

  API_KEY: "your-google-api-key",

  PASSWORD: "your-secure-password",

  APPS_SCRIPT_URL: "/.netlify/functions/save-attendance", // Netlify Function
};
```

**Note:** Environment variables (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) are set in Netlify dashboard, not in this file.

### 4. Set Up Netlify Functions

The project includes a Netlify Function that saves data to Supabase. No additional setup needed - just make sure to set environment variables in Netlify (see Step 5).

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

3. **Set Environment Variables:**

   - Go to Site settings → Environment variables
   - Add:
     - `SUPABASE_URL` = your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service_role key
   - Click "Save"
   - **Important:** After adding variables, redeploy your site

4. **Set up Password Protection (Netlify Pro/Team feature - optional):**
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
├── index.html                          # Main application file
├── netlify/
│   └── functions/
│       └── save-attendance.js         # Netlify Function for Supabase
├── netlify.toml                        # Netlify configuration
├── package.json                        # Node.js dependencies
├── .gitignore                          # Git ignore file
├── README.md                           # This file
├── DEPLOYMENT_CHECKLIST.md              # Deployment guide
├── SUPABASE_SETUP.md                   # Supabase setup instructions
├── LOCAL_TESTING.md                     # Local development guide
└── LICENSE                             # License file
```

## Local Development / Testing

**Important:** Netlify Functions only work with `netlify dev`, not with simple HTTP servers.

### Using Netlify Dev (Recommended)

```bash
# Install dependencies
npm install

# Start Netlify dev server
npm run dev
```

This will:

- Start a local server (usually on port 8888)
- Load environment variables from `.env` file
- Make Netlify Functions work locally
- Automatically reload on changes

**Create a `.env` file** in the project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

See `LOCAL_TESTING.md` for detailed instructions.

### Alternative: Simple HTTP Server (Limited)

For testing UI only (functions won't work):

```bash
npx http-server . -p 8080
```

**Note:** Netlify Functions require `netlify dev` to work properly.

## Usage

1. Start Netlify dev (`npm run dev`) or deploy to Netlify
2. Open the web page (http://localhost:8888 or your Netlify URL)
3. Enter the password
4. Select the date
5. Select activity type (Training or Turnier)
6. Toggle each kid's attendance (Present/Absent)
7. Click "Save Attendance"
8. Data will be saved to your Supabase database

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Security**: The Google API key is visible in the client-side code. For read-only access to the kids list, this is acceptable, but consider:

   - Restricting the API key to only Google Sheets API
   - Restricting the API key to specific IP addresses (if possible)
   - Using a service account for more security

2. **Supabase Keys**:

   - **Service Role Key**: Never expose in client-side code. Only use in Netlify Functions (server-side)
   - **Anon Key**: Can be used client-side with RLS policies (not used in this setup)
   - Keep `.env` file out of git (already in `.gitignore`)

3. **Password Protection**:

   - **Netlify (Recommended)**: Use Netlify's built-in password protection (Pro/Team feature) - more secure
   - **JavaScript Fallback**: The app includes client-side password protection as a fallback
   - For better security, use Netlify's password protection or OAuth 2.0

4. **Environment Variables**:
   - Set `SUPABASE_SERVICE_ROLE_KEY` in Netlify dashboard, not in code
   - Never commit `.env` file to git

## Troubleshooting

### Kids list not loading

- Check that the API key is correct
- Verify the Spreadsheet ID is correct
- Ensure the Google Sheets API is enabled
- Check that the spreadsheet is shared (if using a service account, share with the service account email)

### Attendance not saving

- Check that environment variables are set in Netlify dashboard
- Verify Supabase credentials are correct
- Check Netlify Function logs (Functions tab in Netlify dashboard)
- Ensure Supabase table exists and RLS is configured (or use service_role key)
- Check the browser console for error messages
- See `SUPABASE_RLS_FIX.md` if you get RLS policy errors

### CORS errors

- The Google Sheets API should work from any origin
- If using Apps Script, ensure it's deployed with proper access settings

## License

See LICENSE file for details.

## Additional Documentation

- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `SUPABASE_SETUP.md` - Complete Supabase setup instructions
- `LOCAL_TESTING.md` - Local development guide
- `SUPABASE_RLS_FIX.md` - Fix RLS policy errors
- `GET_SUPABASE_KEY.md` - How to get Supabase API keys

## Support

For issues or questions, please check:

- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
