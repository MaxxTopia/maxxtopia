# discordmaxxer-votes

Cloudflare Worker that backs the **DiscordmaxxerVotes** panel inside the
discordmaxxer Electron client. MAXXER++ subscribers submit a vote anchored
to their HWID; aggregate counts come back via `/tally`.

## Routes

- `GET  /tally` → `{ ok, counts: { [feature_id]: number } }`
- `POST /vote` → `{ ok, alreadyVoted?, count }` · body: `{ feature_id, hwid }`
- `GET  /` or `/health` → liveness ping

## One-time setup

```powershell
cd votes-worker

# Create the KV namespace + paste the returned id into wrangler.toml
wrangler kv namespace create "VOTES"
# id appears in stdout — replace REPLACE_WITH_KV_NAMESPACE_ID

# Deploy the worker
wrangler deploy
```

Worker URL after first deploy: `https://discordmaxxer-votes.<your-account>.workers.dev`.
The discordmaxxer client points at this URL via `VOTES_API` constant in
`plugins/DiscordmaxxerVotes/index.tsx`.

## Inspect votes

```powershell
# All count keys
wrangler kv key list --binding VOTES --remote --prefix "count:"

# Specific feature count
wrangler kv key get "count:voice-channel-themes" --binding VOTES --remote

# Reset a feature (e.g. after shipping it)
wrangler kv key delete "count:voice-channel-themes" --binding VOTES --remote
# Plus all the dedup entries:
#   wrangler kv key list --binding VOTES --remote --prefix "voted:"
# (then delete each — KV lacks bulk-delete-by-prefix)
```

## Tier gate

Voting is gated **client-side** in DiscordmaxxerVotes via the in-app roster
check (`hasTier(Tier.MAXXER_PLUS_PLUS)`). The worker doesn't independently
re-verify tier — that would require ferrying a claim signature on every
request, overkill for MVP-scale polls. HWID dedup keeps non-paying users
from spamming individual feature counts via curl.
