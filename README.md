# musicForProgramming(); — close-layout rebuild

A lightweight, static, responsive listening room rebuilt for the **BlkYass/music-for-coding** repository. This version uses the dark typography, colors, responsive column proportions and terminal-style navigation of the reference supplied in the conversation, not the previous dashboard layout.

## Included

- IBM Plex Mono **ExtraLight (200)** headings and **Regular (400)** UI. The font is fetched from Google Fonts; no font binaries are bundled.
- The original-inspired 25% / 50% / 25% desktop column arrangement, narrow typography, syntax highlighting, minimal player, archive highlights and compact tracklist typography.
- All **80 episode titles**, **80 external MP3 URLs**, durations, file sizes, 1,392 tracklist entries and the artists' external sites, extracted from your uploaded JavaScript data.
- Play, stop, back/forward 30 seconds, previous/next, random, volume, favourites, invert, fullscreen, picture-in-picture where supported, a local RSS feed, and continuous random playback (`[mfp.eternal]`).
- All on-site navigation stays on your Vercel site. No links to the reference website are embedded in the interface or source code. Audio streams come from external `datashat.net` URLs, and track titles open music-search results, not the reference site.

**Important:** These are external MP3 links provided in the uploaded files, **not audio files distributed by this package**. Audio availability is subject to the remote host. Before offering the mixes publicly, confirm you have permission to stream them and to use episode titles, tracklists and other content. You can swap out the `file` field in `src/episodes.js` with licensed MP3 URLs you host or control.

## Local development

Open the folder that contains `index.html` in PowerShell:

```powershell
cd "C:\test_perso\music-for-coding\music-for-coding-website\focus-terminal-music"
python -m http.server 8000
```

Then open http://localhost:8000/. You can browse the episodes from the archive. Deep links such as `/seventy/` work on Vercel via `vercel.json`.

## Update the existing repository

Save `music-for-coding-v3.zip` in Downloads, then run in **PowerShell**:

```powershell
$project = "C:\test_perso\music-for-coding\music-for-coding-website\focus-terminal-music"
$zip = "$HOME\Downloads\music-for-coding-v3.zip"
$temp = "$HOME\Downloads\music-for-coding-v3-extracted"
Expand-Archive -Path $zip -DestinationPath $temp -Force
Copy-Item -Path "$temp\focus-terminal-music\*" -Destination $project -Recurse -Force
Set-Location $project
git add -A
git commit -m "Rebuild layout with IBM Plex Mono and 80 real episode links"
git push origin main
```

Your existing GitHub-to-Vercel link should trigger an automatic redeployment. You do not need the Vercel CLI.

## Testing and limitations

The layout and JavaScript were tested using Chromium with an in-memory page. The archive, track details, favourites and theme inversion worked with no JavaScript page errors. Live remote MP3 delivery was **not verified from this environment** and may require authorized hosting or a CORS-compatible remote stream. Font rendering may differ if your network blocks Google Fonts.

This is an independently built site. Do not present it as the original project's official website.
