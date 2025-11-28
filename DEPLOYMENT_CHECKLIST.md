# Deployment Checklist for GitHub & Netlify

## ✅ Pre-Deployment Checklist

### 1. Security - Remove Hardcoded Credentials

- [x] Removed hardcoded Supabase URL and keys from `netlify/functions/save-attendance.js`
- [x] `.env` file is in `.gitignore`
- [x] No API keys or passwords in committed files

### 2. Configuration Files

- [x] `netlify.toml` is configured correctly
- [x] `package.json` has correct dependencies
- [x] `.gitignore` includes `.env`, `node_modules`, `.netlify`

### 3. Environment Variables Setup

You'll need to set these in Netlify dashboard after deployment:

- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service_role key
- [ ] `GOOGLE_API_KEY` - Your Google Sheets API key (if not hardcoded)

## 📋 Step-by-Step Deployment

### Step 1: Prepare Repository

1. **Review files to commit:**

   ```bash
   git status
   ```

2. **Make sure these are NOT committed:**

   - `.env` file
   - `node_modules/` folder
   - Any files with hardcoded credentials

3. **Add files to git:**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   ```

### Step 2: Push to GitHub

1. **If you haven't created a GitHub repo yet:**

   ```bash
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/yourusername/absence_list.git
   git branch -M main
   git push -u origin main
   ```

2. **If repo already exists:**
   ```bash
   git push origin main
   ```

### Step 3: Deploy to Netlify

1. **Go to Netlify Dashboard:**

   - Visit https://app.netlify.com
   - Sign in with your GitHub account

2. **Import your site:**

   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" and authorize Netlify
   - Choose your `absence_list` repository

3. **Configure build settings:**

   - **Build command:** (leave empty - no build needed)
   - **Publish directory:** `.` (root directory)
   - Click "Deploy site"

4. **Set Environment Variables:**

   - Go to Site settings → Environment variables
   - Add these variables:
     ```
     SUPABASE_URL = https://bfhkzqbztkyojvbhkxzg.supabase.co
     SUPABASE_SERVICE_ROLE_KEY = eyJ...your-service-role-key...
     ```
   - Click "Save"

5. **Redeploy (if needed):**
   - After adding environment variables, go to "Deploys" tab
   - Click "Trigger deploy" → "Clear cache and deploy site"

### Step 4: Configure Site Settings

1. **Update site URL in `index.html` (optional):**

   - After deployment, you can update `APPS_SCRIPT_URL` to use your Netlify URL:

   ```javascript
   APPS_SCRIPT_URL: "https://your-site.netlify.app/.netlify/functions/save-attendance";
   ```

   - Or keep it as `'/.netlify/functions/save-attendance'` (works on same domain)

2. **Set up password protection (optional):**
   - Go to Site settings → Access control
   - Enable password protection (Netlify Pro/Team feature)
   - Or keep using the JavaScript password in `index.html`

### Step 5: Test Your Deployment

1. **Visit your site:**

   - Go to your Netlify site URL (e.g., `https://your-site.netlify.app`)

2. **Test the functionality:**

   - [ ] Password protection works
   - [ ] Kids list loads from Google Sheets
   - [ ] Attendance toggles work
   - [ ] Save function works (check Supabase database)
   - [ ] Statistics update correctly

3. **Check function logs:**
   - Go to Functions tab in Netlify dashboard
   - Check logs for any errors

## 🔧 Troubleshooting

### Functions not working

- Check environment variables are set correctly
- Verify function logs in Netlify dashboard
- Make sure `netlify/functions/save-attendance.js` exists

### Environment variables not loading

- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- Verify no typos in variable values

### CORS errors

- Functions should work automatically on Netlify
- Check function logs for errors
- Verify Supabase credentials are correct

## 📝 Post-Deployment

After successful deployment:

1. **Update documentation:**

   - Note your Netlify site URL
   - Document any custom configurations

2. **Set up custom domain (optional):**

   - Go to Domain settings
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Enable HTTPS (automatic):**
   - Netlify provides free SSL certificates automatically
   - Your site will be available at `https://your-site.netlify.app`

## 🎉 You're Done!

Your attendance tracker is now live on Netlify!
