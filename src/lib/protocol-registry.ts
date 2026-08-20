/**
 * MIDNAT protocol registry: the single source of truth for every protocol fact
 * shown on a public page.
 *
 * LAW (directive section 63): no public page may hardcode a protocol number,
 * address, transaction hash or market parameter. Everything chain-shaped is
 * derived from the deployment manifest that the deploy script wrote, so a
 * redeployment updates every surface at once and copy-paste drift is
 * impossible. Facts that are not in the manifest (bytecode verification
 * results, explorer verification state, known limitations) are authored ONCE
 * here, each with its source, and imported everywhere else.
 *
 * Sources:
 *   lib/protocol/deployments/1952.json                  chain manifest
 *   lib/protocol/MIDNAT-X-LAYER-TESTNET-DEPLOYMENT.md   verification evidence
 *   artifacts/app/MIDNAT-ECONOMIC-MODEL.md              normative economics
 */
import deployment from '../deployments/1952.json';

/* -------------------------------------------------------------------------
   Status vocabulary (directive section 18)
   Every claim on a public page carries one of these, and nothing else.
   ------------------------------------------------------------------------- */

export type ImplementationStatus =
  | 'LIVE_ON_TESTNET'
  | 'IMPLEMENTED'
  | 'PARTIALLY_IMPLEMENTED'
  | 'PLANNED'
  | 'RESEARCH'
  | 'NOT_IMPLEMENTED';

export const STATUS_LABEL: Record<ImplementationStatus, string> = {
  LIVE_ON_TESTNET: 'Live on testnet',
  IMPLEMENTED: 'Implemented',
  PARTIALLY_IMPLEMENTED: 'Partially implemented',
  PLANNED: 'Planned',
  RESEARCH: 'Research',
  NOT_IMPLEMENTED: 'Not implemented',
};

/** How a value on the page was obtained (directive section 64). */
export type Freshness = 'LIVE' | 'DERIVED' | 'VERSIONED' | 'STATIC';

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  LIVE: 'Live read',
  DERIVED: 'Derived',
  VERSIONED: 'From deployment',
  STATIC: 'Static text',
};

/* -------------------------------------------------------------------------
   Network
   ------------------------------------------------------------------------- */

export const NETWORK = {
  chainId: deployment.chainId,
  chainIdHex: `0x${deployment.chainId.toString(16)}`,
  label: 'X Layer Testnet',
  shortLabel: 'X Layer',
  gasCurrency: 'OKB',
  rpcUrl: deployment.rpcUrl,
  /** Same explorer the trading app links to, so a user never sees two. */
  explorerBase: 'https://www.okx.com/web3/explorer/xlayer-test',
  explorerName: 'OKX X Layer explorer',
  testnet: true,
} as const;

export const explorerAddress = (address: string): string => `${NETWORK.explorerBase}/address/${address}`;
export const explorerTx = (hash: string): string => `${NETWORK.explorerBase}/tx/${hash}`;

/* -------------------------------------------------------------------------
   Collateral
   ------------------------------------------------------------------------- */

export const COLLATERAL = {
  symbol: deployment.collateral.symbol,
  name: deployment.collateral.name,
  address: deployment.collateral.address,
  decimals: deployment.collateral.decimals,
  /**
   * false on this deployment: the collateral is a real ERC-20 already deployed
   * on this chain, verified by direct eth_call, rather than a mock token
   * written for the demo. It is still a testnet balance with no monetary
   * worth, and nothing here claims a bridge or an issuer.
   */
  isMock: deployment.collateral.mock,
} as const;

/* -------------------------------------------------------------------------
   Contracts
   ------------------------------------------------------------------------- */

export type VerificationState = 'REPRODUCED' | 'HASH_PINNED' | 'NOT_VERIFIED';

