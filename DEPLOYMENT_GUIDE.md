# 🚀 Deployment Guide - Shubh Consultancy Services

## Current deployment status

**Current:** static export with `output: 'export'`, build-time public pages, and browser localStorage fallback.

**Target:** Render Node Web Service + Render PostgreSQL + server-side authentication + object storage + Next.js Node runtime.

The target infrastructure is not considered live until Render resources, secrets, migrations, authentication, and dynamic route checks have been completed. Do not run database migrations with a placeholder URL.

## Render configuration

Use a Render **Web Service** with Node 20 or newer.

| Setting | Value |
| --- | --- |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Node version | `20` or newer; pin with `NODE_VERSION=20` if required by the service |
| Health check | `/api/health` after Node runtime activation |
| Database migration | `npm run db:migrate:deploy` as a controlled deploy/release step |

The health route currently returns a static-export-compatible JSON response. When the runtime is activated, remove `dynamic = 'force-static'` from `app/api/health/route.ts` so Render receives a live request. It exposes only status, runtime label, database-configured boolean, and provider name; it never returns secrets.

## Environment variables

Configure these in Render's server environment, never in `NEXT_PUBLIC_*` variables:

| Variable | Required when | Example value |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL/repository enabled | Render-provided PostgreSQL URL; never commit it |
| `AUTH_SECRET` | Server sessions enabled | Generated random secret; never commit it |
| `AI_PROVIDER` | Always; use `mock` in development | `mock` or `openai` |
| `OPENAI_API_KEY` | Only when `AI_PROVIDER=openai` | Server secret; blank in mock mode |
| `APP_URL` | Server auth, canonical URLs, and callbacks | `https://your-domain.example` |
| `STORAGE_BUCKET` | Object storage enabled | Provider bucket name |
| `STORAGE_ENDPOINT` | Object storage enabled | Provider endpoint |
| `CONTENT_REPOSITORY` | Database mode enabled | `database` |
| `AI_JOB_BATCH_SIZE` | Batch generation tuning | `25` |
| `AI_MAX_ATTEMPTS` | Job retry limit | `3` |

Production must fail closed if `CONTENT_REPOSITORY=database` and `DATABASE_URL` is missing. Real AI must remain disabled if `AI_PROVIDER=openai` and `OPENAI_API_KEY` is missing. Development defaults to the mock provider.

## Safe activation sequence

1. Create the Render PostgreSQL instance.
2. Obtain its real `DATABASE_URL` from Render.
3. Add `DATABASE_URL` as a Render secret.
4. Deploy the application dependencies.
5. Run `npm run db:migrate:deploy` against that intentionally provisioned database.
6. Run `npm run admin:create` interactively on a secure server shell.
7. Configure `AUTH_SECRET` and activate server-side HTTP-only sessions.
8. Set `AI_PROVIDER=mock`, or configure `AI_PROVIDER=openai` and `OPENAI_API_KEY` together.
9. Configure object storage before enabling uploads.
10. Remove `output: 'export'` deliberately and enable dynamic database routes.
11. Deploy the Render Node service with `npm run build` and `npm start`.
12. Verify `/api/health`, admin login, Service Builder draft persistence, preview, publish, public dynamic pages, sitemap, robots, and rollback.

Do not run steps 5 through 12 from this unprovisioned workspace.

## Option 1: Shared Hosting (GoDaddy, Hostinger, Bluehost)

### Step-by-Step:

1. **Install Node.js locally** (Download from nodejs.org)
   ```bash
   node --version  # Should show v18+
   npm --version
   ```

2. **Navigate to project**
   ```bash
   cd d:\laragon\www\shubh-consultancy-services
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build for production (Static HTML)**
   ```bash
   npm run build
   ```
   ✅ This creates an `out/` folder with static files

5. **Upload to hosting via FTP**
   - Connect with FileZilla or hosting control panel
   - Upload contents of `out/` folder to `public_html/` or `www/`
   - Ensure `index.html` is in root directory

6. **Done!** Site live at `https://yourdomain.com`

---

## Option 2: Node.js Hosting (Recommended)

For the future CMS architecture, use this Node deployment path rather than uploading the static `out/` folder. The CMS target is Render Node + managed PostgreSQL. The current project remains static until the database, authentication, and server-runtime work is provisioned.

### Render.com (Free + Paid)

1. **Signup** at render.com

2. **Connect GitHub**
   - Push this repo to GitHub
   - Create at render.com → "New" → "Web Service"
   - Connect your GitHub repo

3. **Configure**
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Add `NODE_VERSION=20`

4. **Deploy** - Render auto-deploys on git push

### CMS production requirements

Before enabling CMS runtime behavior:

1. Provision managed PostgreSQL and set `DATABASE_URL` as a server-only secret.
2. Install Prisma and run `prisma migrate deploy` from the deployment environment.
3. Run `npm run admin:create` interactively on the server to create the first administrator; the password is hashed server-side and is never logged or stored in source control.
4. Remove `output: 'export'` deliberately and verify dynamic public routes.
5. Configure `AUTH_SECRET` and implement HTTP-only session handling before exposing `/admin`.
6. Configure object storage variables for media. Do not store large files in PostgreSQL.
7. Implement and test the database repository, server-side auth, protected previews, dynamic sitemap, and publish transaction before switching DNS.

For large content operations, use the paginated repository and create at most `AI_JOB_BATCH_SIZE` jobs per admin batch (default 25). Run generation through a worker or bounded server task; never make one request generate hundreds of pages and never enable automatic publishing. Failed jobs may be retried only while their attempt count is below `AI_MAX_ATTEMPTS`.

### Railway.app (Similar process)

1. Signup at railway.app
2. "Create Project" → "Deploy from GitHub"
3. Select repo and deploy

---

## Option 3: Vercel (Easiest for Next.js)

If you change your mind - Vercel is simplest:

1. Go to vercel.com
2. "Import Project" → Select GitHub repo
3. Click Deploy
4. Done in 30 seconds! ✅

---

## File Checklist Before Deploy:

- ✅ `next.config.mjs` has `output: 'export'`
- ✅ All images have `unoptimized: true`
- ✅ No dynamic API routes used
- ✅ `npm run build` runs without errors
- ✅ `.out/` folder generated successfully

---

## Troubleshooting:

**Build fails?**
```bash
# Clear cache
rm -r .next
rm -r out
npm run build
```

**Images not loading?**
- Ensure images in `/public` folder
- Check image paths are relative to `/public`

**Styles broken?**
- Tailwind CSS is pre-built into static files
- No runtime styles needed

---

## Post-Deployment:

1. **Domain Setup**
   - Point your domain to hosting provider DNS
   - Update `NEXT_PUBLIC_SITE_URL` in `.env.local`

2. **SSL Certificate**
   - Most hosts auto-enable HTTPS
   - Verify green lock in browser

3. **Monitor**
   - Check browser console for errors
   - Test all links and forms

---

**Questions? DM for help!**
