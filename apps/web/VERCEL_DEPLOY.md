# Vercel Deployment Guide for base-template Web

## Prerequisites

- Vercel account: https://vercel.com
- Vercel CLI installed: `npm install -g vercel`
- Railway API deployed (you have this)

## Quick Deploy

### 1. Login to Vercel

```bash
cd apps/web
vercel login
```

### 2. Link and Deploy

```bash
vercel
# Choose:
# - Set up "apps/web"
# - Link to existing project or create new
# - Name it: base-template-web
```

### 3. Set Environment Variables

In Vercel dashboard or via CLI:

```bash
vercel env add VITE_API_ORIGIN
# Enter your Railway API URL:
# https://base-template-api-production.up.railway.app
```

Or set directly:

```bash
vercel env add VITE_API_ORIGIN https://your-api.up.railway.app
```

### 4. Redeploy with Environment

```bash
vercel --prod
```

## Environment Variables

| Variable          | Required | Description          |
| ----------------- | -------- | -------------------- |
| `VITE_API_ORIGIN` | ✅ Yes   | Your Railway API URL |

Example:

```
VITE_API_ORIGIN=https://base-template-api-production.up.railway.app
```

## Build Configuration

Vercel auto-detects the build settings, but if needed:

**Build Command:**

```bash
pnpm build
```

**Output Directory:**

```
.output
```

**Install Command:**

```bash
pnpm install
```

These are already configured via the standard TanStack Start + Nitro setup.

## Troubleshooting

### "Cannot find module" errors

Make sure you're deploying from `apps/web` directory, not repo root.

### API calls failing (CORS)

Update your Railway API's `WEB_ORIGIN` to match your Vercel domain:

```bash
cd apps/api
railway variables set WEB_ORIGIN=https://your-web.vercel.app
```

Or use wildcard for development:

```bash
railway variables set WEB_ORIGIN=*
```

### Build fails

Check that `VITE_API_ORIGIN` is set:

```bash
vercel env ls
```

## Domain Setup (Optional)

To use your DreamHost domain with Vercel:

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add your domain: `app.yourdomain.com`
   - Vercel will provide DNS records

2. **In Cloudflare/DreamHost:**
   - Add the CNAME record Vercel provides
   - Point `app` subdomain to `cname.vercel-dns.com`

3. **Wait for propagation:**
   - Vercel will verify automatically
   - SSL certificate auto-provisioned

## Useful Vercel Commands

```bash
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel env ls            # List environment variables
vercel env add KEY       # Add environment variable
vercel logs              # View logs
vercel open              # Open dashboard
```

## Next Steps

Once deployed:

1. ✅ Test the web app loads
2. ✅ Test login works (calls Railway API)
3. ✅ Update Cloudflare DNS if using custom domain
4. ✅ Update Railway API's WEB_ORIGIN to match Vercel domain

## Resources

- TanStack Start on Vercel: https://tanstack.com/start/latest/docs/framework/react/deployment
- Vercel CLI reference: https://vercel.com/docs/cli
