# Deployment Guide

## Cloudflare Pages Setup

### 1. Create 4 Cloudflare Pages Projects

| Project Name | Root Directory | Custom Domain |
|--------------|---------------|---------------|
| `savebook` | `/hub` | savebook.net |
| `fh6guide` | `/fh6guide` | fh6.savebook.net |
| `dead-as-disco` | `/dead-as-disco` | disco.savebook.net |
| `subnautica2` | `/subnautica2` | subnautica2.savebook.net |

### 2. Setup GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |

To create API token:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **My Profile → API Tokens**
3. Create a **Custom token** with:
   - **Account Permissions**: `Cloudflare Pages: Edit`
   - **Zone Permissions**: (select your domains)

### 3. Manual Cloudflare Pages Configuration

For each project (`savebook`, `fh6guide`, `dead-as-disco`, `subnautica2`):

1. Go to **Cloudflare Dashboard → Workers & Pages**
2. Create new project → Connect to GitHub
3. Configure:
   - **Build command**: `npm run build`
   - **Build output directory**: (see table above)
   - **Environment variables**: None needed

### 4. Deploy

Just push to `main` branch:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/savebook.git
git push -u origin main
```

GitHub Actions will automatically build and deploy all 4 sites.

---

## Local Development

```bash
npm install
npm run dev     # Start dev server on localhost:3000
npm run build   # Build for production
```

## Site URLs

| Site | Dev Server | Production |
|------|-----------|------------|
| Hub | http://localhost:3000/ | https://savebook.net |
| FH6Guide | http://localhost:3000/fh6guide/ | https://fh6.savebook.net |
| Dead As Disco | http://localhost:3000/dead-as-disco/ | https://disco.savebook.net |
| Subnautica2 | http://localhost:3000/subnautica2/ | https://subnautica2.savebook.net |