/**
 * One answer to "is this number real", shared by every surface that renders
 * engine telemetry.
 *
 * The engine can run on a signed reference feed or on a deterministic
 * simulation, and it labels its own output either way. Two markers travel with
 * every reading:
 *
 *   dataState  REAL | BOOT | DEMO   (markets)
 *              REAL | BOOT | SIM    (reference health)
 *   feedKind   EQUITY_SESSION | TOKENIZED_24_7 | SIMULATED | UNAVAILABLE
 *
 * The two endpoints spell the simulated data state differently -- DEMO on a
 * market row, SIM on a reference-health row -- which is exactly why this lives
 * in one place. A page that hard-codes one spelling silently reads the other
 * mode as real.
 *
 * This is read from the payload rather than from a build flag on this site. The
 * process that produced the number is the one that knows what it is, so
 * pointing the engine back at a live feed needs no rebuild here.
 *
 * It is deliberately fail-closed. Only a positively signed reading -- a real
 * anchor from a real market feed -- earns the word "signed". Anything missing,
 * unrecognised or half-filled is 'unknown', and a caller must then make no
 * provenance claim at all. The failure that matters is presenting a simulated
 * price as a signed one; understating a real deployment is recoverable, the
 * reverse is not.
 *
 * BOOT is not signed: it means the engine has not read an anchor yet.
 */
export type Provenance = 'signed' | 'simulated' | 'unknown';

const SIMULATED_DATA_STATES: ReadonlySet<string> = new Set(['DEMO', 'SIM']);
const SIGNED_DATA_STATES: ReadonlySet<string> = new Set(['REAL']);
const SIGNED_FEED_KINDS: ReadonlySet<string> = new Set(['EQUITY_SESSION', 'TOKENIZED_24_7']);

/** The two fields any engine reading carries, however the surface nests them. */
export interface ProvenanceMarkers {
  readonly dataState?: string | null;
  readonly feedKind?: string | null;
}

export function provenanceOf(markers: ProvenanceMarkers | null | undefined): Provenance {
  if (!markers) return 'unknown';
  const dataState = markers.dataState ?? '';
  const feedKind = markers.feedKind ?? '';

  if (SIMULATED_DATA_STATES.has(dataState) || feedKind === 'SIMULATED') return 'simulated';
  if (SIGNED_DATA_STATES.has(dataState) && SIGNED_FEED_KINDS.has(feedKind)) return 'signed';
  return 'unknown';
}

/**
 * True only when the engine positively says it is simulating. An unreadable or
 * unlabelled payload is not simulated and not signed -- callers that need to
 * suppress a live claim should test for `provenanceOf(...) !== 'signed'`.
 */
export function isSimulated(markers: ProvenanceMarkers | null | undefined): boolean {
  return provenanceOf(markers) === 'simulated';
}

/**
 * The provenance of a set of readings taken together, for a page that shows one
 * banner over a table. Simulated wins: if any row is simulated the surface must
 * not describe the group as signed. Otherwise every row has to be positively
 * signed before the group is.
 */
export function collectiveProvenance(
  rows: readonly (ProvenanceMarkers | null | undefined)[],
): Provenance {
  if (rows.length === 0) return 'unknown';
  const each = rows.map(provenanceOf);
  if (each.includes('simulated')) return 'simulated';
  return each.every((p) => p === 'signed') ? 'signed' : 'unknown';
}
