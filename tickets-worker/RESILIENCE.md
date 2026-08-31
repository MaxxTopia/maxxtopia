# Maxx Bot Fortnite utilities resilience

Scope: the private live-points and storm-timing tools in the `#free-stuff`
panel. These tools must prefer an honest unavailable result over a plausible but
wrong competitive call.

## Risk register

| Failure mode | Blast radius | Detection signal | Automatic response | Plan B |
| --- | --- | --- | --- | --- |
| Snipemaxxer replaces or removes a public route | Every live-points lookup | Exact `404 {"error":"not found"}` on a known route; contract fixture fails | Try the other explicitly supported route contract once | Show a private unavailable result with region-preserving Refresh; never switch tournaments |
| Epic catalog is partial for one region | Players in that region | `regionsFailed` contains the selected region | Reject that region's result | Let the player retry the same region; do not borrow another region's event or cutoff |
| A cached or recently ended window is mistaken for the active one | Anyone selecting the event | `live !== true`, or event/window no longer matches on submit | Re-fetch and require the exact event ID, window ID, and region again | Return “window no longer available” and reopen the fresh picker |
| Player score and cutoff come from different windows | One lookup, high competitive impact | Returned region/identity differs from the selected window | Reject the result | Fall back only to another route for the same exact IDs; never fuzzy-match the score |
| Qualifying cutoff has not populated | Players early in a cup | Exact cutoff is missing/null | Stop the forecast | Show live points/rank only when available and say the qualifying line is not published |
| Finals payout metadata is absent | Finals users | Empty payout ladder | Keep exact live points/rank; disable prize-band claims | Say prize information is unavailable; never infer dollars or a paid rank |
| Chapter/playlist storm timing changes | Every storm user in the changed playlist | In-game timer or tick differs from the named reference | User-provided timer and optional DPS override take priority | Label the table version, pause clocks while safe, and tell the player to trust the in-game timer/tick |
| Discord component state outlives a deployment | One user's open prompt | Invalid or stale custom ID | Reject or reset that private prompt | User reopens the tool; public panel remains untouched |

## Prioritized safeguard backlog

### P0 — required with every release

- Keep contract fixtures for `/tournaments`, `/myscore`, `/qualify`, and
  `/cutoffs`, plus the legacy `/windows` and `/standing` fallback.
- Re-query the chosen event/window on final submission and require exact IDs,
  region, and `live: true`.
- Test the supplied BR example: Zone 1 closing, 30 seconds left, 250 cumulative
  damage, continuously in storm = 4:10 to the 500 warning on the full changing-
  DPS reference timeline.
- Keep every interaction ephemeral, with no mentions.

### P1 — next hardening pass

- Add a synthetic health probe that validates response shape rather than only
  HTTP status, and alert only after consecutive failures.
- Record route-contract selection and stable error codes without logging Epic
  display names, account IDs, Discord tokens, or interaction tokens.
- Add configuration-backed feature switches described below.

### P2 — useful, not a release blocker

- Surface a short “data age” line from the upstream `fetched` timestamp.
- Add a tiny admin-only diagnostic that reports route health and selected
  contract without making a player lookup.

## Remote kill-switch design

Use a small configuration record read by the Worker with a short bounded cache:

```json
{
  "feature:live-points": {
    "enabled": true,
    "reason": "",
    "expiresAt": null,
    "updatedAt": "ISO-8601",
    "updatedBy": "operator"
  },
  "feature:storm-reference": {
    "enabled": true,
    "reason": "",
    "expiresAt": null,
    "updatedAt": "ISO-8601",
    "updatedBy": "operator"
  }
}
```

- Default to the checked-in safe state when the configuration store is
  unavailable; never let a config outage invent tournament data.
- A disabled feature returns a private explanation and keeps the rest of the
  `#free-stuff` panel working.
- Every disable should have an expiry or explicit review date so an emergency
  switch cannot quietly become permanent.
- The switch changes behavior only. It must not edit public Discord messages,
  ping members, or deploy code by itself.
