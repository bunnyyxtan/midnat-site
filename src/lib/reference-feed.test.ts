import { describe, expect, it } from 'vitest';
import {
  axisTicks,
  buildFeed,
  feedGeometry,
  pickFeatured,
  PLOT_RIGHT,
  rowProvenance,
  type FeedPoint,
  type MarketRow,
} from './reference-feed';

/**
 * The hero chart is the first thing a visitor sees and it used to be a sine
 * wave. These tests pin the part that turns real closes into the drawn path,
 * so a future change cannot quietly reintroduce a shape that owes nothing to
 * the data.
 */

const hour = 3600;

function series(closes: readonly number[], startT = 1_700_000_000): FeedPoint[] {
  return closes.map((c, i) => ({ t: startT + i * hour, c }));
}

/** Pull the numeric pairs back out of an SVG path so we can assert on them. */
function coords(path: string): Array<[number, number]> {
  return path
    .replace(/^M/, '')
    .split(/\s*L\s*/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return [x, y] as [number, number];
    });
}

describe('feedGeometry', () => {
  it('refuses to draw anything from fewer than two points', () => {
    expect(feedGeometry([])).toBeNull();
    expect(feedGeometry(series([100]))).toBeNull();
  });

  it('refuses to draw when every point shares one timestamp', () => {
    const stacked: FeedPoint[] = [
      { t: 1_700_000_000, c: 100 },
      { t: 1_700_000_000, c: 105 },
    ];
    expect(feedGeometry(stacked)).toBeNull();
  });

  it('spans the plot width and puts the head on the last close', () => {
    const geo = feedGeometry(series([100, 101, 102, 103]));
    expect(geo).not.toBeNull();
    const points = coords(geo!.line);
    expect(points[0]![0]).toBeCloseTo(0, 6);
    expect(points[points.length - 1]![0]).toBeCloseTo(PLOT_RIGHT, 6);
    expect(geo!.headX).toBeCloseTo(PLOT_RIGHT, 6);
    // Highest close in the series, so it sits at the top of the band.
    expect(geo!.headY).toBeLessThan(points[0]![1]);
  });

  it('maps the highest and lowest closes to the band edges', () => {
    const geo = feedGeometry(series([50, 150, 100]));
    const ys = coords(geo!.line).map(([, y]) => y);
    // Low close is drawn lowest on screen, which is the largest y.
    expect(Math.max(...ys)).toBeCloseTo(34, 6);
    expect(Math.min(...ys)).toBeCloseTo(6, 6);
  });

  it('draws a flat series level instead of amplifying a straight line', () => {
    const geo = feedGeometry(series([200, 200, 200, 200]));
    const ys = coords(geo!.line).map(([, y]) => y);
    for (const y of ys) expect(y).toBeCloseTo(20, 6);
  });

  it('places points by real elapsed time, so a gap stays a gap', () => {
    // Three closes an hour apart, then a six hour hole before the last one.
    const withHole: FeedPoint[] = [
      { t: 0, c: 10 },
      { t: hour, c: 11 },
      { t: 2 * hour, c: 12 },
      { t: 8 * hour, c: 13 },
    ];
    const xs = coords(feedGeometry(withHole)!.line).map(([x]) => x);
    const span = 8 * hour;
    expect(xs[1]).toBeCloseTo((hour / span) * PLOT_RIGHT, 6);
    expect(xs[2]).toBeCloseTo(((2 * hour) / span) * PLOT_RIGHT, 6);
    expect(xs[3]).toBeCloseTo(PLOT_RIGHT, 6);
    // The hole is six times the gap before it and must be drawn that way.
    const lastGap = xs[3]! - xs[2]!;
    const priorGap = xs[2]! - xs[1]!;
    expect(lastGap / priorGap).toBeCloseTo(6, 6);
  });

  it('closes the fill down to the baseline at both ends', () => {
    const geo = feedGeometry(series([100, 120, 110]));
    expect(geo!.fill.startsWith('M0.00,40')).toBe(true);
    expect(geo!.fill.trimEnd().endsWith('40 Z')).toBe(true);
  });

  it('produces a path with one drawn point per close', () => {
    const closes = [1, 2, 3, 4, 5, 6, 7];
    expect(coords(feedGeometry(series(closes))!.line)).toHaveLength(closes.length);
  });
});

