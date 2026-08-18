import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { Callout, PrintButton, Prose, Section, TableScroll } from '@/components/public/primitives';
import { legalBySlug, legalHref } from '@/lib/site-map';
import { CANONICAL, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('cookies')!;

interface StorageKey {
  readonly name: string;
  readonly store: string;
  readonly surface: string;
  readonly purpose: string;
  readonly lifetime: string;
  readonly essential: string;
}

/**
 * Audited from the code, not a template. Sources:
 *   midnat/src/components/public/theme.tsx           theme
 *   app/src/lib/session.tsx                          wallet provider id
 *   app/src/lib/intelligence-identity.ts             fair-use session id
 *   app/src/lib/chart-store.ts                       chart prefs, drawings, tab
 *   app/src/lib/wallet/mobile-links.ts               wallet handoff
 * No code path in any of the three services sets a browser cookie.
 *
 * Both halves of that are pinned by site-truth.test.ts: it fails if any
 * shipped service writes a cookie, and it compares the table below against
 * every storage key the code actually writes, in both directions. Key names
 * are deliberately not repeated in this comment, so that a row deleted from
 * the table cannot be satisfied by a mention up here.
 */
const KEYS: readonly StorageKey[] = [
  {
    name: 'midnat-theme',
    store: 'localStorage',
    surface: 'This site',
    purpose: 'Remembers whether you chose the light or dark theme.',
    lifetime: 'Until you clear it',
    essential: 'Yes',
  },
  {
    name: 'midnat.wallet.v3',
    store: 'localStorage',
    surface: 'Trading app',
    purpose: 'Stores which wallet provider you last connected with, so it can reconnect. It stores the provider identifier only, never your address.',
    lifetime: 'Until you disconnect or clear it',
    essential: 'Yes',
  },
  {
    name: 'midnat.session.v1',
    store: 'localStorage',
    surface: 'Trading app',
    purpose:
      'A random id generated in your browser so your fair-use allowance for Intelligence follows you across reloads instead of being pooled with everyone on the same network. It is not a login and holds no personal information.',
    lifetime: 'Until you clear it',
    essential: 'Yes',
  },
  {
    name: 'midnat.chart.prefs.v1',
    store: 'localStorage',
    surface: 'Trading app',
    purpose: 'Keeps your chart preferences, such as the price scale mode and the last interval.',
    lifetime: 'Until you clear it',
    essential: 'No',
  },
  {
    name: 'midnat.chart.drawings.v1',
    store: 'localStorage',
    surface: 'Trading app',
    purpose: 'Keeps the drawings you place on a chart so they survive a reload.',
    lifetime: 'Until you clear it',
    essential: 'No',
  },
  {
    name: 'midnat.terminal.tab.v1',
    store: 'localStorage',
    surface: 'Trading app',
    purpose: 'Remembers which panel of the trading terminal you last had open.',
    lifetime: 'Until you clear it',
    essential: 'No',
  },
  {
    name: 'midnat.wallet.handoff.v1',
    store: 'sessionStorage',
    surface: 'Trading app',
    purpose: 'Holds short lived state while a mobile wallet handoff is in progress.',
    lifetime: 'Consumed and deleted, cleared when the tab closes',
    essential: 'Yes',
  },
];

export default function Cookies() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="Every key MIDNAT stores in your browser, why it exists and how long it lasts. There is no tracking here, so there is no consent banner."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Callout tone="note" title="No cookie, no tracking, no banner">
        MIDNAT sets no browser cookie. It stores a small number of keys in your browser's local and session storage,
        all listed below. There is no analytics cookie, no advertising cookie and no cross site tracking, so no consent
        banner is shown because nothing here requires consent.
      </Callout>

      <Section id="keys" title="Every key we store">
        <Prose>
          <p>
            The values below were read from the code, not adapted from a template. Local storage keys stay in your
            browser until you clear them. Session storage keys are cleared when you close the tab. Some keys belong to
            this documentation site and some to the trading app, and the table marks which is which.
          </p>
        </Prose>
        <TableScroll>
          <table className="pub-table">
            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Store</th>
                <th scope="col">Surface</th>
                <th scope="col">Purpose</th>
                <th scope="col">Lifetime</th>
                <th scope="col">Essential</th>
              </tr>
            </thead>
            <tbody>
              {KEYS.map((k) => (
                <tr key={k.name}>
                  <td className="pub-mono">{k.name}</td>
                  <td>{k.store}</td>
                  <td>{k.surface}</td>
                  <td>{k.purpose}</td>
                  <td>{k.lifetime}</td>
                  <td>{k.essential}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Section>

      <Section id="cookies" title="Cookies">
        <Prose>
          <p>
            No part of MIDNAT sets a browser cookie. The interface and this site use local and session storage instead,
            which stays on your device and is not sent with every request the way a cookie is. The API server reads
            request headers but does not set a session cookie or any other cookie.
          </p>
          <p>
            Because there is no cookie and no tracking technology, there is nothing to consent to under the rules that
            govern consent banners, and none is shown.
          </p>
        </Prose>
      </Section>

      <Section id="essential" title="Essential versus optional">
        <Prose>
          <p>
            A key marked essential is one the interface needs to work as you asked it to: the theme you chose, the
            wallet you connected, or the short lived state that completes a mobile wallet handoff. The rest keep your
            workspace as you left it and can be cleared without breaking anything.
          </p>
          <p>
            You can remove any of these at any time by clearing your browser's site data. Doing so resets the
            preference or the connection that key held, and nothing else is lost, because none of it leaves your device
            by way of these keys.
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this page does not cover">
        <Prose>
          <p>
            This page describes the keys MIDNAT sets. It does not describe what a wallet extension, a browser, or an
            operating system stores on their own account, because those are outside MIDNAT and outside its control.
          </p>
          <p>
            It also does not describe every request the interface makes to the API or to the chain. For the full data
            picture, including what leaves your browser when you use the app, read the{' '}
            <Link href="/legal/privacy" className="pub-link">
              privacy notice
            </Link>
            . {CANONICAL.testnet}
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
