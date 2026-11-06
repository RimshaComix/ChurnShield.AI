import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { getSession } from "../../actions/auth";
import ShapDrawer from "../../components/ShapDrawer";

export default async function PredictionsPage() {
  // 1. Authenticate user session and retrieve corporate tenant boundary
  const session = await getSession();
  if (!session?.tenantId) {
    redirect("/login");
  }

  const userTenantId = session.tenantId;

  // 2. Fetch prediction records strictly filtered by corporate tenant identification
  const predictions = await prisma.prediction.findMany({
    where: {
      tenantId: userTenantId
    },
    include: { customer: true },
    orderBy: { calculatedAt: "desc" }
  }) || [];

  const corporateFontFamily = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

  return (
    <div className="space-y-6 w-full" style={corporateFontFamily}>
      
      {/* 1. ACADEMICALLY DEFENSIVE TITLE HEADER */}
      <div className="border-b border-[#567C8D]/20 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#C8D9E6] uppercase">
            Historical Prediction Records
          </h2>
          <p className="text-xs text-[#F5EFEB]/70 mt-0.5">
            Historical sequence log of active machine learning model inferences
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#2F4156] border border-[#567C8D]/40 text-xs font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[#C8D9E6]/70 uppercase text-[10px]">TENANT:</span>
          <span className="font-bold text-white text-[11px]">{session.tenantName}</span>
        </div>
      </div>

      {predictions.length === 0 ? (
        /* Empty Database State View Block */
        <div className="border border-dashed border-[#567C8D]/30 rounded-md p-12 text-center text-xs font-bold uppercase tracking-wider text-[#C8D9E6]/60 bg-[#567C8D]/10">
          No Active Inference Records Detected for {session.tenantName}. Navigate to the execution console hub to parse data.
        </div>
      ) : (
        /* 2. FULL-WIDTH ENTERPRISE INFERENCE LOG DATA MATRIX */
        <div className="border border-[#567C8D]/20 rounded-md p-5 bg-[#2F4156]">
          <div className="overflow-x-auto text-xs font-medium">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#567C8D]/30 text-[#C8D9E6] font-bold tracking-wide">
                  <th className="pb-3 pl-2">Timestamp Log</th>
                  <th className="pb-3">Account Record Name</th>
                  <th className="pb-3">Churn Probability</th>
                  <th className="pb-3">Risk Stratification Tier</th>
                  <th className="pb-3 text-right pr-2">Feature Attribution Matrix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#567C8D]/20 text-[#F5EFEB]/90">
                {predictions.map((log) => {
                  const probabilityPercent = (log.churnProbability * 100).toFixed(2);
                  const normalizedTier = String(log.riskClassification || "").toUpperCase();

                  return (
                    <tr key={log.id} className="hover:bg-[#567C8D]/10 transition-colors">
                      <td className="py-3.5 pl-2 text-[#C8D9E6]/80 font-normal">
                        {new Date(log.calculatedAt).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-3.5 font-bold text-white">
                        {log.customer?.accountNode || "Unknown Node"}
                      </td>
                      <td className="py-3.5 text-[#C8D9E6]">
                        {probabilityPercent}%
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          normalizedTier === "HIGH" || normalizedTier === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/20" 
                            : normalizedTier === "MEDIUM" || normalizedTier === "ELEVATED"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        }`}>
                          {normalizedTier}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <ShapDrawer shapData={log.shapExplanations} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
