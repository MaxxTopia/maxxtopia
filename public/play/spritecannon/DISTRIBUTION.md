# Sprite Cannon - web game distribution

The game is now a **self-contained web build**. The SAME `overlay/spritecannon.html` runs in two modes automatically:
- **In the app / OBS hub** (`127.0.0.1`): absolute `/imported/...` paths + live config + EventSource. Unchanged.
- **Hosted standalone** (maxxtopia / itch): relative `imported/...` paths, no hub. Triggered by the injected `window.SC_STANDALONE=true` flag (and any non-localhost host).

`spritecannon-web/` is the standalone build: `index.html` + bundled `imported/spritecannon/{skins,music,sfx}` + a generated skins `manifest.json`. Verified: loads all 25 skins, abilities/costs, and 3 music tracks over plain HTTP with zero hub.

## To rebuild the web folder after editing the game
```
cp overlay/spritecannon.html spritecannon-web/index.html
# re-inject the standalone flag:
python -c "p='spritecannon-web/index.html'; s=open(p,encoding='utf-8').read(); s=s.replace('<script>\n\"use strict\";','<script>window.SC_STANDALONE=true;</script>\n<script>\n\"use strict\";',1); open(p,'w',encoding='utf-8').write(s)"
# (re-copy skins/music/sfx + regenerate manifest only if assets changed)
```
Then rebuild the itch zip (forward slashes - do NOT use PowerShell Compress-Archive, it writes backslashes that break on itch):
```
python -c "import zipfile,os; root='spritecannon-web'; zf=zipfile.ZipFile('spritecannon-itch.zip','w',zipfile.ZIP_DEFLATED); [zf.write(os.path.join(dp,f), os.path.relpath(os.path.join(dp,f),root).replace(os.sep,'/')) for dp,dn,fn in os.walk(root) for f in fn]; zf.close()"
```

## 1) itch.io (Diggy uploads - needs your account)
`spritecannon-itch.zip` is ready at the project root (~22 MB, index.html at zip root).
1. Sign in at itch.io -> **Dashboard -> Create new project**.
2. Title: **Sprite Cannon**.  Kind of project: **HTML**.
3. Upload `spritecannon-itch.zip`, tick **"This file will be played in the browser"**.
4. Embed options: **Manually set size** ~ 960 x 600 (or click Fullscreen button enabled). Mobile-friendly: on.
5. Add a short description + a screenshot or two (use the meadow / gauntlet captures). Tag: arcade, casual, original.
6. Pricing: **No payment** (free). Visibility: Public when ready.
7. Save & view page -> play to confirm.

## 2) maxxtopia.com/play/spritecannon (CF Pages)
Host the same `spritecannon-web/` contents under `/play/spritecannon/` on the maxxtopia Pages project, then deploy. This is a PUBLISH step - gate it with Diggy's go. (Locate the maxxtopia Pages source/repo, drop the folder at `play/spritecannon/`, redeploy. Stays in CF free tier; ~22 MB static assets are fine.)

## Leaderboard note
The in-game board supports per-stream (`?ch=<channel>`) + global. On the standalone web page there's no stream channel, so it shows the **global** board only - which is exactly right (every web player competes on one global ladder). The worker must be DEPLOYED first (see spritecannon-lb/, gated).