/**
 * The axis is a claim about elapsed time. It used to be a fixed
 * −24h/−18h/−12h/−6h/Now ruler printed under whatever series came back, which
 * asserted a day the chart had not read: twenty-four hourly closes span
 * twenty-three hours, and a market that has only published for six returns six.
 */
describe('the axis describes the window actually plotted', () => {
  it('calls twenty-four hourly closes twenty-three hours, because that is what they span', () => {
    const ticks = axisTicks(series(Array.from({ length: 24 }, (_, i) => 300 + i)));
    expect(ticks[0]).toBe('\u221223h');
    expect(ticks).toHaveLength(5);
  });

  it('shrinks with the data instead of claiming a full day', () => {
    // Six closes span five hours. The old ruler would still have said 24h.
    expect(axisTicks(series([1, 2, 3, 4, 5, 6]))[0]).toBe('\u22125h');
  });

  it('quarters the real span', () => {
    const ticks = axisTicks(series(Array.from({ length: 13 }, (_, i) => 100 + i)));
    // Twelve hours of span, quartered.
    expect(ticks).toEqual(['\u221212h', '\u22129h', '\u22126h', '\u22123h', 'Now']);
  });

  it('keeps one decimal under ten hours, where 23h vs 24h precision matters', () => {
    const pts: FeedPoint[] = [
      { t: 1_700_000_000, c: 10 },
      { t: 1_700_000_000 + Math.round(2.5 * hour), c: 11 },
    ];
    expect(axisTicks(pts)[0]).toBe('\u22122.5h');
  });

  it('uses minutes for a short window', () => {
    const pts: FeedPoint[] = [
      { t: 1_700_000_000, c: 10 },
      { t: 1_700_000_000 + 1800, c: 11 },
    ];
    expect(axisTicks(pts)[0]).toBe('\u221230m');
  });

  it('ends at now', () => {
    expect(axisTicks(series([1, 2, 3])).at(-1)).toBe('Now');
  });

  it('draws no axis when there is no window to describe', () => {
    expect(axisTicks([])).toEqual([]);
    expect(axisTicks(series([1]))).toEqual([]);
    // Every point at the same instant is not a span.
    expect(axisTicks([
      { t: 1_700_000_000, c: 1 },
      { t: 1_700_000_000, c: 2 },
    ])).toEqual([]);
  });

  it('reads as one ruler: precision is chosen from the span, not per tick', () => {
    // 23h of span. Quartering it gives 17.25 and 5.75, which would otherwise
    // print as a whole number beside a decimal.
    const ticks = axisTicks(series(Array.from({ length: 24 }, (_, i) => 300 + i)));
    expect(ticks.slice(0, 4).every((t) => !t.includes('.'))).toBe(true);
    expect(ticks).toEqual(['\u221223h', '\u221217h', '\u221212h', '\u22126h', 'Now']);
  });
});

/**
 * Fail closed on a malformed payload.
 *
 * `typeof x === 'number'` is true of NaN and of Infinity. A feed that answers
 * with either would have rendered "$NaN" beside the words SIGNED REFERENCE, or
 * pushed a NaN into the SVG path and drawn nothing while still claiming a
 * price. Neither is a reading, so neither is a feed.
 */
