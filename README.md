# CSE299 Frontend — Beginner Running Guide (Windows)

> Goal: Get the app running locally with zero prior setup. You’ll paste the environment values we emailed you into a small file, install what’s needed, and run the app in your browser or on your phone using Expo Go.

---

## 1) What this is

This is a React Native app built with Expo and TypeScript. It includes:

- A dark, glassy dashboard with stats and alerts
- A childcare chatbot (uses Groq API)
- Auth, profile, and monitoring screens (use Supabase)

You don’t need Xcode/Android Studio. We’ll use Expo Go on your phone or open the app in your web browser.

---

## 2) What you need to install (one-time)

- Node.js LTS (required)
  - Download: [nodejs.org](https://nodejs.org/en) (choose the LTS version, e.g., 20.x)
  - Run the installer and keep defaults

- Visual Studio Code (recommended editor)
  - Download: [code.visualstudio.com](https://code.visualstudio.com/)

- Expo Go app on your phone (optional but recommended)
  - iOS: App Store → “Expo Go”
  - Android: Play Store → “Expo Go”

You do NOT need Git, Android Studio, or Xcode for this quick start.

---

## 3) Get the project code

If you received a ZIP file:

- Right‑click the ZIP → “Extract All…”
- Open the extracted folder in VS Code (File → Open Folder…)

If the project is on GitHub and you prefer download:

- Click the green “Code” button → “Download ZIP” → Extract → Open in VS Code

---

## 4) Add your environment values (the ones we emailed)

You received secrets in the email. We’ll load them by creating a small PowerShell script the app will read when it starts.

1) In VS Code, create a new file in the project root called: `.env`

2) Paste the values 
Save the file.
---

## 5) Install project dependencies

Open a PowerShell window in the project folder (Shift + Right‑click → “Open PowerShell window here”), then run:

```powershell
npm install
```

This downloads all libraries the app needs.

---

## 6) Start the app

From that same PowerShell window, run your env file once, then start Expo:

```powershell
# Start the Expo development server
npx expo start -c
```



---

## 7) Sign in and try features

- Use the Register/Login screens (they connect to your Supabase project)
- Open the Chatbot (floating button or Chatbot tab)
- Ask questions about sleep, feeding, soothing, and routines
- Explore the Dashboard and Stats

---

## 8) Troubleshooting

- “Missing GROQ API key” or “Groq API error”
  - Ensure you ran `./env.ps1` in the same terminal before `npx expo start`
  - Confirm the Groq key is correct and active
- “Invalid Supabase URL/key” or auth issues
  - Double‑check both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- QR code doesn’t load on phone
  - Phone and PC must be on the same network
  - Try switching the connection mode in the Expo Dev Tools (LAN/Tunnel)
- App looks weird after edits
  - Stop the server and run: `npx expo start --clear`
- Permission prompts (camera/mic) if you explore features that need them
  - Grant permissions in the device prompts or OS settings

---

## 9) Project scripts (optional)

- Start dev server:

  ```powershell
  npx expo start
  ```

- Typecheck TypeScript:

  ```powershell
  npm run typecheck
  ```

- Lint:

  ```powershell
  npm run lint
  ```

---

## 10) What’s inside (high‑level)

- `app/` — All screens (Expo Router)
- `components/` — Reusable UI (GlassCard, inputs, buttons)
- `contexts/` — Auth, Monitoring, Toast
- `lib/` — API clients (Supabase, Groq)
- `constants/` — Theme and UI constants
- `supabase/` — Database migrations (schema)

---