export interface ContractEntry {
  readonly key: 'vault' | 'clearingHouse' | 'oracleAnchor';
  readonly name: string;
  readonly address: string;
  /** What the contract is responsible for, in one sentence. */
  readonly role: string;
  /** Whether it holds user funds. */
  readonly custody: string;
  readonly deploymentBlock: number | null;
  readonly txHash: string | null;
  readonly status: ImplementationStatus;
  readonly solc: string;
  readonly pipeline: string;
  readonly verification: VerificationState;
  /** Exactly what was checked, and what was not. */
  readonly verificationNote: string;
  readonly sourcePath: string;
}

export const CONTRACTS: readonly ContractEntry[] = [
  {
    key: 'vault',
    name: 'MidnatVault',
    address: deployment.contracts.vault.address,
    role: 'ERC-4626 liquidity vault. Holds LP deposits, issues shares, prices net asset value and is the counterparty of last resort for trader profit.',
    custody: 'Holds LP collateral',
    deploymentBlock: deployment.contracts.vault.deploymentBlock,
    txHash: deployment.contracts.vault.txHash,
    status: 'LIVE_ON_TESTNET',
    solc: '0.8.26',
    pipeline: 'via-IR, cancun',
    verification: 'REPRODUCED',
    verificationNote:
      'A local rebuild from the project source produced runtime bytecode byte for byte identical to the deployed code, 6,233 bytes, with all 10 immutable values pinned to the deployed values before comparison.',
    sourcePath: 'lib/protocol/src/MidnatVault.sol',
  },
  {
    key: 'clearingHouse',
    name: 'MidnatClearingHouse',
    address: deployment.contracts.clearingHouse.address,
    role: 'Trader custody, position lifecycle, execution pricing, funding accrual, settlement and liquidation.',
    custody: 'Holds trader collateral',
    deploymentBlock: deployment.contracts.clearingHouse.deploymentBlock,
    txHash: deployment.contracts.clearingHouse.txHash,
    status: 'LIVE_ON_TESTNET',
    solc: '0.8.26',
    pipeline: 'via-IR, cancun',
    verification: 'REPRODUCED',
    verificationNote:
      'A local rebuild from the project source produced runtime bytecode byte for byte identical to the deployed code, 17,796 bytes, with all 24 immutable slots pinned to the deployed values before comparison.',
    sourcePath: 'lib/protocol/src/MidnatClearingHouse.sol',
  },
  {
    key: 'oracleAnchor',
    name: 'MidnatOracleAnchor',
    address: deployment.contracts.oracleAnchor.address,
    role: 'Signer registry and on-chain record of the latest signed reference report per market. Reads are the price authority for every trade.',
    custody: 'Holds no funds',
    deploymentBlock: deployment.contracts.oracleAnchor.deploymentBlock,
    txHash: deployment.contracts.oracleAnchor.txHash,
    status: 'LIVE_ON_TESTNET',
    solc: deployment.contracts.oracleAnchor.solcVersion,
    pipeline: 'standard pipeline',
    verification: 'HASH_PINNED',
    verificationNote:
      'Reused from an earlier run, so its deployment block and transaction are not recorded. It was built with a different compiler configuration than the project source pins, so byte equality is not expected: a standard-pipeline rebuild differs only in 35 zero-push opcodes, a compiler encoding difference. Its runtime code hash is pinned instead, and the live signer and signing domain were checked against the deployment.',
    sourcePath: 'lib/protocol/src/MidnatOracleAnchor.sol',
  },
];

export const contractByKey = (key: ContractEntry['key']): ContractEntry =>
  CONTRACTS.find((c) => c.key === key)!;

export const ORACLE_RUNTIME_CODE_HASH = deployment.contracts.oracleAnchor.runtimeCodeHash;

/** Wiring transaction: the one-shot call that bound the clearing house to the vault. */
export const WIRING_TX = deployment.receipts.find((r) => r.step === 'wireClearingHouse') ?? null;

/* -------------------------------------------------------------------------
   Privileged roles
   ------------------------------------------------------------------------- */

export interface RoleEntry {
  readonly label: string;
  readonly address: string;
  readonly powers: readonly string[];
}

