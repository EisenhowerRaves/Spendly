# Spendly – Setup and deployment

## Local development

### Vue frontend (recommended)

```bash
cd frontend
npm install
npm run dev
```

Opens the Vite dev server (typically **http://localhost:5173**). The app uses hash routing (`#/`) so refreshes work without server rewrites.

### Express backend (Gemini proxy)

The API key stays on the server only.

1. **Local:** In the **repository root** (the folder that contains `frontend/` and `server/`), copy `.env.example` to `.env` and set `GEMINI_API_KEY`. `server/server.js` loads environment variables from **`../.env`** (that root file).

2. **Railway:** Use the variable names in `server/.env.example` in the Railway dashboard (do not commit real secrets).

3. Start the backend:

```bash
cd server
npm install
npm start
```

Default URL: **http://localhost:3000**

4. Point the Vue app at the API (optional for local dev):

Create `frontend/.env.local` (not committed) with:

```env
VITE_API_URL=http://localhost:3000
```

If unset, the frontend defaults to `http://localhost:3000` for the Gemini chat endpoint (`/api/gemini`).

---

## Deploy frontend – GitHub Pages

The repo is configured for **https://eisenhowerraves.github.io/Spendly/** (`base: '/Spendly/'` in Vite, hash router for static hosting).

### Automatic deploy (recommended)

1. In the GitHub repo: **Settings → Pages → Build and deployment → Source:** use **GitHub Actions** (or deploy from the `gh-pages` branch if you use the included workflow that pushes there).
2. Push to **`main`**. The workflow in `.github/workflows/deploy.yml` runs `npm install` and `npm run build` in `frontend/` and publishes **`frontend/dist`** to GitHub Pages (via `peaceiris/actions-gh-pages@v3`).
3. After the workflow finishes, open **https://eisenhowerraves.github.io/Spendly/** and confirm the Vue app loads.

You do not need to run `npm run build` manually for CI; the Action builds on every push to `main`.

### Root `index.html` (optional)

For local `node server.js` serving the repo root, a built **Vue** `index.html` plus `assets/` may be copied to the repository root (see project history). A backup of the previous plain HTML app is kept as **`index-plain.html`**.

### Production API URL for the hosted site

GitHub Actions builds with env from the repo. Add **`frontend/.env.production`** (committed) with your Railway URL once the backend is live:

```env
VITE_API_URL=https://your-railway-app.up.railway.app
```

No trailing slash. Push to `main` so the workflow rebuilds with the production API URL.

---

## Deploy backend – Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select the **Spendly** repo.
3. Set the **root directory** to **`server/`** (or configure the service to run from that folder).
4. In the Railway dashboard, add environment variables (see `server/.env.example`):
   - **`GEMINI_API_KEY`** – your key from Google AI Studio (never commit the real value).
   - **`PORT`** – Railway usually sets this automatically; default is `3000` locally.
5. Deploy. Copy the **public HTTPS URL** Railway assigns (e.g. `https://your-app.up.railway.app`).
6. Put that URL in **`frontend/.env.production`** as **`VITE_API_URL`**, then push to `main` so GitHub Pages rebuilds the frontend.

`server/railway.json` configures Nixpacks build and `node server.js` as the start command. `server/package.json` includes `"start": "node server.js"`.

### CORS

The server allows origins including `https://eisenhowerraves.github.io` and local dev ports (`5173`, `5174`, `3000`). If you use another front-end origin, add it in `server/server.js` in the `cors` `origin` array.

---

## Gemini API key (security)

- Create keys in [Google AI Studio](https://aistudio.google.com/).
- Never commit real keys. Use `.env` locally, Railway env vars in production, and **`server/.env.example`** only as a template with empty values.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Chat says “AI unavailable” locally | Backend running (`npm start` in `server/`), `GEMINI_API_KEY` set, `VITE_API_URL` matches your API URL if overridden. |
| Chat fails on GitHub Pages | `VITE_API_URL` in `frontend/.env.production` matches Railway URL; Railway has `GEMINI_API_KEY`; CORS includes `https://eisenhowerraves.github.io`. |
| 404 on refresh on GitHub Pages | App should use **hash** history (`#/`) — already configured in `frontend/src/router/index.js`. |

---

## Legacy: Vercel / plain HTML

Older instructions referred to `expense-tracker.html` and Vercel. The current primary UI is the **Vue** app in `frontend/`. The backup **`index-plain.html`** preserves the previous static HTML shell if you need it for reference.
