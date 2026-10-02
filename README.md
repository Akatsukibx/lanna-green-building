# Lannacom Green Building — Digital Signage

A looping 1920×1080 (landscape) web page for a BrightSign player, built from the
"BM1 green building" deck. Static HTML + images only; independent of the Digital Twin system.

**Live page:** https://akatsukibx.github.io/lannacom-signage/

## Files

```
index.html     the presentation (14 scenes, animations)
config.js      settings: scene seconds, live-data address, header style, welcome scene
img/           photos and icons from the deck
serve.js, package.json   `npm start` = tiny local web server (http://localhost:8099/)
server-optional/         only for the two LIVE scenes (building totals JSON + tests)
```

## BrightSign

Point an **HTML widget** (1920×1080) at the live page URL above. Updating this repo updates
the screen after GitHub Pages republishes (about a minute) — no change on the player.
The first load needs internet for the Sarabun font (Google Fonts).

## Options (add after the URL)

`?scene=energy` pin a scene · `?speed=4` play faster · `?debug=1` show scene name ·
`?hd=bar|tint|plain` header style · `?api=<url>` live-data address.
Scene ids: welcome, intro, what, benefits, energy, solar, air, waste, green, ev, csr, train, dose, visit.

## Settings (`config.js`)

`sceneSeconds` (default 7, Welcome is 6) · `welcomeEachLoop` · `header` · `api`.

`api` is empty here, so the *Building Energy* and *Indoor Air Quality* scenes are skipped. To show live numbers set it to
the Digital Twin's public endpoint, e.g. `api: "https://<twin-host>/api/signage"` (see `server-optional/route-example.js.txt`;
the route already sends `Access-Control-Allow-Origin: *`). Stale or missing data hides the cards — numbers are never invented.

## Editing content

Scenes are in `index.html` (`var SCENES`), each a small function returning HTML on a 1920×1080 canvas.
Written for older Chromium builds (no `?.`/`??`, no flex `gap`); not yet tested on a physical BrightSign.
Photos and logos belong to Lannacom / TGBI / their owners.
