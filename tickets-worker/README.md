# maxxtopia-tickets

Self-hosted Discord ticket system. Replaces TicketTool. HTTP-only interactions → no persistent process needed → runs free on Cloudflare Workers.

Mirror layout of `vip-worker/` and `telemetry-worker/`. Same Cloudflare account.

## What it does

1. User clicks the **"Buy VIP — $115 launch sale →"** button posted by the Maxx bot in `#open-ticket`.
2. Discord POSTs the interaction here (Ed25519-signed).
3. We verify, defer the reply, then via REST:
   - Create a **private thread** in `#open-ticket` named `vip-optmaxxing-<username>`
   - Add the user + Diggy as members
   - Post a welcome message with payment instructions + a `🔒 Close ticket` button
4. Edit the deferred reply with a link to the spawned thread.

When the buyer clicks **🔒 Close ticket**: bot mirrors the transcript to `#ticket-archive` (if configured), then archives + locks the thread.

## Public Fortnite utility commands

These commands are private Discord responses. They can be used wherever Maxx
Bot's slash commands are available; they do not require a special channel,
and they do not post a public message or notify the server.

### `/storm`

Required inputs are the current zone, `waiting` or `closing`, seconds left in
that phase, and cumulative storm damage already taken. `Battle Royale` is the
default timing reference; choose `Reload` when appropriate. The current
reference is the user-supplied **Chapter 7 Season 1 Comp** table, including its
phase totals and opening wait; it is not a live game feed. A DPS override is
available when the in-game tick differs from the reference table.

The read uses the standard baseline of 500 cumulative damage for the warning,
600 for Storm Sickness, and 3x damage after sickness. It deliberately stops at
the practical **leave now** rule instead of presenting a hard-stop damage
number. White heals are described as a bridge while rotating, not a plan for
tanking the zone after sickness.

Reload timing is a reference only. Current Reload playlists are not one fixed
timing track, and the current Mini-Venture variant is faster; use the in-game
countdown or the DPS override when the reference does not match. Blank damage
cells in the supplied table are represented as `0 DPS` until an override is
entered.

### `/points`

Choose one of two modes:

```text
/points mode:Manual formula games:11 current:0 target:300
/points mode:Live Epic lookup games:3 ign:ExactEpicName region:EU tournament:CrashBandicootCup
```

Manual mode is arithmetic: enter the current cumulative points and the cutoff
you want to chase. Live mode accepts either an exact Epic display name or a
32-character Epic account ID. The account ID is the reliable fallback when a
console/platform name does not resolve as an Epic display name. It first
selects one exact live tournament window, then reads that player's standing
from the same exact `eventId` and `windowId`. Choose a region, or `ALL` to scan
all enabled regions; if the same tournament is live in more than one region,
the tournament filter must identify the exact event/window.

Qualification windows show the moving points line at the published advancement
rank. Finals windows are a separate prize race: Epic's payout metadata provides
the paid rank bands, and the worker reads the current points at each paid-rank
boundary from that exact region/event/window leaderboard. The command reports
the player's current band, the next better band, the live boundary score, and
the points-per-game pace when that boundary is available. It does not invent a
final cutoff, carry a threshold across regions, or substitute a prior similar
tournament. If Epic has not published a boundary or the payout fields are
opaque, that part is shown as unavailable rather than estimated.

The standing request carries the selected region as well as the exact event and
window, so a partial `ALL` scan cannot silently reuse another region's board.

The live qualifying line can move while the board fills, so rerun it after
each game. The command reports the player's current Epic score, rank when
available, games recorded, exact target source, and the average points needed
over the games remaining. It does not invent placement/elimination examples
without a verified scoring profile.

The `games` input is used as the fallback when Epic does not expose a match cap;
when the live standing includes an authoritative `gamesLeft`, that value wins.
Both region and identity remain visible in the result so a copied or stale
lookup is easier to catch.

Both commands are ephemeral and use `allowed_mentions: { parse: [] }` so an
answer cannot fan out notifications. `/points live` allows one lookup per
regular Discord user every 30 seconds and one lookup per member with the
configured `@VIP` role every 5 seconds, with a small per-isolate in-flight cap.
The VIP check uses Discord's signed member-role payload; it does not trust a
user-supplied option. This guard is separate from the ticket/VIP KV limiter, so
refresh spam cannot consume ticket capacity. It is a burst safeguard rather
than a global DDoS control; distributed abuse still belongs behind Cloudflare
rate limiting/WAF.

