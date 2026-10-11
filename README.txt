UJJAIN OMKARESHWAR TRAVELLER
No-Supabase Admin Demo

1. Open index.html in Chrome, or use VS Code Live Server.
2. Click Owner / Admin.
3. Demo credentials are configured in admin-config.js.
   Email: owner@gmail.com
   Password: admin123
4. To change them, edit admin-config.js.

IMPORTANT SECURITY NOTE
This version intentionally has NO Supabase. Data is stored in the browser localStorage. The admin password is also part of the frontend, so this is suitable for local/demo testing only, not for a real production admin panel.

For production with real email OTP password reset, move the site to PHP + MySQL hosting and add a server-side admin login, password hashing, sessions, rate limiting, CSRF protection, and SMTP/transactional email OTP.


V24 PREMIUM THEME UPDATE
- Added premium burgundy / ivory / antique-gold theme inspired by boutique hospitality design.
- Existing section IDs and JavaScript are retained.
- Default call / WhatsApp / SMS number updated to 9827430197.
- This package is still a static/localStorage version: Supabase shared database and Storage are NOT connected yet.
- Admin credentials in admin-config.js are demo-only and not secure for public production use.
