# Fix "The caller does not have permission" Error (403)

## Problem

You're getting a 403 error because your Google Spreadsheet is not accessible to the API key.

## Solution: Share Your Spreadsheet

Since you're using an API key (not OAuth), your spreadsheet needs to be **publicly viewable** or shared with "Anyone with the link".

### Step-by-Step Fix:

1. **Open your Google Spreadsheet**

   - Go to: https://docs.google.com/spreadsheets/d/1edGoIYzKpmNFU0Iyr-PmOTI6NHPwFgE0p3eHlKlbLhM/edit

2. **Click the "Share" button** (top right)

3. **Change sharing settings:**

   - Click "Change to anyone with the link"
   - Select **"Viewer"** (not Editor - for security)
   - Click "Done"

4. **Verify the link:**

   - The sharing should show "Anyone with the link can view"

5. **Test again:**
   - Refresh your attendance tracker page
   - The API should now work!

## Alternative: Use OAuth (More Secure)

If you don't want to make the spreadsheet public, you can use OAuth 2.0 instead of an API key. This requires users to sign in with Google, but keeps your spreadsheet private.

## Why This Happens

- **API Keys** work with public resources or resources shared with the API key's service account
- **OAuth** works with private resources by authenticating the user
- Since you're using an API key, the spreadsheet must be publicly accessible

## Security Note

Making the spreadsheet "viewable by anyone with the link" means:

- ✅ Anyone with the link can VIEW the data (read-only)
- ❌ They CANNOT edit or modify the data
- ✅ Your API key can read the data
- ⚠️ The link could be shared, but the data is read-only

For a kids list, this is usually acceptable since it's just names.

## Still Having Issues?

1. **Check the spreadsheet URL:**

   - Make sure you're sharing the correct spreadsheet
   - Verify the Sheet ID matches: `1edGoIYzKpmNFU0Iyr-PmOTI6NHPwFgE0p3eHlKlbLhM`

2. **Check the sheet name:**

   - Make sure the sheet tab is named exactly: `Spieler Liste`
   - Sheet names are case-sensitive!

3. **Try making it completely public:**

   - Share → Change to "Anyone on the internet with this link can view"
   - This is the most permissive setting

4. **Wait a few minutes:**
   - Sometimes Google's permissions take a few minutes to propagate

## Test the API Directly

You can test if the sharing worked by visiting this URL in your browser:

```
https://sheets.googleapis.com/v4/spreadsheets/1edGoIYzKpmNFU0Iyr-PmOTI6NHPwFgE0p3eHlKlbLhM/values/Spieler%20Liste!A:A?key=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your actual API key. If you see JSON data, it's working!
