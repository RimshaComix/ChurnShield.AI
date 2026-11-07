import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { getSession } from "../actions/auth";
import AnalyzeButton from "../components/AnalyzeButton";
import DataPanel from "../components/DataPanel";
import ShapAnalyticsPanel from "../components/ShapAnalyticsPanel";

export default async function DashboardPage({ searchParams }) {
  // 1. Authenticate user session and retrieve corporate tenant boundary
  const session = await getSession();
  if (!session?.tenantId) {
    redirect("/login");
  }

  const userTenantId = session.tenantId;

  // 2. Unpack async search parameters safely from URL router context
  const resolvedParams = await searchParams;
  const activeNodeId = resolvedParams?.node || null;

  // 3. Fetch real-time telemetry footprints strictly scoped to the active corporate tenant
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: userTenantId
    },
    include: {
      predictions: {
        orderBy: { calculatedAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  }) || [];

  // 4. Compute Executive Dashboard KPIs & Filter Alert Matrices
  let totalPortfolioValue = 0;
  let estimatedRevenueLoss = 0;
  let activeCustomerNode = null;
  let activePredictionLogsList = [];
  let criticalAlertsCount = 0;
  let stableCount = 0;
  let elevatedCount = 0;

  const realTimeAlertsCollection = [];

  customers.forEach((c) => {
    const spending = Number(c.monthlySpending);
    totalPortfolioValue += spending;

    const latestPrediction = c.predictions?.[0] || null;
    if (latestPrediction && latestPrediction.shapExplanations) {
      try {
        const parsedShap = typeof latestPrediction.shapExplanations === "string"
          ? JSON.parse(latestPrediction.shapExplanations)
          : latestPrediction.shapExplanations;
        if (parsedShap?.recommendations && !latestPrediction.recommendations) {
          latestPrediction.recommendations = parsedShap.recommendations;
        }
      } catch {
        // Fallback gracefully if parsing fails
      }
    }

    const probability = latestPrediction ? latestPrediction.churnProbability : (c.complaintCount > 3 ? 0.45 : 0.05);
    const tier = latestPrediction ? String(latestPrediction.riskClassification).toUpperCase() : (probability >= 0.45 ? "CRITICAL" : "STABLE");

    estimatedRevenueLoss += spending * probability;

    if (tier === "CRITICAL" || tier === "HIGH") {
      criticalAlertsCount++;
      if (realTimeAlertsCollection.length < 3) {
        realTimeAlertsCollection.push({
          node: c,
          loss: spending * probability,
          prob: probability,
          rec: c.complaintCount > 3 ? "HBR_CARE_ESCALATION_PROTOCOL" : "GARTNER_VALUE_ASSURANCE_WAIVER"
        });
      }
    } else if (tier === "ELEVATED" || tier === "MEDIUM") {
      elevatedCount++;
    } else {
      stableCount++;
    }

    if (c.id === activeNodeId) {
      activeCustomerNode = c;
      activePredictionLogsList = c.predictions || [];
    }
  });

  const aggregateRetentionRate = customers.length > 0
    ? (((stableCount + elevatedCount) / customers.length) * 100).toFixed(1)
    : "100.0";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* 🏢 CORPORATE TENANT BOUNDARY BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-zinc-400 uppercase tracking-wider">TENANT PARTITION:</span>
          <span className="font-bold text-zinc-100">{session.tenantName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {session.role}
          </span>
        </div>
        <div className="text-[11px] text-zinc-500">
          Supervised Account Records: <span className="text-zinc-200 font-bold">{customers.length}</span>
        </div>
      </div>

      {/* 📊 EXECUTIVE KPI DASHBOARD SUMMARY ANCHOR */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-900/10 flex flex-col justify-between h-24 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500">TOTAL PORTFOLIO CLV</span>
          <div className="text-2xl font-black text-zinc-100">${totalPortfolioValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}</div>
          <div className="text-[9px] text-zinc-600">Active Node Contract Footprint</div>
        </div>
        <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-900/10 flex flex-col justify-between h-24 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-rose-500/80">ESTIMATED REVENUE LOSS</span>
          <div className="text-2xl font-black text-rose-500">${estimatedRevenueLoss.toLocaleString("en-US", { minimumFractionDigits: 0 })}</div>
          <div className="text-[9px] text-rose-700/60">Risk Incurred Volatility Vector</div>
        </div>
        <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-900/10 flex flex-col justify-between h-24 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-emerald-500/80">AGGREGATE RETENTION</span>
          <div className="text-2xl font-black text-emerald-500">{aggregateRetentionRate}%</div>
          <div className="text-[9px] text-emerald-700/60">Stable Node Ratio Matrix</div>
        </div>
        <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-900/10 flex flex-col justify-between h-24 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500">THREAT DISTRIBUTION</span>
          <div className="text-sm font-bold text-zinc-300 flex items-center gap-2 mt-1">
            <span className="text-rose-400">{criticalAlertsCount}C</span> •
            <span className="text-amber-400">{elevatedCount}E</span> •
            <span className="text-emerald-400">{stableCount}S</span>
          </div>
          <div className="text-[9px] text-zinc-600">Total Supervised Nodes: {customers.length}</div>
        </div>
      </section>

      {/* ⚠️ SYSTEM RISK ALERT CENTER */}
      {realTimeAlertsCollection.length > 0 && (
        <section className="border border-rose-950/30 rounded-xl p-4 bg-rose-950/5 space-y-3 font-mono">
          <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            CRITICAL CRITERIA EXPOSURE DETECTED [ALERT_CENTER]
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {realTimeAlertsCollection.map((alert, i) => (
              <Link key={i} href={`?node=${alert.node.id}`} className="border border-rose-900/30 hover:border-rose-800/60 bg-rose-950/10 p-3 rounded-lg space-y-1 block transition-colors group">
                <div className="flex justify-between font-bold text-[10px]">
                  <span className="text-zinc-200 group-hover:text-white">{alert.node.accountNode}</span>
                  <span className="text-rose-400">{(alert.prob * 100).toFixed(0)}% RISK</span>
                </div>
                <p className="text-[10px] text-zinc-500">Exp. Loss Factor: <span className="text-zinc-300">${alert.loss.toFixed(2)}</span></p>
                <div className="text-[9px] text-rose-400/80 font-bold uppercase tracking-tight pt-1">
                  {"// PLAYBOOK: "}{alert.rec}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Integrated Ingestion Dropzone Controls */}
      <DataPanel />

      {/* Split Grid Tracking Arena View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Dynamic Retention Monitoring Queue Table (Spans 2 columns) */}
        <section className="border border-zinc-900 rounded-xl p-5 bg-zinc-900/5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">LIVE PLATFORM FOOTPRINT MONITOR</h3>
            <p className="text-[11px] text-zinc-500">Active records tracking contract allocations and operational metrics for {session.tenantName}</p>
          </div>

          {customers.length > 0 ? (
            <div className="overflow-x-auto text-[11px] font-mono uppercase">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-semibold tracking-wider">
                    <th className="pb-2 pl-2">ACCOUNT NODE</th>
                    <th className="pb-2">INDUSTRY SINK</th>
                    <th className="pb-2">MONTHLY CONTRACT VALUE</th>
                    <th className="pb-2 text-right pr-2">EXECUTE INFERENCE ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50 text-zinc-300">
                  {customers.map((node) => {
                    const isSelected = node.id === activeNodeId;
                    return (
                      <tr
                        key={node.id}
                        className={`transition-colors cursor-pointer group ${isSelected
                            ? "bg-zinc-900/40 border-l-2 border-l-zinc-400 pl-2"
                            : "hover:bg-zinc-900/20"
                          }`}
                      >
                        <td className="py-3.5 font-bold pl-2">
                          <Link href={`?node=${node.id}`} className="block text-zinc-100 group-hover:text-white">
                            {node.accountNode} {isSelected && <span className="text-[9px] text-zinc-500">{"[SELECTED]"}</span>}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <Link href={`?node=${node.id}`} className="block text-zinc-400">
                            {node.industry}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <Link href={`?node=${node.id}`} className="block text-zinc-300">
                            ${Number(node.monthlySpending).toFixed(2)}/mo
                          </Link>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <AnalyzeButton customerId={node.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-zinc-900 rounded-lg p-8 bg-zinc-950/20 flex flex-col items-center justify-center min-h-[220px] text-center space-y-3 animate-in fade-in duration-300">
              <div className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                {"// ERROR: TENANT_DATABASE_EMPTY"}
              </div>
              <p className="text-zinc-500 text-[11px] max-w-sm leading-relaxed font-mono">
                Zero analytical footprint models detected for {session.tenantName}. Ingest an external telemetry dataset using the dropzone module utility framework above to hydrate layout indicators.
              </p>
              <div className="text-[9px] text-zinc-600 uppercase font-mono tracking-tighter animate-pulse">
                Awaiting Stream Payload Ingestion...
              </div>
            </div>
          )}
        </section>

        {/* Dynamic Sidebar Module: Displays Active Node Analytical SHAP Charts */}
        <aside className="w-full">
          <ShapAnalyticsPanel
            activeNode={activeCustomerNode}
            predictionLogsList={activePredictionLogsList}
          />
        </aside>

      </div>
    </div>
  );
}
