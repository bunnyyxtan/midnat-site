#!/usr/bin/env node
/**
 * Sync the public site's deployment manifest from the canonical protocol
 * manifest.
 *
 * LAW: the public site must never hand-maintain a second authority for the
 * deployment. `lib/protocol/deployments/1952-release.json` atomically selects
 * and hashes the one source-of-truth manifest.
 * The site cannot import a file outside its own root (Vite and tsconfig only
 * include `src`), so it keeps a *generated* copy at `src/deployments/1952.json`
 * that this script writes byte-for-byte from the canonical file. It is
 * deterministic: parse the canonical JSON, re-serialise with a fixed 2-space
 * indent and a trailing newline, and write. Running it twice is a no-op.
 *
 * The drift check that keeps the two honest lives in `src/site-truth.test.ts`
 * ("matches the canonical protocol manifest ...") and fails if this script has
 * not been run after the canonical manifest changed.
 *
 *   node scripts/sync-deployment.mjs          # write the copy
 *   node scripts/sync-deployment.mjs --check   # exit non-zero if it would change
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEPLOYMENTS = join(here, '..', '..', '..', 'lib', 'protocol', 'deployments');
const SELECTOR = join(DEPLOYMENTS, '1952-release.json');
const COPY = join(here, '..', 'src', 'deployments', '1952.json');

if (!existsSync(SELECTOR)) {
  console.error(`release selector not found at ${SELECTOR}`);
  console.error('this script only runs inside the protocol workspace; nothing to do.');
  process.exit(existsSync(COPY) ? 0 : 1);
}

const selector = JSON.parse(readFileSync(SELECTOR, 'utf8'));
if (
  selector.chainId !== 1952 ||
  typeof selector.manifest !== 'string' ||
  basename(selector.manifest) !== selector.manifest
) {
  throw new Error('invalid chain-1952 release selector');
}
const canonicalPath = join(DEPLOYMENTS, selector.manifest);
const canonicalBytes = readFileSync(canonicalPath);
const actualSha256 = createHash('sha256').update(canonicalBytes).digest('hex');
if (actualSha256 !== selector.manifestSha256) {
  throw new Error(
    `release selector hash mismatch: expected ${selector.manifestSha256}, got ${actualSha256}`,
  );
}
const canonical = JSON.parse(canonicalBytes.toString('utf8'));
const rendered = `${JSON.stringify(canonical, null, 2)}\n`;
const current = existsSync(COPY) ? readFileSync(COPY, 'utf8') : null;

const check = process.argv.includes('--check');
if (rendered === current) {
  console.log('site deployment manifest is in sync with the canonical manifest.');
  process.exit(0);
}

if (check) {
  console.error('site deployment manifest has drifted from the canonical manifest.');
  console.error('run: node scripts/sync-deployment.mjs');
  process.exit(1);
}

writeFileSync(COPY, rendered);
console.log(`wrote ${COPY} from ${selector.manifest} (${rendered.length} bytes).`);
