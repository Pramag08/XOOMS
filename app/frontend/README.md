# Frontend (Standalone)

This folder contains the frontend app (Vite + React + TypeScript). These instructions let you run it independently from the backend.

Prerequisites

- Node.js 18+ (or compatible LTS)

Install

```bash
cd app/frontend
npm install
```

Run (development)

```bash
cd app/frontend
npm start
# opens dev server on http://localhost:3000
```

Build and preview

```bash
npm run build
npm run preview
```

Notes

- Dev server binds to port 3000 by default.
- If you need to supply environment variables, copy `.env.example` to `.env` and update values.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/973feb33-8d0a-4bf7-9c19-be3c257d8059

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
