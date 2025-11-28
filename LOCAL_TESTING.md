# Local Testing Guide

## The Problem

When you use a simple HTTP server (like `http-server` or `python -m http.server`), Netlify Functions won't work. You'll get a `501 Unsupported method ('POST')` error because these servers don't understand serverless functions.

## Solution: Use Netlify Dev

Netlify Functions only work when:

1. **Running locally with `netlify dev`** (recommended for testing)
2. **Deployed to Netlify** (for production)

## Setup for Local Testing

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

Or install locally:

```bash
npm install --save-dev netlify-cli
```

### 2. Create Environment Variables File

Create a `.env` file in the project root:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJ...your-anon-key-here...
```

**Important:** Add `.env` to your `.gitignore` file to keep your credentials safe!

### 3. Start Netlify Dev

```bash
npm run dev
```

Or directly:

```bash
netlify dev
```

This will:

- Start a local server (usually on port 8888)
- Load your environment variables from `.env`
- Make Netlify Functions work locally
- Automatically reload when you make changes

### 4. Access Your App

Open your browser to: `http://localhost:8888`

The Netlify Functions will now work at: `http://localhost:8888/.netlify/functions/save-attendance`

## Alternative: Test After Deployment

If you don't want to set up local testing, you can:

1. Deploy to Netlify
2. Set environment variables in Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add `SUPABASE_URL` and `SUPABASE_KEY`
3. Test on the live site

## Troubleshooting

### "Command not found: netlify"

- Install Netlify CLI: `npm install -g netlify-cli`

### "Cannot find module '@supabase/supabase-js'"

- Install dependencies: `npm install`

### Functions still not working

- Make sure you're using `netlify dev`, not `http-server`
- Check that your `.env` file exists and has the correct variables
- Verify the function file is at `netlify/functions/save-attendance.js`
