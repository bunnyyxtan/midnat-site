import { useEffect, useState } from 'react';

/**
 * The reference feed behind the landing hero.
 *
 * The hero used to draw a sine wave under the words "Oracle feed" and a
 * pulsing "LIVE" badge. Nothing was live: the curve was three sine terms and
 * the only real input was the clock, which set where the head sat on the axis.
 * A visitor reading it as a price was reading a decoration.
 *
 * So it reads the same API the trading app reads. Every number rendered in the
 * hero comes from here, and when this cannot be read the hero says so instead
 * of drawing something. There is no fallback series on purpose: an invented
 * curve is worse than an empty card.
 */

const API_BASE = '/api';
const POLL_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 8_000;
/** One trading day of hourly closes. */
const CANDLE_INTERVAL = '1h';
const CANDLE_LIMIT = 24;

/**
 * `typeof x === 'number'` is true of NaN and of Infinity, and a malformed
 * payload is exactly where those arrive. Rendering `$NaN` beside a signed
 * reference, or feeding one into the SVG path, is the fabrication this file
 * exists to prevent -- so every number crossing the boundary is checked finite.
 */
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export interface MarketRow {
  readonly symbol: string;
  readonly name?: string;
  readonly markPrice?: number;
  readonly referenceState?: string;
  readonly referenceAgeSec?: number | null;
  readonly referenceQuality?: string;
  readonly change24h?: number;
  readonly chainListed?: boolean;
}

interface Candle {
  readonly t: number;
  readonly c: number;
}

export interface FeedPoint {
  /** Seconds since epoch. */
  readonly t: number;
  readonly c: number;
}

export interface ReferenceFeed {
  readonly symbol: string;
  readonly name: string | null;
  readonly price: number;
  /** Percent, as the API reports it. Null when the API omits it. */
  readonly change24h: number | null;
  readonly referenceState: string;
  readonly referenceAgeSec: number | null;
  readonly referenceQuality: string | null;
  readonly points: readonly FeedPoint[];
}

export type FeedStatus = 'loading' | 'ready' | 'unavailable';

