# Spendly – Secure Gemini API setup (step-by-step)

The Gemini API key is **no longer in the HTML file**. It lives only on the server. Follow one of the options below.

---

## Option A: Run the app locally (Node.js backend)

Use this when developing or running on your own machine.

### 1. Create a new Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/) → get or create an API key.
2. Do **not** put this key in any file that gets committed to git or sent to the browser.

### 2. Configure the key on your machine

- In the project root, copy the example env file and add your key:

  **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
  **macOS/Linux:**
  ```bash
  cp .env.example .env
  ```

- Edit `.env` and replace `your_gemini_api_key_here` with your real Gemini API key. Save the file.

### 3. Install and start the backend

```bash
cd server
npm install
npm start
```

You should see: `Spendly server running at http://localhost:3000`

### 4. Open the app in the browser

- Go to: **http://localhost:3000/expense-tracker.html**
- Use the app as usual. SpendlyBot requests go to your server, which calls Gemini with the key. The key never appears in the browser.

Important: open the app via that URL. Do not open `expense-tracker.html` as a file (`file://...`), or the chat will not be able to reach the API.

---

## Option B: Deploy to Vercel (free tier)

Use this to host the app on the web without running a server on your PC.

### 1. Create a new Gemini API key

Same as Option A – create a key in Google AI Studio and keep it secret.

### 2. Install Vercel CLI and log in (one-time)

```bash
npm i -g vercel
vercel login
```

### 3. Deploy the project

From the **project root** (where `expense-tracker.html` is):

```bash
vercel
```

Follow the prompts (link to existing project or create new). After deploy you get a URL like `https://your-project.vercel.app`.

### 4. Add the API key in Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Gemini API key
   - **Environment:** Production (and Preview if you want)
3. Save and **redeploy** the project (Deployments → … → Redeploy) so the new variable is applied.

### 5. Add the serverless API route (if not already present)

The repo includes an `api/gemini.js` serverless function. Vercel will expose it as `https://your-project.vercel.app/api/gemini`. The front end is already set up to call `/api/gemini` when the page is served from the same origin, so when you open `https://your-project.vercel.app/expense-tracker.html`, chat will use that API and the key stays on Vercel.

To serve `expense-tracker.html` at the root, you can add a `vercel.json` in the project root:

```json
{
  "rewrites": [
    { "source": "/", "destination": "/expense-tracker.html" }
  ]
}
```

(Optional; you can also keep opening `/expense-tracker.html` directly.)

---

## If SpendlyBot says “AI unavailable”

- **Local (Option A):** Check that the server is running (`npm start` in `server/`), that you opened **http://localhost:3000/expense-tracker.html**, and that `GEMINI_API_KEY` is set in `.env`.
- **Vercel (Option B):** Check that `GEMINI_API_KEY` is set in the project’s Environment Variables and that you redeployed after adding it.

---

## Summary

| Step | What you do |
|------|------------------|
| 1 | Create a **new** Gemini API key in Google AI Studio (old one may be revoked). |
| 2 | Put the key only in **server environment** (`.env` locally or Vercel env vars). |
| 3 | Run the backend (local or Vercel) and open the app via the **server URL**, not as a file. |

The key never goes into the HTML or the browser; only your server uses it to call Gemini.