describe('a malformed payload is not a reading', () => {
  const row = (over: Partial<MarketRow> = {}): MarketRow =>
    ({ symbol: 'AAPL', chainListed: true, markPrice: 310.5, ...over }) as MarketRow;

  const candles = [
    { t: 1_700_000_000, c: 300 },
    { t: 1_700_003_600, c: 301 },
  ];

  it('refuses a non-finite mark rather than printing it', () => {
    for (const markPrice of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(buildFeed(row({ markPrice }), candles)).toBeNull();
      expect(pickFeatured([row({ markPrice })])).toBeNull();
    }
  });

  it('refuses a mark of zero or less', () => {
    expect(buildFeed(row({ markPrice: 0 }), candles)).toBeNull();
    expect(buildFeed(row({ markPrice: -1 }), candles)).toBeNull();
  });

  it('drops candles carrying a non-finite timestamp or close', () => {
    const dirty = [
      { t: Number.NaN, c: 300 },
      { t: 1_700_000_000, c: 300 },
      { t: 1_700_003_600, c: Number.POSITIVE_INFINITY },
      { t: 1_700_007_200, c: 302 },
    ];
    const feed = buildFeed(row(), dirty);
    expect(feed?.points).toEqual([
      { t: 1_700_000_000, c: 300 },
      { t: 1_700_007_200, c: 302 },
    ]);
    // And the geometry built from them is finite in both axes.
    const geo = feedGeometry(feed!.points)!;
    expect(geo.line.includes('NaN')).toBe(false);
    expect(Number.isFinite(geo.headX) && Number.isFinite(geo.headY)).toBe(true);
  });

  it('draws nothing when too few candles survive the filter', () => {
    expect(buildFeed(row(), [{ t: Number.NaN, c: 1 }, { t: 1, c: Number.NaN }])).toBeNull();
    expect(buildFeed(row(), 'not an array')).toBeNull();
    expect(buildFeed(row(), null)).toBeNull();
  });

  it('reports an unusable change or age as absent, not as a number', () => {
    const feed = buildFeed(
      row({ change24h: Number.NaN, referenceAgeSec: Number.POSITIVE_INFINITY }),
      candles,
    );
    expect(feed?.change24h).toBeNull();
    expect(feed?.referenceAgeSec).toBeNull();
  });

  it('will not feature a market the chain does not list, or one with no symbol', () => {
    expect(pickFeatured([row({ chainListed: false })])).toBeNull();
    expect(pickFeatured([row({ symbol: '' })])).toBeNull();
    expect(pickFeatured([])).toBeNull();
  });

  it('picks the same market whatever order the API returns', () => {
    const rows = [row({ symbol: 'TSLA' }), row({ symbol: 'AAPL' }), row({ symbol: 'NVDA' })];
    expect(pickFeatured(rows)?.symbol).toBe('AAPL');
    expect(pickFeatured([...rows].reverse())?.symbol).toBe('AAPL');
  });
});

/**
 * A simulated print rendered under the words "signed reference" is a lie about
 * provenance, and it is the exact shape the hero takes when the engine runs in
 * demo mode: the payload still carries a price, a 24h change and an age of a
 * couple of seconds, so nothing about the numbers themselves gives it away.
 *
 * The engine labels its own output. These tests pin that this site reads the
 * label instead of assuming a signed feed, in both directions -- a live payload
 * must not be downgraded to simulated either, or the site understates a real
 * deployment.
 */
describe('the hero reports the provenance the engine declares', () => {
  const row = (over: Partial<MarketRow> = {}): MarketRow =>
    ({ symbol: 'AAPL', chainListed: true, markPrice: 310.5, ...over }) as MarketRow;

  const candles = [
    { t: 1_700_000_000, c: 300 },
    { t: 1_700_003_600, c: 301 },
  ];

  const signed = {
    dataState: 'REAL',
    referenceSource: { provider: 'PYTH', feedSymbol: 'Equity.US.NVDA/USD', feedKind: 'EQUITY_SESSION' },
  } as Partial<MarketRow>;

  it('reads a DEMO data state as simulated', () => {
    expect(rowProvenance(row({ dataState: 'DEMO' }))).toBe('simulated');
  });

  it('reads a SIMULATED feed kind as simulated even when the data state looks real', () => {
    expect(
      rowProvenance(
        row({
          dataState: 'REAL',
          referenceSource: { provider: 'MIDNAT_DEMO', feedSymbol: 'x', feedKind: 'SIMULATED' },
        }),
      ),
    ).toBe('simulated');
  });

  it('calls a real anchor on a real market feed signed', () => {
    expect(rowProvenance(row(signed))).toBe('signed');
  });

  it('refuses to call anything else signed', () => {
    // An unlabelled payload is the one that used to read as signed by default.
    expect(rowProvenance(row())).toBe('unknown');
    expect(rowProvenance(null)).toBe('unknown');
    // No anchor read yet.
    expect(rowProvenance(row({ ...signed, dataState: 'BOOT' }))).toBe('unknown');
    // Real anchor, but the feed behind it is gone.
    expect(
      rowProvenance(
        row({
          dataState: 'REAL',
          referenceSource: { provider: 'PYTH', feedSymbol: 'x', feedKind: 'UNAVAILABLE' },
        }),
      ),
    ).toBe('unknown');
    // Half a payload is not a signature.
    expect(rowProvenance(row({ dataState: 'REAL' }))).toBe('unknown');
  });

  it('carries the provenance onto the feed the hero renders', () => {
    expect(buildFeed(row({ dataState: 'DEMO' }), candles)?.provenance).toBe('simulated');
    expect(buildFeed(row(signed), candles)?.provenance).toBe('signed');
    expect(buildFeed(row(), candles)?.provenance).toBe('unknown');
  });
});
