import { describe, expect, it } from 'vitest';
import { collectiveProvenance, isSimulated, provenanceOf } from './provenance';

/**
 * This module decides whether the site is allowed to call a number signed. The
 * cost of the two possible mistakes is not symmetric: understating a real
 * deployment is embarrassing, presenting a simulated price as a signed on-chain
 * one is a lie about provenance. So the tests below care most about what does
 * NOT earn the word "signed".
 */
describe('provenanceOf', () => {
  const signed = { dataState: 'REAL', feedKind: 'EQUITY_SESSION' };

  it('recognises a real anchor on a real market feed', () => {
    expect(provenanceOf(signed)).toBe('signed');
    expect(provenanceOf({ dataState: 'REAL', feedKind: 'TOKENIZED_24_7' })).toBe('signed');
  });

  it('recognises both spellings the engine uses for a simulation', () => {
    // Markets say DEMO, reference health says SIM. A surface that knows only
    // one of them reads the other mode as real.
    expect(provenanceOf({ dataState: 'DEMO', feedKind: 'SIMULATED' })).toBe('simulated');
    expect(provenanceOf({ dataState: 'SIM', feedKind: 'SIMULATED' })).toBe('simulated');
  });

  it('lets either marker alone establish a simulation', () => {
    expect(provenanceOf({ dataState: 'DEMO' })).toBe('simulated');
    expect(provenanceOf({ feedKind: 'SIMULATED' })).toBe('simulated');
    // A simulated feed kind outranks a data state that claims to be real.
    expect(provenanceOf({ dataState: 'REAL', feedKind: 'SIMULATED' })).toBe('simulated');
  });

  it('is fail-closed: anything it cannot positively verify is unknown', () => {
    expect(provenanceOf(null)).toBe('unknown');
    expect(provenanceOf(undefined)).toBe('unknown');
    expect(provenanceOf({})).toBe('unknown');
    // Half a payload is not a signature.
    expect(provenanceOf({ dataState: 'REAL' })).toBe('unknown');
    expect(provenanceOf({ feedKind: 'EQUITY_SESSION' })).toBe('unknown');
    // The engine has not read an anchor yet.
    expect(provenanceOf({ dataState: 'BOOT', feedKind: 'EQUITY_SESSION' })).toBe('unknown');
    // Real anchor, but the feed behind it is gone.
    expect(provenanceOf({ dataState: 'REAL', feedKind: 'UNAVAILABLE' })).toBe('unknown');
    // A value from a schema version this site has never seen.
    expect(provenanceOf({ dataState: 'SOMETHING_NEW', feedKind: 'SOMETHING_NEW' })).toBe('unknown');
    expect(provenanceOf({ dataState: null, feedKind: null })).toBe('unknown');
  });

  it('never reports unknown as simulated', () => {
    // Callers suppressing a live claim must test for !== 'signed', not this.
    expect(isSimulated({})).toBe(false);
    expect(isSimulated({ dataState: 'DEMO' })).toBe(true);
  });
});

describe('collectiveProvenance', () => {
  const signed = { dataState: 'REAL', feedKind: 'EQUITY_SESSION' };
  const sim = { dataState: 'SIM', feedKind: 'SIMULATED' };

  it('will not describe a group as signed unless every row is', () => {
    expect(collectiveProvenance([signed, signed])).toBe('signed');
    expect(collectiveProvenance([signed, {}])).toBe('unknown');
  });

  it('lets one simulated row taint the whole group', () => {
    // A page shows one banner over the table. If any row is simulated the
    // banner must not say signed.
    expect(collectiveProvenance([signed, sim])).toBe('simulated');
    expect(collectiveProvenance([sim])).toBe('simulated');
  });

  it('treats an empty set as unknown rather than vacuously signed', () => {
    expect(collectiveProvenance([])).toBe('unknown');
  });
});
