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
