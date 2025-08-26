# Equitree Fee Calculator

This is a Vite + React + TypeScript single-page app styled with Tailwind CSS and using `lucide-react` and `recharts`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy options

### Vercel
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Netlify
- Build Command: `npm run build`
- Publish directory: `dist`
- Redirects: enable SPA fallback to `index.html` (Netlify auto-detects for Vite)

### Docker
Build and run the container using the provided Dockerfile:

```bash
# From project root
docker build -t equitree-fee-calculator .
# Run on port 8080
docker run --rm -p 8080:80 equitree-fee-calculator
```

Then open `http://localhost:8080`.
