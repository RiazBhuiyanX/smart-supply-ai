# 🚀 Free Deployment Guide — SmartSupply AI

This guide walks you through deploying SmartSupply AI for **free** using:

| Component | Service | Free Tier |
|-----------|---------|-----------|
| **Frontend** | [Vercel](https://vercel.com) | Unlimited static sites |
| **Backend** | [Render](https://render.com) | 750 hrs/month web service |
| **Database** | [Render PostgreSQL](https://render.com) | 1 GB free database |

> [!NOTE]
> Free tiers have cold starts (backend may take ~30s to wake up after inactivity). This is normal for free hosting.

---

## Prerequisites

- A [GitHub](https://github.com) account with your code pushed to a repository
- A [Vercel](https://vercel.com) account (sign up with GitHub)
- A [Render](https://render.com) account (sign up with GitHub)

---

## Step 1: Push Code to GitHub

If you haven't already, push your project to GitHub:

```bash
cd d:\SAP\smart-supply-ai
git add .
git commit -m "Add deployment configuration"
git push origin main
```

---

## Step 2: Deploy the Database (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name:** `smartsupply-db`
   - **Database:** `smartsupply_db`
   - **User:** `smartsupply`
   - **Plan:** **Free**
4. Click **Create Database**
5. **Copy these values** from the database info page (you'll need them in Step 3):
   - `Internal Database URL` — looks like: `postgres://smartsupply:PASSWORD@HOST:5432/smartsupply_db`
   - `Hostname`, `Port`, `Username`, `Password`, `Database`

---

## Step 3: Deploy the Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your **GitHub repository** (`smart-supply-ai`)
4. Configure:
   - **Name:** `smartsupply-api`
   - **Root Directory:** `backend-java`
   - **Runtime:** **Docker**
   - **Plan:** **Free**
5. Add these **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST:PORT/smartsupply_db` (use the hostname from Step 2) |
   | `POSTGRES_USER` | `smartsupply` (from Step 2) |
   | `POSTGRES_PASSWORD` | Password from Step 2 |
   | `JWT_SECRET` | Any long random string (e.g., `mysupersecretkey123456789`) |
   | `CORS_ORIGINS` | Will be set after Step 4 (your Vercel URL) |
   | `GEMINI_API_KEY` | Your Gemini API key (optional, for AI features) |

6. Click **Create Web Service**
7. Wait for the build to complete (~5-10 minutes first time)
8. **Copy your backend URL** — it will look like: `https://smartsupply-api.onrender.com`

---

## Step 4: Deploy the Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. **Import** your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
5. Add this **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | Your Render backend URL from Step 3 (e.g., `https://smartsupply-api.onrender.com`) |

6. Click **Deploy**
7. **Copy your frontend URL** — it will look like: `https://smart-supply-ai.vercel.app`

---

## Step 5: Connect Frontend ↔ Backend (CORS)

Go back to your **Render backend service**:

1. Go to **Environment** tab
2. Set `CORS_ORIGINS` to your Vercel frontend URL:
   ```
   https://smart-supply-ai.vercel.app
   ```
3. Click **Save Changes** — the service will redeploy automatically

---

## ✅ You're Live!

Your app is now accessible at your Vercel URL (e.g., `https://smart-supply-ai.vercel.app`).

### Quick Verification

1. Open your Vercel URL in a browser
2. You should see the login page
3. Register a new account
4. Explore the Dashboard, Products, Inventory, etc.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend takes 30s+ to respond | Normal for free tier — Render sleeps after 15 min of inactivity |
| CORS errors in browser console | Make sure `CORS_ORIGINS` matches your exact Vercel URL (no trailing slash) |
| Database connection errors | Verify `SPRING_DATASOURCE_URL` uses `jdbc:postgresql://` prefix (not `postgres://`) |
| Frontend shows "Network Error" | Check that `VITE_API_URL` is set correctly in Vercel env vars, then **redeploy** |
| Build fails on Render | Check the build logs; ensure `Dockerfile` is in the `backend-java` directory |