export const ROLES: readonly RoleEntry[] = [
  {
    label: 'Owner',
    address: deployment.roles.owner,
    powers: [
      'Change global risk caps and minimums',
      'List, suspend and delist markets',
      'Change per-market risk parameters',
      'Set operating mode: normal, close only, halted',
      'Transfer ownership, two step',
    ],
  },
  {
    label: 'Risk keeper',
    address: deployment.roles.riskKeeper,
    powers: ['Apply risk-driven market state changes'],
  },
  {
    label: 'Funding keeper',
    address: deployment.roles.fundingKeeper,
    powers: ['Post the funding rate within the on-chain clamp'],
  },
  {
    label: 'Oracle signer',
    address: deployment.roles.oracleSigner,
    powers: ['Sign reference reports that the anchor accepts as canonical prices'],
  },
];

/** True while one key holds several roles. Published, never hidden. */
export const KEY_CONCENTRATION = {
  ownerAlsoKeeper:
    deployment.roles.owner === deployment.roles.riskKeeper &&
    deployment.roles.owner === deployment.roles.fundingKeeper,
  distinctAddresses: Array.from(new Set(Object.values(deployment.roles))).length,
  multisig: false,
  timelock: false,
} as const;

/* -------------------------------------------------------------------------
   Global parameters
   ------------------------------------------------------------------------- */

const E6 = 1_000_000;

export const GLOBALS = {
  /** Share of vault net asset value that may back open interest, in bps. */
  globalOiFactorBps: deployment.globals.globalOiFactorBps,
  minCollateral: Number(deployment.globals.minCollateralE6) / E6,
  minSize: Number(deployment.globals.minSizeE6) / E6,
} as const;

/* -------------------------------------------------------------------------
   Markets
   ------------------------------------------------------------------------- */

export type RiskTier = 'STANDARD' | 'ELEVATED' | 'HIGH';

export interface MarketParams {
  readonly maxLeverageX: number;
  readonly maintenanceMarginBps: number;
  readonly openFeeBps: number;
  readonly closeFeeBps: number;
  readonly liqFeeBps: number;
  readonly baseSpreadBps: number;
  readonly impactScaleBps: number;
  readonly impactMaxBps: number;
  readonly marketOiFactorBps: number;
  readonly sideOiFactorBps: number;
  readonly maxConfidenceBps: number;
  readonly maxPriceAgeSec: number;
}

export interface MarketEntry {
  readonly symbol: string;
  readonly name: string;
  readonly tier: RiskTier;
  readonly symbolKey: string;
  readonly params: MarketParams;
  readonly txHash: string;
  readonly block: number;
}

/**
 * Display names for the listed tickers. Names are identity, not economics:
 * they are the only market fact not carried by the manifest.
 */
const ISSUER_NAME: Record<string, string> = {
  AAPL: 'Apple Inc.',
  GOOGL: 'Alphabet Inc. Class A',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla, Inc.',
  HOOD: 'Robinhood Markets, Inc.',
};

export const MARKETS: readonly MarketEntry[] = deployment.markets.map((m) => ({
  symbol: m.symbol,
  name: ISSUER_NAME[m.symbol] ?? m.symbol,
  tier: m.tier as RiskTier,
  symbolKey: m.symbolKey,
  params: m.params,
  txHash: m.txHash,
  block: m.block,
}));

export interface TierEntry {
  readonly tier: RiskTier;
  readonly label: string;
  readonly description: string;
  readonly symbols: readonly string[];
  readonly params: MarketParams;
}

const TIER_DESCRIPTION: Record<RiskTier, string> = {
  STANDARD: 'Deep, widely covered underlyings. The most permissive leverage and the tightest execution band.',
  ELEVATED: 'Underlyings that move harder on news. Tighter leverage, wider band, tighter confidence tolerance.',
  HIGH: 'The most reflexive underlyings on the venue. Lowest leverage, widest band, smallest share of vault capacity.',
};

