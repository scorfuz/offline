# Railway Deployment Guide for base-template API

## Prerequisites

- Railway account: https://railway.app
- Railway CLI installed: `npm install -g @railway/cli`
- Cloudflare account (you have this)
- DreamHost domain (you have this)

## Step 1: Prepare Your API for Railway

### 1.1 Create railway.toml

This file tells Railway how to build and run your API:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node dist/main.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
```

### 1.2 Create Procfile (alternative to railway.toml)

```
web: node dist/main.js
```

### 1.3 Verify Build Output

Your `package.json` already has the right build script:

```json
"build": "rm -rf dist && tsc -p tsconfig.json"
```

The API already has a health check endpoint at `/health` that Railway will use.

## Step 2: Add Health Check Endpoint

Railway needs a health check endpoint. Let's add one:

✅ **Already implemented** - The health endpoint exists at `/health` in `src/server.ts`.

## Step 3: Set Up Environment Variables

You'll need these secrets in Railway dashboard:

| Variable               | Description                            | Example                               |
| ---------------------- | -------------------------------------- | ------------------------------------- |
| `DATABASE_URL`         | Postgres connection string             | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET`   | Auth secret (generate new)             | `openssl rand -hex 32`                |
| `POWERSYNC_JWT_SECRET` | PowerSync JWT secret (generate new)    | `openssl rand -hex 32`                |
| `NODE_ENV`             | Environment                            | `production`                          |
| `PORT`                 | Port (Railway sets this automatically) | `${PORT}`                             |

**Generate secrets:**

```bash
openssl rand -hex 32  # For BETTER_AUTH_SECRET
openssl rand -hex 32  # For POWERSYNC_JWT_SECRET
```

## Step 4: Deploy to Railway

### 4.1 Login to Railway

```bash
cd apps/api
railway login
```

### 4.2 Create Project

```bash
railway init
# Choose:
# - Create a new project
# - Name it: base-template-api
```

### 4.3 Add Postgres Database

```bash
railway add
# Select: Database → Postgres
```

Railway will automatically add `DATABASE_URL` to your environment.

### 4.4 Add Environment Variables

```bash
railway variables set BETTER_AUTH_SECRET=your-secret-here
railway variables set POWERSYNC_JWT_SECRET=your-secret-here
railway variables set NODE_ENV=production
```

### 4.5 Deploy

```bash
railway up
```

Railway will:

1. Build your TypeScript (`npm run build`)
2. Start the server (`node dist/main.js`)
3. Run health checks

### 4.6 Get Your URL

```bash
railway domain
# Outputs: https://base-template-api-production.up.railway.app
```

## Step 5: Configure Cloudflare DNS

### 5.1 Add Domain to Railway (Optional but recommended)

```bash
railway domain add api.yourdomain.com
```

### 5.2 Configure Cloudflare

1. Log into Cloudflare dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Add a CNAME record:
   - **Type:** CNAME
   - **Name:** `api` (or `api.yourdomain.com`)
   - **Target:** `base-template-api-production.up.railway.app`
   - **Proxy status:** 🟡 DNS only (grey cloud) - **IMPORTANT!**

   > ⚠️ **Don't enable the orange cloud proxy yet!** Railway needs to verify the domain first.

### 5.3 Verify Domain

Wait a few minutes for DNS propagation, then:

```bash
curl https://api.yourdomain.com/api/health
```

### 5.4 Enable Cloudflare Proxy (Optional)

Once working, you can enable the orange cloud proxy for:

- DDoS protection
- SSL/TLS
- CDN caching (though API responses usually shouldn't be cached)

Go to Cloudflare → DNS → Toggle the cloud to 🟠 Proxied

## Step 6: Update PowerSync

Now update your PowerSync dashboard with the production URL:

**Token Endpoint URL:**

```
https://api.yourdomain.com/api/powersync/token
```

Or if using Railway's temporary URL:

```
https://base-template-api-production.up.railway.app/api/powersync/token
```

## Step 7: Verify Deployment

Test your endpoints:

```bash
# Health check
curl https://api.yourdomain.com/health

# PowerSync token endpoint (need valid session)
curl -X POST https://api.yourdomain.com/api/powersync/token \
  -H "Cookie: better-auth.session_token=your-session-token"
```

## Troubleshooting

### "Build failed"

Check the build logs in Railway dashboard. Common issues:

- Missing dependencies: Make sure `pg` is in dependencies (✓ you have this)
- TypeScript errors: Run `pnpm typecheck` locally first

### "Service unhealthy"

- Verify health check endpoint exists at `/health`
- Check logs: `railway logs`

### "Database connection failed"

- Verify `DATABASE_URL` is set
- Railway Postgres should auto-connect, but check the variable exists

### DNS not resolving

- CNAME record must be "DNS only" (grey cloud) initially
- Wait 5-10 minutes for propagation
- Check with: `dig api.yourdomain.com`

## Useful Railway Commands

```bash
railway logs                    # View logs
railway logs --tail             # Stream logs
railway up                      # Redeploy
railway variables               # List env vars
railway variables set KEY=VALUE # Add/update env var
railway status                  # Check service status
railway open                    # Open dashboard in browser
```

## Next Steps

Once deployed:

1. ✅ Run database migrations: `railway run npm run db:migrate`
2. ✅ Update PowerSync Cloud with production URL
3. ✅ Test sync streams with production database
4. ✅ Configure mobile app to use production API

## Resources

- Railway Node.js guide: https://docs.railway.app/guides/nodejs
- Railway + Postgres: https://docs.railway.app/databases/postgresql
- Railway CLI reference: https://docs.railway.app/reference/cli-api