The panel's live-window menu has its own five-second per-user refresh guard so
button spam cannot turn the region picker into an unbounded `/windows` proxy.
The menu guard is separate from the final points-lookup cooldown and from the
ticket/VIP KV limiter.

## Read-only feedback review wall

The live review wall is the normal read-only `#reviews` text channel. Members
cannot send ordinary messages there, but they can click the visible **Leave a
review** button or run `/review` because buttons and slash commands are
Discord interactions rather than channel messages. Both open the same private
form. The Worker publishes the finished card into that channel, so the wall
stays clean and command-only.

The former `#feedback` Forum post is preserved as `#reviews-archive`; it is
archived, not deleted, and still contains the original user messages.
`scripts/migrate-feedback-review-channel.mjs` performs this narrow migration,
converts only the identified legacy `!tonka` review, and is dry-run by default.
It never edits or deletes the user's original message and never sends a public
notification.

The private form produces a compact card containing the rating, review text,
optional product, the author mention, and an avatar thumbnail when Discord
provides one. The public card uses `SUPPRESS_NOTIFICATIONS` and
`allowed_mentions: { parse: [] }`; the acknowledgement stays ephemeral. A
ten-minute per-isolate cooldown and a four-review in-flight cap limit
accidental or abusive bursts; the cooldown is intentionally separate from the
VIP points cooldown.

`FEEDBACK_REVIEW_CHANNEL_ID` configures the normal text-channel destination.
`FEEDBACK_CHANNEL_ID` and `FEEDBACK_THREAD_ID` remain as the legacy parent and
archive IDs during the transition, and are still accepted as command surfaces
so an old saved command does not fail unexpectedly. New cards always publish
to `FEEDBACK_REVIEW_CHANNEL_ID`.

## Private `#free-stuff` utility panel

The preferred channel surface is a persistent Maxx Bot panel in `#free-stuff`,
not a chat box. Ordinary members can read the channel and click its buttons
without having `SEND_MESSAGES`; button clicks, menus, and modal submissions are
Discord interactions handled by the Worker. The bot's prompts and results are
ephemeral, so no user's identity, form input, or answer is posted to the
channel.

The panel has three entry points:

- **Live tournament points** — choose a region, choose a freshly loaded exact
  live window, then enter the Epic display name shown in Fortnite, games left,
  and an optional cushion. The submit step re-checks that exact window before
  asking for the standing. The advanced `/points` command still accepts a
  32-character account ID when a platform alias does not resolve.
- **Storm · BR** and **Storm · Reload** — choose the current zone, waiting or
  closing phase, time-left preset, and storm damage already taken. The four
  menus keep the common Fortnite path fast; **Enter exact** is available for
  values such as 25 seconds or 25 damage.

Live windows are not hardcoded into the buttons. Qualifiers are labelled as a
moving line and Finals as a live prize race, so the panel can serve every
supported region without carrying a stale event or cutoff. If the live feed is
empty or temporarily unavailable, the private response says exactly what
happened and offers a refresh button; it never exposes a raw HTTP status or
queries a leaderboard from incomplete data. Slash commands stay available as a
fallback, including the manual arithmetic mode for advanced users who already
know a target line.

Storm presets use the user-supplied Chapter 7 Season 1 Comp tables. The result
shows a direct leave call, the current damage tier (`SAFE` below 500,
`WARNING` from 500–599, and `MAX THREAT` at 600+), and the estimated time until
each threshold. Reaching 600 triples storm damage, so the leave call is the
useful action rather than a confusing hard-stop number. The visible panel
deliberately hides `DPS override`: it means the current storm damage tick when
a map or playlist differs from the reference, and is only useful through the
advanced `/storm` command. The in-game timer and tick always outrank the
reference.