export const TIERS: readonly TierEntry[] = (['STANDARD', 'ELEVATED', 'HIGH'] as const)
  .map((tier): TierEntry | null => {
    const inTier = MARKETS.filter((m) => m.tier === tier);
    const first = inTier[0];
    if (!first) return null;
    return {
      tier,
      label: tier.charAt(0) + tier.slice(1).toLowerCase(),
      description: TIER_DESCRIPTION[tier],
      symbols: inTier.map((m) => m.symbol),
      params: first.params,
    };
  })
  .filter((t): t is TierEntry => t !== null);

/** Widest and narrowest leverage actually listed, for copy that must not invent. */
export const LEVERAGE_RANGE = {
  min: Math.min(...MARKETS.map((m) => m.params.maxLeverageX)),
  max: Math.max(...MARKETS.map((m) => m.params.maxLeverageX)),
} as const;

/* -------------------------------------------------------------------------
   Deployment history and owner operations
   ------------------------------------------------------------------------- */

export interface OwnerOperationRecord {
  readonly at: string;
  readonly action: string;
  readonly by: string;
  readonly txHash: string;
  readonly before: {
    readonly globalOiFactorBps: number;
    readonly minCollateralE6: string;
    readonly minSizeE6: string;
  };
  readonly after: {
    readonly globalOiFactorBps: number;
    readonly minCollateralE6: string;
    readonly minSizeE6: string;
  };
  readonly reason: string;
}

export const DEPLOYMENT = {
  startedAt: deployment.startedAt,
  completedAt: deployment.completedAt,
  deployer: deployment.deployer,
  wired: deployment.wired,
  totalGasUsed: deployment.gas.totalGasUsed,
  receipts: deployment.receipts,
  operations: deployment.operations as readonly OwnerOperationRecord[],
  supersedes: deployment.supersedes,
} as const;

/* -------------------------------------------------------------------------
   Reference engine constants (source: artifacts/api-server/src/lib)
   Timing and policy configuration, not observations.
   ------------------------------------------------------------------------- */

export const REFERENCE_ENGINE = {
  pollIntervalSec: 2,
  fetchTimeoutSec: 6,
  selectFreshWithinSec: 20,
  agingAfterSec: 30,
  staleAfterSec: 180,
  transitionMinBps: 10,
  recoveryGapBps: 50,
  transitionMaxSec: 180,
  transitionMaxStepBps: 20,
  convergenceBps: 10,
  convergenceTicks: 3,
  states: ['CURRENT', 'AGING', 'TRANSITIONING', 'STALE', 'UNAVAILABLE'] as const,
  qualityTiers: ['HIGH', 'MODERATE', 'LOW', 'UNAVAILABLE'] as const,
  sentinel: ['NORMAL', 'WATCH', 'ALERT'] as const,
  marketStates: ['LIVE', 'AFTER_HOURS', 'WEEKEND', 'HALTED'] as const,
  upstream: 'Pyth Hermes',
  feedOrder: [
    'Equity session feed for the listed ticker',
    'Pre-market and post-market session feeds',
    'Tokenized 24/7 feed for the same underlying',
    'Hold the last snapshot and degrade the state',
  ],
} as const;

/** On-chain price acceptance rules enforced by the clearing house. */
export const ORACLE_POLICY = {
  maxPriceAgeSec: MARKETS[0]?.params.maxPriceAgeSec ?? 0,
  futureToleranceSec: 60,
  posterIntervalSec: 45,
  signingScheme: 'EIP-712',
} as const;

/* -------------------------------------------------------------------------
   Funding
   ------------------------------------------------------------------------- */

export const FUNDING = {
  /** On-chain clamp, milli-bps per hour. */
  clampMilliBpsPerHour: 1250,
  clampPercentPerHour: 0.0125,
  accrual: 'Lazy, per market, anchored at the last accrual point',
  counterparties: 'Traders on the other side first, the vault last',
} as const;

