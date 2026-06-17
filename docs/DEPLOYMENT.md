# FURPMS Backend — Deployment Guide

## Base API URL (Production)

```
https://furpms-api-production.up.railway.app/api
```

> **Note:** Railway generates the URL after first deploy. Replace the placeholder above with the actual URL from Railway Dashboard → your service → Settings → Domains.

---

## Architecture

```
GitHub (master branch)
    │
    ▼
Railway (auto-deploy on push)
    │
    ├── Docker Build (Dockerfile — multi-stage)
    │       Stage 1: node:20-alpine  →  tsc compile
    │       Stage 2: node:20-alpine  →  prod deps only + dist/
    │
    └── Container runs: node dist/server.js
            PORT assigned by Railway
            Health check: GET /health
```

---

## Pre-Deployment Checklist

### 1 — MongoDB Atlas

1. Create a **free M0 cluster** at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Database Access** → Add Database User
   - Username: `furpms-prod`
   - Password: (generate strong password, save it)
   - Role: `readWriteAnyDatabase`
3. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Railway IPs are dynamic, so this is required
4. **Connect** → Drivers → Node.js → Copy the connection string
   ```
   mongodb+srv://furpms-prod:<password>@cluster0.xxxxx.mongodb.net/furpms?retryWrites=true&w=majority
   ```
5. Enable **Atlas Vector Search** (for AI semantic search):
   - Atlas Search → Create Index → JSON Editor → Collection: `proposals`
   ```json
   {
     "mappings": {
       "dynamic": true,
       "fields": {
         "embedding": {
           "dimensions": 768,
           "similarity": "cosine",
           "type": "knnVector"
         }
       }
     }
   }
   ```

### 2 — Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Dashboard → Copy: **Cloud Name**, **API Key**, **API Secret**

### 3 — Google Gemini API