export interface FeedResult {
  readonly status: FeedStatus;
  readonly feed: ReferenceFeed | null;
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * The market the hero shows. Chain-listed only: an unlisted symbol is priced
 * by the reference engine but cannot be traded, and the hero sits directly
 * above a "Start trading" button.
 *
 * Sorted before choosing so the hero does not change market because the API
 * changed its ordering.
 */
export function pickFeatured(markets: readonly MarketRow[]): MarketRow | null {
  const listed = markets
    .filter(
      (m) =>
        m?.chainListed === true &&
        typeof m.symbol === 'string' &&
        m.symbol.length > 0 &&
        finite(m.markPrice) &&
        (m.markPrice as number) > 0,
    )
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  return listed[0] ?? null;
}

/**
 * Turn one market row and its candles into the feed the hero renders, or into
 * nothing. Pure, so the malformed-payload cases are testable without a network.
 */
export function buildFeed(featured: MarketRow | null, candles: unknown): ReferenceFeed | null {
  if (!featured || !finite(featured.markPrice) || featured.markPrice <= 0) return null;

  const points = (Array.isArray(candles) ? candles : [])
    .filter((c): c is Candle => finite(c?.t) && finite(c?.c))
    .map((c) => ({ t: c.t, c: c.c }))
    .sort((a, b) => a.t - b.t);

  // A single point is not a series. Rather than stretch one close across the
  // axis, treat it as nothing to draw.
  if (points.length < 2) return null;

  return {
    symbol: featured.symbol,
    name: featured.name ?? null,
    price: featured.markPrice,
    change24h: finite(featured.change24h) ? featured.change24h : null,
    referenceState: featured.referenceState ?? 'UNKNOWN',
    referenceAgeSec: finite(featured.referenceAgeSec) ? featured.referenceAgeSec : null,
    referenceQuality: featured.referenceQuality ?? null,
    points,
  };
}

async function readFeed(signal: AbortSignal): Promise<ReferenceFeed | null> {
  const payload = await getJson<MarketRow[] | { markets?: MarketRow[] }>('/markets', signal);
  const markets = Array.isArray(payload) ? payload : (payload.markets ?? []);
  const featured = pickFeatured(markets);
  if (!featured) return null;

  const candles = await getJson<unknown>(
    `/candles?symbol=${encodeURIComponent(featured.symbol)}&interval=${CANDLE_INTERVAL}&limit=${CANDLE_LIMIT}`,
    signal,
  );
  return buildFeed(featured, candles);
}

export function useReferenceFeed(): FeedResult {
  const [result, setResult] = useState<FeedResult>({ status: 'loading', feed: null });

  useEffect(() => {
    let cancelled = false;

    const tick = async (): Promise<void> => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const feed = await readFeed(controller.signal);
        if (cancelled) return;
        setResult(feed ? { status: 'ready', feed } : { status: 'unavailable', feed: null });
      } catch {
        if (cancelled) return;
        // The card goes out whole.
        //
        // Keeping the last reading was tried and is wrong: the age freezes, the
        // 24h change stops rolling, and the head of the chart keeps calling
        // itself NOW. Stripping the age alone does not fix that -- the numbers
        // left behind still present themselves as current, and a reader has no
        // way to tell which of them the page can still stand behind. Thirty
        // seconds of an honest empty card beats any of it.
        setResult({ status: 'unavailable', feed: null });
      } finally {
        window.clearTimeout(timer);
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return result;
}

/**
 * The session regime the engine is actually in.
 *
 * The landing page used to decide this in the browser: weekday, and local time
 * between 09:30 and 16:00. That is roughly right for New York and wrong for
 * every other exchange, it does not know about holidays or half days, and it
 * had no connection to the regime the funding and leverage rules actually use.
 * This reads the engine's own answer instead.
 */
export type MarketRegime = 'LIVE' | 'AFTER_HOURS' | 'WEEKEND' | 'UNKNOWN';

export interface MarketState {
  readonly regime: MarketRegime;
  readonly headline: string | null;
}

export function useMarketRegime(): MarketState | null {
  const [state, setState] = useState<MarketState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async (): Promise<void> => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const payload = await getJson<{ regime?: string; headline?: string }>(
          '/market-state',
          controller.signal,
        );
        if (cancelled) return;
        const regime = payload.regime;
        setState({
          regime:
            regime === 'LIVE' || regime === 'AFTER_HOURS' || regime === 'WEEKEND'
              ? regime
              : 'UNKNOWN',
          headline: payload.headline ?? null,
        });
      } catch {
        // Leave it null: the chip renders no session claim rather than guessing one.
        if (!cancelled) setState((prev) => prev);
      } finally {
        window.clearTimeout(timer);
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return state;
}

/** Right edge of the plotted series, leaving the margin the hero composition expects. */
export const PLOT_RIGHT = 96;

/**
 * Axis labels for the window that was actually plotted.
 *
 * The axis used to be a fixed −24h/−18h/−12h/−6h/Now ruler under whatever
 * series the API returned. Those are not the same thing: twenty-four hourly
 * closes span twenty-three hours, and a market that has published for six hours
 * returns six. The ruler asserted a day the chart had not read. These labels
 * are derived from the first and last timestamps on screen, so the axis can
 * only ever describe the data under it.
 */
export function axisTicks(points: readonly FeedPoint[]): readonly string[] {
  if (points.length < 2) return [];
  const first = points[0] as FeedPoint;
  const last = points[points.length - 1] as FeedPoint;
  const spanSec = last.t - first.t;
  if (spanSec <= 0) return [];

  // Precision is chosen once, from the whole span, so the ticks read as one
  // ruler rather than a mix of "17h" and "5.8h". A short window keeps a decimal
  // because there the difference is most of the claim.
  const decimals = spanSec < 10 * 3600 ? 1 : 0;
  const ago = (sec: number): string => {
    if (sec < 90) return `−${Math.round(sec)}s`;
    if (sec < 5400) return `−${Math.round(sec / 60)}m`;
    const hours = sec / 3600;
    const factor = 10 ** decimals;
    return `−${Math.round(hours * factor) / factor}h`;
  };

  return [ago(spanSec), ago(spanSec * 0.75), ago(spanSec * 0.5), ago(spanSec * 0.25), 'Now'];
}

export interface FeedGeometry {
  readonly line: string;
  readonly fill: string;
  readonly headX: number;
  readonly headY: number;
}

/**
 * Real closes into the hero's 100x40 viewBox. X is real elapsed time, so a gap
 * in the series shows as a gap rather than being closed up.
 */
export function feedGeometry(points: readonly FeedPoint[]): FeedGeometry | null {
  if (points.length < 2) return null;

  const first = points[0] as FeedPoint;
  const last = points[points.length - 1] as FeedPoint;
  const span = last.t - first.t;
  if (span <= 0) return null;

  const closes = points.map((p) => p.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min;

  const TOP = 6;
  const BOTTOM = 34;
  const x = (t: number): number => ((t - first.t) / span) * PLOT_RIGHT;
  // A flat day is a real result: draw it level rather than amplifying noise.
  const y = (c: number): number =>
    range === 0 ? (TOP + BOTTOM) / 2 : BOTTOM - ((c - min) / range) * (BOTTOM - TOP);

  const coords = points.map((p) => `${x(p.t).toFixed(2)},${y(p.c).toFixed(2)}`);
  return {
    line: `M${coords.join(' L')}`,
    fill: `M${x(first.t).toFixed(2)},40 L${coords.join(' L')} L${x(last.t).toFixed(2)},40 Z`,
    headX: x(last.t),
    headY: y(last.c),
  };
}