/* -------------------------------------------------------------------------
   MIDNAT Intelligence
   ------------------------------------------------------------------------- */

export const INTELLIGENCE = {
  provider: 'OpenRouter',
  defaultModel: 'anthropic/claude-fable-5',
  modelOverrideEnv: 'AI_DESK_MODEL',
  deskRefreshMinutes: 10,
  /* Burst ceilings on model questions, in questions per minute.

     These mirror the engine's usage policy (burst.ANONYMOUS.refillPerMinute
     and burst.CONNECTED.refillPerMinute) and have to be changed together with
     it: the engine enforces, this file only reports.

     The bucket is not keyed by address. An anonymous visitor is told apart by
     browser session and only falls back to the source address when there is
     no session, so these are per visitor, not per IP. Everyone sharing one
     address is bounded separately, by the network ceiling below. */
  askQuestionsPerMinute: 20,
  askQuestionsPerMinuteConnected: 30,
  /** Shared-address ceiling: everyone behind one office or carrier NAT together. */
  askQuestionsPerMinutePerAddress: 250,
  askConcurrentRequests: 4,
  /* The allowance that actually binds a person, in units over a rolling day.

     The per-minute ceilings above exist to stop scripts and almost never
     interrupt someone thinking. This is the one a working trader can reach, so
     publishing the burst layer without it would advertise the wrong number.

     Mirrors capacity.CONNECTED, capacity.ANONYMOUS, refillWindowHours and
     weights in the engine's usage policy; the engine enforces, this file only
     reports. Spending refills steadily across the window rather than resetting
     at a fixed hour. */
  askUnitsPerDayConnected: 300,
  askUnitsPerDayVisitor: 75,
  askUnitsRefillHours: 24,
  /** A question costs one unit, a whole-portfolio question two, a deterministic answer none. */
  askUnitsPerQuestion: 1,
  askUnitsPerPortfolioQuestion: 2,
  provenanceFields: [
    'analysisContextHash',
    'inputsHash',
    'outputHash',
    'model',
    'generatedAt',
    'policyVersion',
    'riskEngineVersion',
    'guidancePolicyVersion',
  ],
} as const;

/* -------------------------------------------------------------------------
   Known limitations. The contract-level entries come from the deployment
   report, published in full; interface-level entries state where the shipped
   app stops short of the deployed contracts.
   ------------------------------------------------------------------------- */

export interface Limitation {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly area: 'Keys' | 'Verification' | 'Oracle' | 'Liquidation' | 'Vault' | 'Scope' | 'Infrastructure';
}