Every new Maxx utility interaction retires that user's previous ephemeral
utility reply when Discord still accepts its interaction token. The newest
result remains available for reference until the next utility interaction (or
Discord's normal ephemeral expiry), and cleanup failures are silent because
ephemeral replies expire naturally. This is best-effort per Worker isolate and
does not affect tickets, reviews, or other bot messages.

`scripts/post-free-stuff-panel.mjs` is a dry run by default. After the Worker
release is approved, use it to update only the known Maxx Bot guide message (or
find a prior panel by its invisible signature); it never edits the original
Viewmaxxing preview post. The safe live migration order is:

1. Deploy the Worker containing the panel interaction routes.
2. Run the panel publisher with `--execute` so the existing guide gets the
   buttons silently and without mentions.
3. Restore `#free-stuff` to read-only for ordinary members.
4. Remove the temporary catch-all AutoMod command-only workaround after the
   read-only permission is confirmed.

Do not run the execute step, change permissions, or remove the AutoMod rule as
part of a local build. Those are live Discord changes and must be verified
separately.

## Deploy

### 1. Create the rate-limit KV namespace

```powershell
cd projects/maxxtopia/tickets-worker
wrangler kv namespace create tickets-ratelimit
# → paste the returned id into wrangler.toml replacing REPLACE_WITH_KV_ID_AFTER_CREATE
```

### 2. Set the two secrets

```powershell
# From Discord dev portal → Applications → Maxx → General Information → Public Key
wrangler secret put DISCORD_PUBLIC_KEY

# From Discord dev portal → Applications → Maxx → Bot → Token (RESET if you ever lost it)
wrangler secret put DISCORD_BOT_TOKEN
```

### 3. Deploy

```powershell
wrangler deploy
# → Live at https://maxxtopia-tickets.<your-account>.workers.dev/
```

### 4. Wire the dev portal

In the Discord dev portal → Applications → **Maxx** → **General Information**:

- **Interactions Endpoint URL**: `https://maxxtopia-tickets.<your-account>.workers.dev/`
- Click **Save**. Discord PINGs the URL — if our signature verification works, the save sticks. If you see "Validation failed", the public key is wrong (re-set the secret).

### 5. Bot permissions

The Maxx bot needs these in the server (re-invite via the OAuth URL with the right scopes if it doesn't already have them):

- `MANAGE_THREADS` — to create + archive private threads
- `CREATE_PRIVATE_THREADS` — Discord splits this from MANAGE_THREADS
- `SEND_MESSAGES_IN_THREADS`
- `MANAGE_CHANNELS` (already granted from the server-setup script)
- `READ_MESSAGE_HISTORY` (for transcript archival)

If anything fails, check `wrangler tail` while clicking the panel button — error messages get logged there.

### 6. Post the panel

```powershell
cd projects/maxxtopia
node scripts/post-ticket-panel.mjs --execute
```

The bot posts the styled embed + button in `#open-ticket`. Idempotent — re-running won't duplicate.

## Adding more product buttons later

The button `custom_id` follows the format `vip-buy-<product>`. Add a new product:

1. Add a case in `worker.js::productLabelFor()` mapping the suffix to a display name.
2. Add a case in `worker.js::buildWelcomeMessage()` with the product-specific payment copy.
3. Update `scripts/post-ticket-panel.mjs` to post a second button (or replace the current one) with the new custom_id.
4. Re-run `wrangler deploy` + `node scripts/post-ticket-panel.mjs --execute`.

No worker config change needed.

## Validation costs

Cloudflare Workers free tier: 100k requests/day. A ticket = ~3 worker invocations (1 button → defer + thread create + welcome post; close = 2 more). 100k requests = ~33k tickets/day capacity. We will not hit this.

KV reads/writes for the rate limiter: 100k reads/day + 1k writes/day on free tier. 1k writes = 1k tickets/day, plenty.

## Inspect

```powershell
wrangler tail                    # live logs as users click
wrangler kv key list --binding TICKETS_RATELIMIT --remote   # active rate-limit holds
```

## Why not TicketTool?

TicketTool works fine. We chose self-hosted because:
- Zero third-party dep — TicketTool has gone down before; never have to debug their bot.
- Fully Element-115-branded (cyan #3af0f0 button color, Asta visual treatment in the embed).
- Future: can auto-grant `@VIP` role on code redemption via a webhook from the vip-worker → this worker.
- Same Cloudflare account as everything else; one bill, one log surface.
