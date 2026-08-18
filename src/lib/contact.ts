/**
 * Every channel MIDNAT actually has, and the only place a handle or an address
 * is written down.
 *
 * LAW: a surface renders this list. It never hard-codes a handle, a URL or an
 * address of its own, and it never renders a slot for a channel that is not in
 * the list — an empty "email:" line is a promise the project cannot keep. The
 * list therefore holds only what exists today: one X account, no email, no
 * ticket queue, no phone number.
 *
 * Adding a channel later is one entry here. The footer maps `CONTACT_CHANNELS`,
 * so it appears there on its own. Prose surfaces name `PRIMARY_CONTACT` and gate
 * every "there is no email" clause on `HAS_EMAIL_CHANNEL`, so those clauses stop
 * claiming an absence the moment one exists. A page that should *name* a second
 * channel in a sentence still needs that sentence written — the entry buys you
 * the plumbing and the truth, not the copy.
 */

export interface ContactChannel {
  /** Stable id, used for keys and test ids. */
  readonly id: 'x' | 'email';
  /** The network's own name, as a reader would say it: "X", "Email". */
  readonly network: string;
  /** Exactly what a reader sees. Never a bare URL, never uppercased. */
  readonly display: string;
  /** Where the display text points. */
  readonly href: string;
  /** What this channel is, in one clause. Pages may use it or write their own. */
  readonly purpose: string;
}

/** The one published account. Lower case, no spaces: it is rendered verbatim. */
export const X_HANDLE = '@midnatxyz';

const X_CHANNEL: ContactChannel = {
  id: 'x',
  network: 'X',
  display: X_HANDLE,
  href: `https://x.com/${X_HANDLE.slice(1)}`,
  purpose: 'the only channel this project publishes',
};

/**
 * No email exists yet, so no page prints one. When one does, replace this null
 * with the channel and nothing else changes — the surfaces already iterate.
 */
const EMAIL_CHANNEL: ContactChannel | null = null;

/** Ordered as a reader should try them. Never empty: the X account exists. */
export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  X_CHANNEL,
  ...(EMAIL_CHANNEL ? [EMAIL_CHANNEL] : []),
];

/** The channel a page names when it names one. */
export const PRIMARY_CONTACT: ContactChannel = X_CHANNEL;

/**
 * True only when an email channel really exists. A page that would print
 * "email us" must gate on this rather than assuming one is there.
 */
export const HAS_EMAIL_CHANNEL: boolean = CONTACT_CHANNELS.some((c) => c.id === 'email');

/**
 * "@midnatxyz on X" — the phrase pages use inline, built once so the format
 * cannot drift between pages.
 */
export function contactPhrase(channel: ContactChannel = PRIMARY_CONTACT): string {
  return `${channel.display} on ${channel.network}`;
}