export const LIMITATIONS: readonly Limitation[] = [
  {
    id: 'single-key',
    title: 'One key holds owner, risk keeper and funding keeper',
    detail:
      'The same address can change risk parameters, halt markets and post funding. There is no multisig and no timelock on this deployment. A mainnet deployment needs separated keepers and a timelocked owner.',
    area: 'Keys',
  },
  {
    id: 'anchor-provenance',
    title: 'The oracle anchor was reused, so its deployment block is unknown',
    detail:
      'The anchor predates this deployment run. Its deployment transaction was not recorded, and it was built with a different compiler configuration, so it is pinned by runtime code hash rather than reproduced byte for byte.',
    area: 'Verification',
  },
  {
    id: 'explorer-verification',
    title: 'Source is not verified on the block explorer',
    detail:
      'Submission to the explorer verification API failed because it requires an access key this deployment does not hold. The standard JSON compiler inputs are kept with the contract sources, so the build can be reproduced locally instead.',
    area: 'Verification',
  },
  {
    id: 'single-poster',
    title: 'A single process posts oracle reports',
    detail:
      'One funded key posts signed reports on a fixed interval. If that process stops or runs out of gas, prices go stale and the protocol blocks new exposure until they recover. There is no redundant poster.',
    area: 'Oracle',
  },
  {
    id: 'no-live-liquidation',
    title: 'No liquidation has been executed on this deployment',
    detail:
      'Liquidation is implemented, covered by contract tests and checked against the deployed contract with a chain-derived fixture, but no position has actually been liquidated on this deployment, by us or by anyone else.',
    area: 'Liquidation',
  },
  {
    id: 'no-liquidation-incentive',
    title: 'Nobody is paid to call liquidation',
    detail:
      'The liquidation fee is deducted from the liquidated position and settled to the vault. The account that sends the transaction pays gas and receives nothing for it, so an external liquidator has no economic reason to run one. MIDNAT operates an unprivileged keeper that calls the same public function as anyone else, and if it stops, a position can stay open past its threshold until someone chooses to pay for the call.',
    area: 'Liquidation',
  },
  {
    id: 'deferred-claims',
    title: 'A deferred payout is an unsecured claim on the vault',
    detail:
      'When the vault cannot pay a closing position in full, the remainder is recorded as a claim that ranks ahead of LP equity and is paid from later vault cash. It is not a guarantee, it is not insured, and it can remain unpaid.',
    area: 'Vault',
  },
  {
    id: 'out-of-scope',
    title: 'Order book, cross margin and partial close are out of scope',
    detail:
      'There is no order book and no depth. Margin is isolated per position, positions close in full, and there is no governance, fee switch or insurance fund on this deployment.',
    area: 'Scope',
  },
  {
    id: 'listing-is-narrower-than-pricing',
    title: 'The reference engine prices more symbols than the deployment lists',
    detail:
      'The clearing house lists the markets on the deployments page and nothing else. The reference engine can price further symbols, and they appear in reference tooling and in market data, but a market the clearing house has not listed cannot be opened: the contract rejects the call, so the interface does not offer it.',
    area: 'Scope',
  },
  {
    id: 'rpc-consistency',
    title: 'The public RPC is load balanced and can lag',
    detail:
      'Reads can land on nodes at different heights. Tooling in this project pins a block tag and caps log ranges because of it. One deployment run already crashed on a lagging read and had to be recovered.',
    area: 'Infrastructure',
  },
];

/* -------------------------------------------------------------------------
   Canonical shared sentences. One wording, used everywhere.
   ------------------------------------------------------------------------- */

/**
 * Who operates MIDNAT. One canonical record, so the day the project is
 * incorporated the change is this object and nothing else: every legal and
 * public surface reads its operator facts from here.
 *
 * LAW: this record states only what is true today. It carries no company
 * number, no registered office and no postal address, because none exists, and
 * a legal page that prints an empty slot for one is worse than a page that
 * never offered it. `incorporated` is the gate -- prose that would describe a
 * registered entity has to check it rather than assume it.
 */
export const OPERATOR = {
  /** Legal name of the natural person who operates the project. */
  legalName: 'Shivam Sutra Dhar',
  /** The name the project is known by publicly. */
  publicName: 'Bunnyy',
  /** How the operator is described in a sentence. */
  form: 'individual operator',
  /** The governing jurisdiction for the documents this site publishes. */
  jurisdiction: 'India',
  /** False until a company actually exists. Nothing may claim otherwise. */
  incorporated: false,
} as const;

export const SECURITY_REVIEW = {
  status: 'IN_PROGRESS',
  shortLabel: 'independent review in progress',
  disclosure:
    'An independent contract review is in progress, but no completed independent security audit report has been published. The contracts have also been reviewed internally, tested with a contract test suite and reproduced from source. None of that is a completed external audit.',
} as const;

