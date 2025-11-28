# Quick Netlify Deployment Guide

## Step-by-Step Deployment

### 1. Prepare Your Code

1. Make sure you've configured `index.html` with your:
   - Google Spreadsheet IDs
   - Google API Key
   - Password
   - Google Apps Script URL

2. Commit all files to a Git repository (GitHub, GitLab, or Bitbucket)

### 2. Deploy to Netlify

#### Method 1: Via Netlify Dashboard (Easiest)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign in or create an account
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose your Git provider (GitHub, GitLab, or Bitbucket)
5. Select your repository
6. Configure build settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `.` (dot = root directory)
7. Click **"Deploy site"**
8. Wait for deployment to complete
9. Your site will be live at `https://your-site-name.netlify.app`

#### Method 2: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize (first time only)
netlify init

# Deploy
netlify deploy --prod
```

#### Method 3: Drag & Drop

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag and drop your project folder onto the deploy area
3. Your site will be live immediately!

### 3. Set Up Password Protection (Recommended)

Netlify offers built-in password protection (available on Pro/Team plans):

1. Go to your site dashboard
2. Navigate to **Site settings** → **Access control**
3. Enable **"Password protection"**
4. Set a password
5. Save

**Note:** If you're on the free plan, the JavaScript-based password protection in the app will still work.

### 4. Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to configure your domain

### 5. Environment Variables (Optional)

If you want to keep sensitive data out of your code:

1. Go to **Site settings** → **Environment variables**
2. Add variables (though for static sites, these won't be accessible in client-side JS without a build step)
3. For this project, keep configuration in the `CONFIG` object in `index.html`

## Continuous Deployment

Once connected to Git, Netlify will automatically:
- Deploy when you push to your main branch
- Create preview deployments for pull requests
- Show deployment status in your Git repository

## Troubleshooting

### Site not loading
- Check that `index.html` is in the root directory
- Verify build settings (publish directory should be `.`)

### Password protection not working
- If using Netlify's password protection, ensure it's enabled in Site settings
- If using JavaScript password, check the `CONFIG.PASSWORD` value in `index.html`

### Google Sheets API errors
- Verify your API key is correct
- Check that Google Sheets API is enabled
- Ensure spreadsheets are accessible (shared if needed)

## Next Steps

1. Test your deployment
2. Set up password protection
3. Configure your custom domain (optional)
4. Share the link with your team!

For more help, visit [Netlify Docs](https://docs.netlify.com/)

