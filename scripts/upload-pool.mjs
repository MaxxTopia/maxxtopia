/*
 * Reads VIP codes from stdin (one per line, MAXX- prefix optional),
 * uploads them to the VIP_CODE_POOL KV namespace under
 * `unused:<pool>:<code>` keys via `wrangler kv key put --remote`.
 *
 * Usage:
 *   # From a pre-existing file:
 *   cat codes.txt | node scripts/upload-pool.mjs general
 *
 *   # Piped from the mint script:
 *   python ../optimizationmaxxing/scripts/mint-unbound-codes.py 50 --raw \
 *       | node scripts/upload-pool.mjs general
 *
 *   # Single code:
 *   echo "MAXX-AAAA-BBBB-CCCC-DDDD" | node scripts/upload-pool.mjs founder
 *
 * Requires wrangler CLI authenticated (same auth used to deploy
 * tickets-worker). Pool name must be lowercase alphanumeric / dash /
 * underscore, ≤32 chars — matches the validation in worker.js.
 *
 * Bulk uploads are sequential `wrangler kv key put` calls, ~1-2s each.
 * Acceptable for the typical 10-100 codes per batch; if Diggy ever
 * needs to upload 1000+, switch to the `wrangler kv bulk put`
 * subcommand with a JSON file.
 */

import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TICKETS_WORKER_DIR = resolve(__dirname, '..', 'tickets-worker');

const pool = (process.argv[2] || '').toLowerCase();
if (!/^[a-z0-9_-]{1,32}$/.test(pool)) {
    console.error('Usage: <stdin-with-codes> | node scripts/upload-pool.mjs <pool-name>');
    console.error('  pool-name: lowercase alphanumeric / dash / underscore, ≤32 chars.');
    process.exit(2);
}

// ─── Read stdin ────────────────────────────────────────────────────────────
const stdinBuf = [];
process.stdin.on('data', chunk => stdinBuf.push(chunk));
process.stdin.on('end', main);

function normalizeCode(raw) {
    return raw.toUpperCase().replace(/^MAXX-?/, '').replace(/[-\s]/g, '');
}

const CROCKFORD_RE = /^[0-9A-HJKMNP-Z]{16}$/;

async function main() {
    const raw = Buffer.concat(stdinBuf).toString('utf8');
    const codes = [];
    for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const norm = normalizeCode(t);
        if (!CROCKFORD_RE.test(norm)) {
            console.error(`[upload-pool] ⚠ skipped invalid line: ${JSON.stringify(t)}`);
            continue;
        }
        codes.push(norm);
    }
    if (!codes.length) {
        console.error('[upload-pool] no valid codes found on stdin.');
        process.exit(3);
    }

    // De-dupe (in case mint output gets shuffled into the same stream).
    const seen = new Set();
    const unique = codes.filter(c => {
        if (seen.has(c)) return false;
        seen.add(c);
        return true;
    });
    console.log(`[upload-pool] ${unique.length} unique code(s) → pool "${pool}"`);
    console.log(`[upload-pool] wrangler dir: ${TICKETS_WORKER_DIR}`);
    console.log();

    let ok = 0;
    let fail = 0;
    for (const code of unique) {
        const key = `unused:${pool}:${code}`;
        const args = [
            'kv', 'key', 'put',
            '--binding=VIP_CODE_POOL',
            '--remote',
            key, '1',
        ];
        const r = spawnSync('wrangler', args, {
            cwd: TICKETS_WORKER_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: process.platform === 'win32',  // wrangler is wrangler.cmd on Windows
        });
        if (r.status === 0) {
            ok++;
            process.stdout.write('.');
        } else {
            fail++;
            console.error(`\n[upload-pool] ✗ ${code}: ${r.stderr?.toString().trim() || 'wrangler exit ' + r.status}`);
        }
    }
    console.log();
    console.log(`[upload-pool] ${ok} uploaded, ${fail} failed.`);
    if (fail > 0) process.exit(1);
}
