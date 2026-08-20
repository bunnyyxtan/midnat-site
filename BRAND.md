# MIDNAT Brand Contract

Status: binding for every MIDNAT surface, repository, release, social card and generated artifact.

## The name

- The display name is `MIDNAT`, always in uppercase.
- It is one word. Never write the mark as `Midnat`, `MidNat`, `Midnight`, `midnat`, `MID NAT` or `MID-NAT`.
- In running prose it remains `MIDNAT` because it is a mark, not a common noun.
- The ordinary word `midnight` remains valid when it refers to the time of night or explains the Danish meaning of the name. It must never replace the mark.

## Public voice

- Write like an exchange operator: precise, restrained and evidence-led.
- State what is live, what is testnet-only and what remains unknown.
- Never imply guaranteed returns, guaranteed safety, a completed audit, real-money readiness or capabilities that have not been verified.
- Keep review and audit status on the dedicated Security surface. Global navigation, footers and landing chrome carry only stable operational facts.
- Do not use em dashes or en dashes in public copy.
- Do not publish Replit, agent, scaffold, starter-template or platform attribution in product copy, social metadata or public assets.

## Technical exceptions

These are identifiers, not display-name exceptions:

- domains such as `midnat.xyz`
- package names, paths, slugs and storage keys
- environment variables and data-test IDs
- deployed contract symbols such as `MidnatVault`
- explicitly labelled incorrect examples on the Brand page

Do not rename technical identifiers merely to satisfy the display rule.

## Repository requirement

Every MIDNAT repository must carry this contract and an automated `brand:check` command. The check must run in CI or the repository build and cover:

1. visible JSX and user-facing copy objects
2. HTML title, description, Open Graph and Twitter metadata
3. navigation and footer chrome
4. generated or staged public output
5. public platform attribution and assets

A new repository is not release-ready until the contract and check are present.