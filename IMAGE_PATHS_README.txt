IMAGE PATH FIX — ROOT-LEVEL IMAGES

This package is configured for a GitHub repository where image files are stored in the repository root (same level as index.html), NOT inside an images/ folder.

Upload/replace these website files in the root: index.html, script.js, style.css, premium-theme.css, admin-config.js. Keep all image files in the same root level as index.html.

The JavaScript strips a legacy "images/" prefix from saved local photo paths and uses root-relative filenames. The site still uses localStorage for admin edits; this package DOES NOT connect Supabase or sync admin changes across customers.

IMPORTANT: admin-config.js is a client-side demo login only and is not secure for production. Do not rely on it for a real public admin panel.
