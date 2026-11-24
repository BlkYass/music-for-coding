# musicForProgramming(); — text-terminal visual recreation

A static, dependency-free, responsive visual recreation of the public Episode 70 layout at https://musicforprogramming.net/seventy/. Built for the `BlkYass/music-for-coding` GitHub repository and Vercel static hosting.

## What's included

- The same overall **three-column, text-only presentation** as the reference screenshot (no cards, borders, dashboard elements, or spectrum visualizer).
- 80 archive **labels** from the user-provided HTML source and Episode 70's full user-provided **tracklist and metadata**.
- Functional playback, time counter, rewind/forward, volume, random, favourites, invert, and keyboard shortcuts.
- The Episode 70 MP3 is referenced via the original third-party `datashat.net` URL **supplied by the user**; no MP3s are copied, downloaded, or redistributed. Public streaming requires authorization from the owner. If the remote service does not allow streaming, replace this URL with a licensed file you host.
- Other episodes use a clearly identified **original generative audio demo** rather than misrepresenting or copying their actual recordings and tracklists.
- Responsive two-column/mobile layouts and standard keyboard navigation.

**Accuracy:** This is a close visual reproduction, not the actual original website or its production code. Font rendering, line wrapping, and original site's extra controls can differ by browser/screen size.

## Run locally

Open `index.html` from a local web server (ES modules need HTTP), e.g. with Python:

```powershell
cd "C:\test_perso\music-for-coding\music-for-coding-website\focus-terminal-music"
python -m http.server 8000
```

Then browse to http://localhost:8000/. The `/seventy/` deep-link works on Vercel through the included rewrite rule; the plain Python server only serves `/`.

## Replace the existing repository on Windows (Git Bash)

After extracting this ZIP into `~/Downloads/music-for-coding-v2`:

```bash
cd /c/test_perso/music-for-coding/music-for-coding-website/focus-terminal-music
cp -r "$HOME/Downloads/music-for-coding-v2/focus-terminal-music/"* .
git add -A
git commit -m "Rebuild music player to match reference layout"
git push origin main
```

If the extracted files are at a different path, adjust the `cp` source. Make sure you copy into the directory **containing the repo's `index.html`**, not a nested duplicate folder.

## Vercel

Your project is already linked to the GitHub repository; pushing to `main` starts automatic deployment. No `vercel login`, framework, environment variables, or build step is needed. Vercel preset: Other. Root directory: folder containing `index.html`.

## Notes

This is an independently built visual recreation. The original site's music, distinctive branding and archive belong to their respective owners. Don't misrepresent the replica as the original site or redistribute music without permission.
