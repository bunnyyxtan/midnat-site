import { Callout } from './primitives';
import { ACTIVATION, CANONICAL, LAUNCH } from '@/lib/protocol-registry';

/**
 * Shared activated-testnet disclosure for the actionable guides.
 *
 * This deployment is activated: the review gate approved the launch digest and
 * launch was enabled on chain, so deposits and new positions are
 * contract-enabled. The steps these guides describe are actionable, but whether
 * a specific action clears depends on live chain state — wallet collateral, the
 * market's state, the venue's live operating mode, oracle freshness, and the
 * risk and capacity checks the clearing house enforces.
 *
 * This is X Layer Testnet, so every balance is a testnet value with no monetary
 * worth. Every actionable guide renders exactly this, rather than repeating the
 * fact in ad hoc prose, so there is one place to keep it true.
 */
export function ActivatedTestnetNotice() {
  // The clearing house's launch-enabled bit is the irreversible product fact.
  // The separate review-gate approval was required at activation time, but its
  // current mutable bit is not used here as a proxy for launch state.
  const activated = LAUNCH.enabled;

  return (
    <Callout tone="note" title="Activated on X Layer Testnet" className="activated-testnet-notice">
      <p data-activation-state={activated ? 'activated' : 'gated'}>{CANONICAL.activated}</p>
      <p>
        The steps on this page are actionable against the deployed contracts. Depositing collateral and opening a
        position are contract-enabled, but whether a specific action clears still depends on live chain state: your
        wallet collateral, the market's state, the venue's live operating mode, oracle freshness, and the clearing
        house's risk and capacity checks. The live operating mode is read from the terminal and the contracts, not
        asserted here. Withdrawals, claims and cancellations do not need a price and stay available.
      </p>
      <p className="pub-small">
        Activation digest <code className="pub-mono">{ACTIVATION.reviewDigest}</code>. Every balance here is a
        simulation value with no monetary worth, and the network or this deployment may be reset or replaced.
      </p>
    </Callout>
  );
}
