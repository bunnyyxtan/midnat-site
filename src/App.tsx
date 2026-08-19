import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/public/theme';

// Pages
import Home from '@/pages/home';
import NotFound from '@/pages/not-found';

// Protocol
import Protocol from '@/pages/protocol';
import Markets from '@/pages/markets';
import Fees from '@/pages/fees';
import Risk from '@/pages/risk';
import Contracts from '@/pages/contracts';
import Deployments from '@/pages/deployments';
import Verify from '@/pages/verify';

// Trust
import Security from '@/pages/security';
import Status from '@/pages/status';
import Changelog from '@/pages/changelog';
import Whitepaper from '@/pages/whitepaper';

// Brand
import Brand from '@/pages/brand';
import About from '@/pages/about';

// Documentation
import DocsIndex from '@/pages/docs/index';
import HowItWorks from '@/pages/docs/how-it-works';
import GettingStarted from '@/pages/docs/getting-started';
import FirstTrade from '@/pages/docs/first-trade';
import RefusalRules from '@/pages/docs/refusal-rules';
import Glossary from '@/pages/docs/glossary';
import MarketsAndTiers from '@/pages/docs/markets-and-tiers';
import PositionsAndMargin from '@/pages/docs/positions-and-margin';
import ExecutionAndPricing from '@/pages/docs/execution-and-pricing';
import FundingDoc from '@/pages/docs/funding';
import Liquidation from '@/pages/docs/liquidation';
import VaultDoc from '@/pages/docs/vault';
import DeferredPayouts from '@/pages/docs/deferred-payouts';
import ReferenceEngineDoc from '@/pages/docs/reference-engine';
import OracleAnchorDoc from '@/pages/docs/oracle-anchor';
import MarketHours from '@/pages/docs/market-hours';
import IntelligenceDoc from '@/pages/docs/intelligence';
import ApiDoc from '@/pages/docs/api';

// Legal
import LegalIndex from '@/pages/legal/index';
import TermsOfUse from '@/pages/legal/terms';
import PrivacyNotice from '@/pages/legal/privacy';
import RiskDisclosure from '@/pages/legal/risk-disclosure';
import TestnetDisclosure from '@/pages/legal/testnet';
import AiDisclosure from '@/pages/legal/ai-disclosure';
import MarketDataDisclosure from '@/pages/legal/market-data';
import AcceptableUse from '@/pages/legal/acceptable-use';
import CookiesNotice from '@/pages/legal/cookies';
import Licenses from '@/pages/legal/licenses';

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />

        <Route path="/protocol" component={Protocol} />
        <Route path="/markets" component={Markets} />
        <Route path="/fees" component={Fees} />
        <Route path="/risk" component={Risk} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/deployments" component={Deployments} />
        <Route path="/verify" component={Verify} />
        <Route path="/security" component={Security} />
        <Route path="/status" component={Status} />
        <Route path="/changelog" component={Changelog} />
        <Route path="/whitepaper" component={Whitepaper} />

        <Route path="/brand" component={Brand} />
        <Route path="/about" component={About} />

        <Route path="/docs" component={DocsIndex} />
        <Route path="/docs/how-it-works" component={HowItWorks} />
        <Route path="/docs/getting-started" component={GettingStarted} />
        <Route path="/docs/first-trade" component={FirstTrade} />
        <Route path="/docs/refusal-rules" component={RefusalRules} />
        <Route path="/docs/glossary" component={Glossary} />
        <Route path="/docs/markets-and-tiers" component={MarketsAndTiers} />
        <Route path="/docs/positions-and-margin" component={PositionsAndMargin} />
        <Route path="/docs/execution-and-pricing" component={ExecutionAndPricing} />
        <Route path="/docs/funding" component={FundingDoc} />
        <Route path="/docs/liquidation" component={Liquidation} />
        <Route path="/docs/vault" component={VaultDoc} />
        <Route path="/docs/deferred-payouts" component={DeferredPayouts} />
        <Route path="/docs/reference-engine" component={ReferenceEngineDoc} />
        <Route path="/docs/oracle-anchor" component={OracleAnchorDoc} />
        <Route path="/docs/market-hours" component={MarketHours} />
        <Route path="/docs/intelligence" component={IntelligenceDoc} />
        <Route path="/docs/api" component={ApiDoc} />

        <Route path="/legal" component={LegalIndex} />
        <Route path="/legal/terms" component={TermsOfUse} />
        <Route path="/legal/privacy" component={PrivacyNotice} />
        <Route path="/legal/risk-disclosure" component={RiskDisclosure} />
        <Route path="/legal/testnet" component={TestnetDisclosure} />
        <Route path="/legal/ai-disclosure" component={AiDisclosure} />
        <Route path="/legal/market-data" component={MarketDataDisclosure} />
        <Route path="/legal/acceptable-use" component={AcceptableUse} />
        <Route path="/legal/cookies" component={CookiesNotice} />
        <Route path="/legal/licenses" component={Licenses} />

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
