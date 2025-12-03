# Favicon and PWA Icon Setup

This guide explains how to generate proper favicon and PWA icons from the `fcb-logo.png` file.

## Quick Setup (Using Existing Logo)

The app is already configured to use `fcb-logo.png` as the favicon. For basic functionality, this works, but for optimal PWA support, you should generate proper icon sizes.

## Generate Optimized Icons

### Option 1: Using the Script (Recommended)

1. Install dependencies:

   ```bash
   npm install sharp
   ```

2. Run the generation script:

   ```bash
   node generate-icons.js
   ```

3. This will create:
   - `favicon-16x16.png` - Standard favicon
   - `favicon-32x32.png` - Standard favicon
   - `icon-192.png` - PWA icon (192x192)
   - `icon-512.png` - PWA icon (512x512)

### Option 2: Manual Generation

Use an online tool or image editor to create these sizes from `fcb-logo.png`:

- **16x16** - `favicon-16x16.png`
- **32x32** - `favicon-32x32.png`
- **192x192** - `icon-192.png` (PWA icon)
- **512x512** - `icon-512.png` (PWA splash screen)

### Option 3: Online Tools

You can use online favicon generators:

- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

Upload `fcb-logo.png` and download the generated icons.

## Files Already Configured

- ✅ `manifest.json` - PWA manifest with icon references
- ✅ `index.html` - Favicon and PWA meta tags
- ✅ Fallback to `fcb-logo.png` if optimized icons don't exist

## Testing

1. **Favicon**: Check browser tab - should show the logo
2. **PWA**:
   - Open on mobile device
   - "Add to Home Screen" option should appear
   - Icon should appear on home screen
   - Splash screen should show on app launch

## Current Configuration

The app will work with just `fcb-logo.png`, but for best results:

- Generate the optimized sizes using the script
- Ensure all icon files are in the root directory
- Deploy all files to your hosting

## Notes

- The logo will be automatically resized and centered
- Background is transparent (preserves logo appearance)
- Icons are optimized for both web and mobile PWA
