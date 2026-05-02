# MyRecipeBox — Setup Guide #

## What you need (all free)
- GitHub account: github.com
- Vercel account: vercel.com
- Supabase account: supabase.com

---

## Step 1 — Supabase Setup (~10 min)

1. Go to supabase.com and create a new project
2. Once created, click **SQL Editor** in the left sidebar
3. Paste the contents of `supabase-setup.sql` and click **Run**
4. Go to **Project Settings → API**
5. Copy your **Project URL** and **anon public key** — you'll need these in Step 3

---

## Step 2 — GitHub Setup (~5 min)

1. Go to github.com and create a new repository called `myrecipebox`
2. Upload all files from this folder to the repository
   - Click **uploading an existing file** on the new repo page
   - Drag and drop the entire `myrecipebox` folder contents
   - Click **Commit changes**

---

## Step 3 — Add Supabase Keys (~2 min)

In your GitHub repo, you need to add your Supabase keys as environment variables in Vercel (NOT in the code).

When you connect Vercel in Step 4, add these environment variables:
- `VITE_SUPABASE_URL` = your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key

---

## Step 4 — Vercel Deployment (~5 min)

1. Go to vercel.com and click **Add New Project**
2. Connect your GitHub account and select the `myrecipebox` repository
3. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = paste your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = paste your Supabase anon key
4. Click **Deploy**
5. Vercel builds and deploys — takes about 30 seconds
6. You get a live URL like `myrecipebox-yourname.vercel.app`

---

## Step 5 — Install on Your Phone (~2 min)

**iPhone (Safari):**
1. Open your Vercel URL in Safari
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap Add — it installs like a real app

**Android (Chrome):**
1. Open your Vercel URL in Chrome
2. Tap the three dots menu
3. Tap **Add to Home Screen**

---

## Step 6 — Updating the App

When we add new recipes or make changes:
1. Claude gives you an updated file
2. Go to your GitHub repo in a browser
3. Click the file → click the pencil (edit) icon
4. Select all, paste the new code
5. Click **Commit changes**
6. Vercel auto-deploys in ~30 seconds
7. Refresh the app — done

---

## File Structure

```
myrecipebox/
├── index.html          — App entry point
├── package.json        — Dependencies
├── vite.config.js      — Build config
├── supabase-setup.sql  — Run this in Supabase once
├── .env.example        — Copy to .env for local dev
├── public/
│   └── manifest.json   — PWA config (home screen icon)
└── src/
    ├── main.jsx        — React entry point
    ├── index.css       — Global styles
    ├── App.jsx         — Main app (all components)
    ├── supabase.js     — Database connection
    ├── recipes.js      — All hardcoded recipes
    └── pantry.js       — Pantry defaults + fuzzy matching
```

---

## Local Development (optional)

If you want to test changes before deploying:

1. Install Node.js from nodejs.org
2. Copy `.env.example` to `.env` and fill in your Supabase keys
3. Open terminal in the `myrecipebox` folder and run:
   ```
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser
5. Changes appear instantly as you edit files