export const CANONICAL = {
  /**
   * The system boundary, in one wording. Every page that describes the shape
   * of the system uses this sentence or language consistent with it: the
   * deployed contracts are named as the authority for the state they hold,
   * and work the interface does is attributed to the interface.
   */
  architecture:
    'MIDNAT is an interface and an API in front of deployed contracts on X Layer Testnet. The interface prepares work and presents state, the reference engine and the report signer run off chain, and the deployed contracts are the authority for the state they hold: custodied collateral, vault shares, the anchored reference price, and the positions and funding written by calls made to them.',
  /**
   * What actually happens when someone trades here, in one wording: who
   * builds the call, who signs it, who enforces it, what the chain keeps and
   * what the off-chain services are left doing. Belongs on the pages a user
   * reads before trusting the venue with a position.
   */
  tradingPath:
    'Trading in MIDNAT begins with funds held in your own Wallet. Trader collateral deposited into the clearing house is credited to your Trading Account; LP Vault deposits are separate liquidity-provider positions and never fund it. Before a market order or an on-chain resting limit order, the interface may ask for an ERC-20 approval if the allowance is insufficient and an exact Trading Account deposit for any shortfall; each is a separate wallet-signed transaction. Your wallet signs and sends the order transaction. The clearing house prices and checks it. A marketable order records a position; a non-marketable limit order records a resting order and reserves its margin plus quoted open fee until fill, cancellation, or on-chain expiry. X Layer keeps those records public. The MIDNAT API takes no custody. Off chain it runs the reference engine, signs the reports the oracle anchor holds, posts a funding rate the contract clamps, and runs a liquidation keeper with no power a stranger does not also have; everything it shows you it reconstructs from what the chain already recorded.',
  testnet:
    'MIDNAT runs on X Layer Testnet. Positions, collateral and vault shares are testnet values with no monetary worth, and the deployment can be reset or replaced at any time.',
  noAudit:
    SECURITY_REVIEW.disclosure,
  notAdvice:
    'Nothing on this site or in the product is investment advice, a recommendation or an offer. MIDNAT does not know your circumstances and does not provide financial, legal or tax advice.',
  noOwnership:
    'A perpetual is a contract that tracks a reference price. Holding one gives you no share, no ownership, no dividend and no voting right in the company named by the ticker.',
  entity:
    `MIDNAT is an independent protocol and product, operated by ${OPERATOR.legalName} as an ${OPERATOR.form} based in ${OPERATOR.jurisdiction}. It is not incorporated: no registered company, company number or registered office stands behind it, and none is claimed here. The law of ${OPERATOR.jurisdiction} governs the documents on this site and any dispute arising from use of the interface. No arbitration venue or specific court has been agreed, so none is named. If the project is incorporated later, the operator recorded here changes and every document that reads from that record changes with it.`,
  gas: 'MIDNAT charges no protocol gas fee and the app never asks you to approve a fee for reading the market. X Layer still charges the sender for the transactions that move funds, priced in OKB.',
} as const;

/** Where the numbers on this site come from, cited on data-bearing pages. */
export const SOURCES = {
  manifest: 'src/deployments/1952.json',
  deploymentReport: 'lib/protocol/MIDNAT-X-LAYER-TESTNET-DEPLOYMENT.md',
  economicModel: 'artifacts/app/MIDNAT-ECONOMIC-MODEL.md',
  contracts: 'lib/protocol/src',
} as const;

/* -------------------------------------------------------------------------
   Formatting helpers, shared so every page renders a value the same way
   ------------------------------------------------------------------------- */

/** 100 bps renders as "1.00%". */
export function bpsToPercent(bps: number, digits = 2): string {
  return `${(bps / 100).toFixed(digits)}%`;
}

/** Truncate an address for display: 0x1234...cdef (directive section 26). */
export function shortAddress(address: string, lead = 6, tail = 4): string {
  if (address.length <= lead + tail + 2) return address;
  return `${address.slice(0, lead)}\u2026${address.slice(-tail)}`;
}

/** Collateral amount from a whole-unit number, always with the token symbol. */
export function collateralAmount(value: number, digits = 6): string {
  return `${value.toFixed(digits)} ${COLLATERAL.symbol}`;
}

/** ISO timestamp to a stable, locale-independent UTC label. */
export function utcDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function utcDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${utcDate(iso)} ${hh}:${mm} UTC`;
}

export function blockNumber(n: number): string {
  return n.toLocaleString('en-US');
}
