# musicForCoding();

A responsive, original frontend **inspired by** the minimal, programmer-friendly interface at [musicforprogramming.net](https://musicforprogramming.net/). It has a working browser-based ambient sound engine — no music downloads, backend, API keys, accounts, or subscriptions required.

This is an **independent demo** and is **not affiliated with musicforprogramming.net**. Its sessions and audio are original and do not reproduce the site's recordings or original branded content.

## Features

- Desktop three-column layout and responsive mobile player
- Minimalist terminal aesthetics with three color themes
- 18 fictional sessions with original generative ambient audio
- Play/pause, next/previous, random, volume, progress seek, and timed session transitions
- Interactive movement list and canvas visualizer
- Search, favourites, and persistent local settings
- Keyboard controls (`space`, left/right arrows, `n`, `p`, `f`)
- URLs such as `?episode=08` link to a selected session
- Accessible focus states, reduced-motion awareness, semantic labels
- Plain HTML, CSS, and JavaScript: no framework, no build, no hosting costs for the code

## Run locally

Python 3 is enough:

```bash
cd focus-terminal-music
python3 -m http.server 8000
```

Open <http://localhost:8000>. No `npm install` necessary. Modern Chrome, Edge, Firefox and Safari are supported; audio begins after you press **play** due to browser autoplay policies.

## Upload to your GitHub repository

**For a new empty repository**, create it at <https://github.com/new> (do not initialize it with another README), then run inside this directory:

```bash
git init
git add .
git commit -m "Build minimal ambient music player"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

GitHub will ask you to authenticate using your normal sign-in or Git credential manager. Never put personal access tokens into source files or chat messages.

**For an existing repository containing code**, clone it first and integrate these files in a branch rather than force-pushing over existing work.

## Deploy for $0 on Vercel

1. Sign in at <https://vercel.com/> and choose **Add New → Project**.
2. Connect GitHub and import your repository.
3. Framework preset: **Other**. Leave the root directory as `./` and build command empty; no framework build is required.
4. Deploy. You'll receive an HTTPS `*.vercel.app` URL.
5. Every new push to the connected GitHub branch will trigger a fresh deployment.

The Vercel **Hobby** plan is designed for personal, noncommercial projects. Follow the current usage limits at <https://vercel.com/docs/plans/hobby>.

## AWS option

This is also a static site and can be hosted through AWS Amplify Hosting or S3/CloudFront. AWS fees and free-tier eligibility vary by account and service; verify the applicable offers before deployment and set billing safeguards. Vercel is simpler for this project.

## Add your own real music files

The included generative sound needs no external assets. To use licensed MP3 recordings instead:

1. Make an `audio/` directory at the project root.
2. Add music you own or have explicit permission to distribute and stream, for example `audio/ambient-01.mp3`.
3. In `src/data.js`, set the session's `audioSrc` to `'./audio/ambient-01.mp3'`.
4. Update the session title, duration, description, movement metadata and credits.

**Important:** Do not copy/hotlink third-party mixes without permission. Audio files can be large and may exceed free-hosting traffic/asset limits. For a large licensed catalog, use a suitable external audio/CDN provider instead of committing big MP3 files to GitHub.

## Customize

- Session metadata: `src/data.js`
- Playback/synthesis engine: `src/audio.js`
- App behavior: `src/app.js`
- Colors and layout: `styles.css`
- Page markup: `index.html`

All code here was authored for this demo; the Google Fonts IBM Plex Mono font is loaded from the Google Fonts service and has a local monospace fallback.