1. Go to [aistudio.google.com](https://aistudio.google.com) → Get API key
2. Copy the key

### 4 — Gmail SMTP (App Password)

1. Google Account → Security → 2-Step Verification → **App Passwords**
2. Generate password for "Mail / Other (Custom name)"
3. Copy the 16-character password

### 5 — JWT Secrets

Generate two secrets (run locally):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run twice — one for `JWT_ACCESS_SECRET`, one for `JWT_REFRESH_SECRET`.

---

## Railway Deployment Steps

### Step 1 — Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Authorize Railway to access your repository
4. Select the repo: `FURPMS` (or whatever the GitHub repo name is)

### Step 2 — Configure Root Directory

Since the backend is in the `/backend` subdirectory:

1. In Railway → your service → **Settings** tab
2. **Build** section → **Root Directory**: `/backend`
3. Railway will look for `Dockerfile` inside `/backend`

### Step 3 — Set Environment Variables

Railway Dashboard → your service → **Variables** tab → Add all variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5068` |
| `APP_NAME` | `FURPMS` |
| `APP_URL` | *(set after domain is assigned — see Step 5)* |
| `FRONTEND_URL` | `https://furpms.vercel.app` *(update after frontend deploy)* |
| `MONGODB_URI` | `mongodb+srv://furpms-prod:<pass>@cluster0.xxxxx.mongodb.net/furpms?...` |
| `JWT_ACCESS_SECRET` | *(64-char hex string)* |
| `JWT_REFRESH_SECRET` | *(64-char hex string, different from above)* |
| `JWT_ACCESS_EXPIRY` | `86400` |
| `JWT_REFRESH_EXPIRY` | `604800` |
| `CLOUDINARY_CLOUD_NAME` | *(from Cloudinary dashboard)* |
| `CLOUDINARY_API_KEY` | *(from Cloudinary dashboard)* |
| `CLOUDINARY_API_SECRET` | *(from Cloudinary dashboard)* |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `your_email@gmail.com` |
| `SMTP_PASS` | *(16-char Gmail app password)* |
| `EMAIL_FROM` | `noreply@furpms.edu.vn` |
| `EMAIL_FROM_NAME` | `FURPMS System` |
| `GEMINI_API_KEY` | *(from Google AI Studio)* |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `200` |
| `LOG_LEVEL` | `info` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `BASE_DAILY_SALARY` | `1490000` |

> **Tip:** Railway also supports bulk import via `.env` file under the Variables tab.

### Step 4 — Deploy

1. Railway auto-deploys when you push to the connected branch
2. Manual deploy: **Deployments** tab → **Deploy Now**
3. Watch build logs — Docker build takes ~2-3 minutes on first run

### Step 5 — Assign Custom Domain

1. Railway → your service → **Settings** → **Domains**
2. Click **Generate Domain** → Railway assigns:
   ```
   https://furpms-api-production.up.railway.app
   ```
   (or a similar auto-generated URL)
3. Copy this URL and:
   - Update `APP_URL` Railway variable to match
   - Update `APP_URL` in the swagger config if different from placeholder

### Step 6 — Seed the Database

After first successful deploy, run the seed script once:

```bash
# From your local machine, with the Railway MONGODB_URI in .env:
cd backend
MONGODB_URI="<your-atlas-uri>" npm run seed
```

Or set up a one-time Railway job:
1. Railway → New Service → **Empty Service**
2. Add same env variables
3. Set start command: `node -e "require('./dist/database/seeders/index')"` *(after compiling)*

### Step 7 — Verify Deployment

```bash
# Health check
curl https://furpms-api-production.up.railway.app/health

# Expected:
# {"success":true,"message":"FURPMS API is running.","data":{"status":"healthy"},"errors":null}

# Swagger UI
open https://furpms-api-production.up.railway.app/swagger
```

---

## Environment Variables Reference

```env
# ── Core ─────────────────────────────────────────────────────
NODE_ENV=production          # "production" disables file logging, enables JSON logs
PORT=5068                    # Railway overrides this with $PORT automatically
APP_NAME=FURPMS
APP_URL=https://...          # Your Railway domain — used in Swagger & emails
FRONTEND_URL=https://...     # Vercel URL — used in CORS allowlist

# ── Database ─────────────────────────────────────────────────
MONGODB_URI=...              # Atlas connection string with credentials

# ── Auth ─────────────────────────────────────────────────────
JWT_ACCESS_SECRET=...        # Min 64 chars random hex
JWT_REFRESH_SECRET=...       # Min 64 chars random hex, DIFFERENT from access
JWT_ACCESS_EXPIRY=86400      # Seconds (1 day)
JWT_REFRESH_EXPIRY=604800    # Seconds (7 days)

# ── Storage ──────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ── Email ────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false            # true for port 465
SMTP_USER=...                # Gmail address
SMTP_PASS=...                # Gmail App Password (not your Gmail password)
EMAIL_FROM=...
EMAIL_FROM_NAME=FURPMS System

# ── AI ───────────────────────────────────────────────────────
GEMINI_API_KEY=...           # Google AI Studio key

# ── Rate Limiting ─────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200  # per IP per window

# ── Misc ──────────────────────────────────────────────────────
LOG_LEVEL=info
BCRYPT_SALT_ROUNDS=12
BASE_DAILY_SALARY=1490000    # VND, fallback if no FinancialConfig in DB
```

---

## Dockerfile Architecture

```
node:20-alpine (builder)
├── COPY package*.json
├── RUN npm ci                    ← all deps including devDeps
├── COPY src/ + tsconfig.json
└── RUN npm run build             ← outputs dist/

node:20-alpine (production)
├── COPY package*.json
├── RUN npm ci --omit=dev         ← production deps only (~60% smaller)
├── COPY --from=builder dist/
├── USER furpms (non-root)
├── EXPOSE 5068
├── HEALTHCHECK /health
└── CMD ["node", "dist/server.js"]
```

---

## API Endpoints Overview

All endpoints are prefixed with `/api`.

| Group | Base Path |
|---|---|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Academic Profiles | `/api/users/:id/profile` |
| Cycles | `/api/cycles` |
| Tracks | `/api/cycles/tracks` |
| Proposals | `/api/proposals` |
| Research Orders | `/api/research-orders` |
| Review Rounds | `/api/rounds` |
| Councils | `/api/councils` |
| Council Members | `/api/council-members` |
| Meetings | `/api/meetings` |
| Review Scoring | `/api/review-scoring` |
| Contracts | `/api/contracts` |
| Disbursements | `/api/disbursements` |
| Deliverables | `/api/deliverables` |
| Amendments | `/api/amendments` |
| Progress Reports | `/api/progress-reports` |
| Final Reports | `/api/final-reports` |
| Settlements | `/api/settlements` |
| Notifications | `/api/notifications` |
| Analytics | `/api/analytics` |
| AI Features | `/api/ai` |
| Admin | `/api/admin` |
| Master Data | `/api/budget-categories`, `/api/rubric-criteria`, etc. |

---

## Seed Accounts (after running seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@furpms.edu.vn` | `Admin@123456` |
| Staff | `staff@furpms.edu.vn` | `Staff@123456` |
| Faculty (PI) | `faculty@furpms.edu.vn` | `Faculty@123456` |
| ReviewCommittee | `reviewer@furpms.edu.vn` | `Reviewer@123456` |

---

## Swagger Documentation

```
https://furpms-api-production.up.railway.app/swagger
```

Raw OpenAPI JSON:
```
https://furpms-api-production.up.railway.app/swagger.json
```

---

## Monitoring & Logs

- **Railway Logs**: Railway Dashboard → your service → **Deployments** → click deployment → **View Logs**
- **Log format in production**: structured JSON (Winston `json()` format)
- **Health endpoint**: `GET /health` — used by Railway health check every 30s

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Build fails: `cannot find module` | Check `tsconfig.json` paths, ensure all imports use correct paths |
| `CORS error` from frontend | Add the Vercel preview URL to `FRONTEND_URL` variable |
| MongoDB connection timeout | Ensure `0.0.0.0/0` is in Atlas Network Access |
| 500 on AI routes | Verify `GEMINI_API_KEY` is set; check Railway logs |
| Rate limit errors during testing | Increase `RATE_LIMIT_MAX_REQUESTS` temporarily |
| Health check failing | Ensure `PORT` env var matches `EXPOSE` in Dockerfile |
