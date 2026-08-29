# 🌐 Deploying My AI on Replit (with Google Gemini)

Follow these simple steps to deploy **My AI** on [Replit](https://replit.com) using Google's free-tier Gemini API.

---

## 1. Get Your Free Google Gemini API Key

1. Go to Google AI Studio: **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account.
3. Click **"Create API key"** and copy the generated key (starts with `AIza...`).

---

## 2. Import to Replit

1. Log in to [Replit](https://replit.com).
2. Click **"+ Create Repl"** $\rightarrow$ **"Import from GitHub"** (or upload the project ZIP).
3. Select the **Node.js** template.

---

## 3. Set Up Environment Variables (Replit Secrets)

In your Repl, open the **Secrets** tool (the lock icon in the left sidebar) and add the following secrets:

| Secret Key | Secret Value | Description |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `gemini` | Primary AI provider |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Free-tier high speed model |
| `DEFAULT_AI_MODEL` | `gemini-2.5-flash` | Default model |
| `NODE_ENV` | `production` | Production environment |

---

## 4. Run & Deploy

In the Replit Console:

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

To publish for permanent public hosting, click the **"Deploy"** button in Replit and choose **Autoscale** or **Static/Web Service** with build command `npm run build` and run command `npm start`.

---

## 5. Switching Providers in the Future

My AI's architecture is provider-independent. To switch providers anytime, simply change the `AI_PROVIDER` secret:

- **Google Gemini (Default & Free Tier)**: `AI_PROVIDER=gemini`
- **Local Ollama**: `AI_PROVIDER=ollama`
- **OpenAI**: `AI_PROVIDER=openai` (with `OPENAI_API_KEY`)
- **Anthropic Claude**: `AI_PROVIDER=anthropic` (with `ANTHROPIC_API_KEY`)
- **Custom / Fine-Tuned My AI Model**: `AI_PROVIDER=myai`
