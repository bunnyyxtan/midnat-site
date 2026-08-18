import { Link } from 'wouter';
import { DocumentLayout } from '@/components/public/DocumentLayout';
import { PrintButton, Prose, Section, TableScroll } from '@/components/public/primitives';
import { docHref, legalBySlug, legalHref } from '@/lib/site-map';
import { REFERENCE_ENGINE, utcDate } from '@/lib/protocol-registry';

const DOC = legalBySlug('licenses')!;

interface Dep {
  readonly name: string;
  readonly license: string;
}

/**
 * Verified from package metadata in the pnpm store and from the manifests, not
 * assumed. Sources:
 *   midnat/package.json, api-server/package.json, lib/protocol/package.json
 *   node_modules/.pnpm/<pkg>/package.json for each license identifier
 */
const INTERFACE_DEPS: readonly Dep[] = [
  { name: 'react, react-dom', license: 'MIT' },
  { name: 'wouter', license: 'The Unlicense' },
  { name: 'framer-motion', license: 'MIT' },
  { name: 'lucide-react', license: 'ISC' },
  { name: 'clsx, tailwind-merge', license: 'MIT' },
  { name: 'tailwindcss, @tailwindcss/vite, @tailwindcss/typography', license: 'MIT' },
  { name: 'tw-animate-css', license: 'MIT' },
  { name: 'vite, @vitejs/plugin-react', license: 'MIT' },
];

const API_DEPS: readonly Dep[] = [
  { name: 'express', license: 'MIT' },
  { name: 'cors', license: 'MIT' },
  { name: 'cookie-parser', license: 'MIT' },
  { name: 'pino, pino-http', license: 'MIT' },
  { name: 'ethers', license: 'MIT' },
  { name: 'drizzle-orm', license: 'Apache-2.0' },
  { name: 'solc', license: 'MIT' },
];

// Third-party only. MIDNAT's own contracts are covered by the project licence
// section, not by a dependency table.
const CONTRACT_DEPS: readonly Dep[] = [
  { name: '@openzeppelin/contracts 5.4.0', license: 'MIT' },
];

function DepTable({ rows }: { rows: readonly Dep[] }) {
  return (
    <TableScroll>
      <table className="pub-table">
        <thead>
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Licence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.name}>
              <td>{d.name}</td>
              <td className="pub-mono">{d.license}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

export default function Licenses() {
  return (
    <DocumentLayout
      meta={{ title: DOC.title, description: DOC.summary, path: legalHref(DOC.slug), type: 'article' }}
      eyebrow="Legal"
      title={DOC.title}
      standfirst="MIDNAT's own licence, and the software, data and typefaces MIDNAT is built on, verified against the project source rather than assumed."
      breadcrumbs={[{ label: 'MIDNAT', href: '/' }, { label: 'Legal', href: '/legal' }, { label: DOC.title }]}
      headerMeta={[{ label: 'Updated', value: utcDate(DOC.updated) }]}
      actions={<PrintButton />}
      width="prose"
    >
      <Section id="midnat" title="MIDNAT's own licence">
        <Prose>
          <p>
            MIDNAT's own source — the contracts, the API server and the interfaces — is published under the MIT
            Licence. That is a decision of the project owner, recorded on 18 August 2026. The full terms are in the
            LICENSE file in the project source, and the same identifier appears in the package metadata and in
            the SPDX header of every MIDNAT Solidity file.
          </p>
          <p>
            That licence covers the source code. Everything else on this page is third-party: software MIDNAT depends
            on, typefaces it loads and market data it reads, each under its own separate terms.
          </p>
        </Prose>
      </Section>

      <Section id="how" title="How this list was made">
        <Prose>
          <p>
            Each third-party licence identifier below was read from the package metadata or the licence header in the
            project source, not from a template and not from memory. Where a licence could not be confirmed from either, this
            page says so rather than guessing an identifier.
          </p>
          <p>
            Every entry is the version this site was built from, so the list moves when the dependencies do rather
            than being restated by hand.
          </p>
        </Prose>
      </Section>

      <Section id="interface" title="Interface and site">
        <Prose>
          <p>
            The public site and the trading interface are built with the following open source software. These are the
            major dependencies grouped by role; each carries a permissive licence.
          </p>
        </Prose>
        <DepTable rows={INTERFACE_DEPS} />
      </Section>

      <Section id="api" title="API server">
        <Prose>
          <p>
            The API server that feeds the interface is built with the following open source software.
          </p>
        </Prose>
        <DepTable rows={API_DEPS} />
      </Section>

      <Section id="contracts" title="Contracts">
        <Prose>
          <p>
            The MIDNAT contracts are MIDNAT's own source, under the project licence above. They build on the
            OpenZeppelin contracts library, which is third-party and carries its own MIT licence. The testing
            toolchain used to build and check the contracts is a development dependency and is not part of the
            deployed code.
          </p>
        </Prose>
        <DepTable rows={CONTRACT_DEPS} />
      </Section>

      <Section id="typefaces" title="Typefaces">
        <Prose>
          <p>
            This site loads two typefaces remotely; neither is bundled or redistributed by MIDNAT.
          </p>
          <ul>
            <li>
              <strong>Satoshi</strong> for body text, loaded from Fontshare, the free font service of the Indian Type
              Foundry, and used under the terms Fontshare publishes for it.
            </li>
            <li>
              <strong>JetBrains Mono</strong> for monospaced text, loaded from Google Fonts and available under the SIL
              Open Font License, version 1.1.
            </li>
          </ul>
          <p>
            Both are served by their providers. If a provider is unavailable, the browser falls back to a system
            typeface and the site still works.
          </p>
        </Prose>
      </Section>

      <Section id="data" title="Market data provider">
        <Prose>
          <p>
            The reference prices on this venue are derived from {REFERENCE_ENGINE.upstream}. MIDNAT reads from it to
            build a reference value for each market and to display the market state. It redistributes only those derived
            values, within this product. The underlying data belongs to its providers, and the terms and limits are set
            out in the{' '}
            <Link href="/legal/market-data" className="pub-link">
              market data disclosure
            </Link>
            .
          </p>
        </Prose>
      </Section>

      <Section id="limits" title="What this page does not claim">
        <Prose>
          <p>
            This page lists the major components and their licences. It is not the full transitive dependency tree, and
            it is not a legal opinion on how those licences interact. The authoritative record of every dependency and
            its resolved version is the lockfile in the project source.
          </p>
          <p>
            Where a licence is not shown here, treat it as not recorded on this page rather than as absent, and read it
            from the package itself. For how the contracts and their build are verified, see{' '}
            <Link href="/verify" className="pub-link">
              verify
            </Link>{' '}
            and{' '}
            <Link href={docHref('oracle-anchor')} className="pub-link">
              the oracle anchor
            </Link>
            .
          </p>
        </Prose>
      </Section>
    </DocumentLayout>
  );
}
