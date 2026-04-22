# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for Hillview Group, Inc. (web design agency for trade businesses), hosted on **Azure Static Web Apps** with serverless **Azure Functions** as the API layer.

## Development Commands

### Frontend
The site requires no build step. Use VS Code Live Server on **port 5501** to serve HTML files locally.

### Azure Functions (primary backend)
```bash
cd hillview-functions
npm install
func start          # starts local Azure Functions host on port 7071
```

### Express Server (secondary backend)
```bash
cd hillview-backend
npm install
npm run dev         # nodemon watch mode
npm start           # production mode
```

### Environment Setup
Copy/create `hillview-functions/local.settings.json` with:
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — SQL Server connection
- `DB_ENCRYPT`, `DB_TRUST_CERT` — SQL Server TLS settings
- `SMTP_*` — Gmail SMTP credentials for Nodemailer
- `RECAPTCHA_SECRET` — Google reCAPTCHA v3 secret
- `SESSION_SECRET` — Express session secret
- `CORS_ORIGIN` — Allowed frontend origin

## Architecture

```
/                           # Static HTML pages (9 files, served as-is)
/styles/                    # Per-page CSS files (styles.css is global)
/js/                        # Vanilla JS modules
/hillview-functions/        # Azure Functions API (PRIMARY backend)
  src/functions/            # 10 serverless function handlers
  src/functions/_shared.js  # CORS headers, DB connection pool helper
  src/functions/_mockData.js# In-memory fallback when DB is unavailable
/hillview-backend/          # Express server (SECONDARY/backup backend)
```

**Frontend**: Plain HTML/CSS/JS — no framework, no bundler. Lucide icons loaded via CDN. Google Analytics (G-L5KS62FEBM) + Microsoft Clarity (w2c83gvy0c) on all pages.

**API**: Azure Functions v4 (Node.js runtime ~4). All functions share CORS config and DB pool via `_shared.js`. If SQL Server is unreachable, APIs fall back to `_mockData.js` mock articles automatically.

**Database**: SQL Server (`mssql` v12). Database name defaults to `HillviewBlog`. Schema contains an articles table used for the blog/admin system.

**Auth**: Session-based via `express-session`. `login.js` / `logout.js` / `checkSession.js` guard the admin blog panel (`admin-blog.html`).

**Contact form**: reCAPTCHA v3 validation → Nodemailer sends both an admin notification and a customer confirmation email.

## Deployment

Push to any branch triggers GitHub Actions (`.github/workflows/azure-static-web-apps-orange-sea-03d42eb0f.yml`):
- Static files are deployed from `/` (root)
- Azure Functions are deployed from `./hillview-functions`
- PRs get preview environments automatically; merging to `main` deploys to production

## Dual Backend Note

Both `hillview-functions/` and `hillview-backend/` implement the same API contract. Azure Functions is the deployed/production backend. The Express server in `hillview-backend/` appears to be a legacy or migration artifact — prefer editing `hillview-functions/` for any API changes.
