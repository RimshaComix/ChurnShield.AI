import { prisma } from "../../../lib/prisma";

export default async function SegmentsPage() {
  const customers = await prisma.customer.findMany({
    include: {
      predictions: {
        orderBy: { calculatedAt: "desc" },
        take: 1
      }
    },
    orderBy: { monthlySpending: "desc" }
  }) || [];

  const highValueAtRisk = [];
  const dormantCore = [];
  const stableBaseline = [];

  customers.forEach((c) => {
    const latestPrediction = c.predictions[0];
    
    if (latestPrediction && latestPrediction.shapExplanations) {
      try {
        const hasHighComplaints = c.complaintCount >= 4;
        
        if (c.monthlySpending > 1500 && hasHighComplaints) {
          highValueAtRisk.push(c);
        } else if (c.usageFrequency <= 2 && c.inactivityDays > 10) {
          dormantCore.push(c);
        } else {
          stableBaseline.push(c);
        }
      } catch (e) {
        stableBaseline.push(c);
      }
    } else {
      if (c.monthlySpending > 1500 && c.complaintCount >= 3) {
        highValueAtRisk.push(c);
      } else if (c.usageFrequency <= 2) {
        dormantCore.push(c);
      } else {
        stableBaseline.push(c);
      }
    }
  });

  const corporateFontFamily = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

  return (
    <div className="space-y-6 w-full" style={corporateFontFamily}>
      {/* Exact Custom Scrollbar Definition */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-button {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      {/* 1. TITLE HEADER */}
      <div className="border-b border-[#567C8D]/20 pb-4">
        <h2 className="text-sm font-bold tracking-tight text-[#C8D9E6] uppercase">
          Customer Behavioral Segmentation
        </h2>
        <p className="text-xs text-[#F5EFEB]/70 mt-0.5">Dynamic customer cohort mapping tracked by behavioral feature matrices</p>
      </div>

      {/* 2. FULL-WIDTH BEHAVIORAL COHORT MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        {/* Cohort Card 01: High Value At Risk */}
        <div className="border border-[#567C8D]/20 rounded-md p-5 bg-[#2F4156] flex flex-col justify-between min-h-[260px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#567C8D]/30 pb-2">
              <span className="text-xs font-bold text-rose-300">High-Value At Risk</span>
              <span className="text-[10px] font-bold text-[#C8D9E6]/60">Cohort 01</span>
            </div>
            <p className="text-xs text-[#F5EFEB]/70 leading-relaxed">Accounts maintaining high contract values but exhibiting significant retention risk patterns.</p>
            <div className="pt-2 pr-1 space-y-2 text-xs font-medium text-[#F5EFEB]/90 max-h-36 overflow-y-auto custom-scrollbar">
              {highValueAtRisk.map(c => (
                <div key={c.id} className="flex justify-between border-b border-[#567C8D]/10 pb-1 last:border-0 hover:text-white transition-colors">
                  <span>• {c.accountNode}</span>
                  <span className="text-[#C8D9E6]/70">${Number(c.monthlySpending).toFixed(0)}/mo</span>
                </div>
              ))}
              {highValueAtRisk.length === 0 && <span className="text-[#C8D9E6]/40 italic block pt-2 text-[11px]">No matching accounts identified</span>}
            </div>
          </div>
          <div className="text-[10px] font-bold text-rose-300 pt-3 border-t border-[#567C8D]/20 tracking-wider">
            HIGH PRIORITY RETENTION ACTION REQUIRED
          </div>
        </div>

        {/* Cohort Card 02: Inactive Users */}
        <div className="border border-[#567C8D]/20 rounded-md p-5 bg-[#2F4156] flex flex-col justify-between min-h-[260px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#567C8D]/30 pb-2">
              <span className="text-xs font-bold text-amber-300">Inactive Core Users</span>
              <span className="text-[10px] font-bold text-[#C8D9E6]/60">Cohort 02</span>
            </div>
            <p className="text-xs text-[#F5EFEB]/70 leading-relaxed">Product engagement indicators dropping significantly below baseline usage thresholds.</p>
            <div className="pt-2 pr-1 space-y-2 text-xs font-medium text-[#F5EFEB]/90 max-h-36 overflow-y-auto custom-scrollbar">
              {dormantCore.map(c => (
                <div key={c.id} className="flex justify-between border-b border-[#567C8D]/10 pb-1 last:border-0 hover:text-white transition-colors">
                  <span>• {c.accountNode}</span>
                  <span className="text-[#C8D9E6]/70">{c.inactivityDays} Days Idle</span>
                </div>
              ))}
              {dormantCore.length === 0 && <span className="text-[#C8D9E6]/40 italic block pt-2 text-[11px]">No matching accounts identified</span>}
            </div>
          </div>
          <div className="text-[10px] font-bold text-amber-300 pt-3 border-t border-[#567C8D]/20 tracking-wider">
            ENGAGEMENT OUTREACH STRATEGY APPLIED
          </div>
        </div>

        {/* Cohort Card 03: Stable Baseline Group */}
        <div className="border border-[#567C8D]/20 rounded-md p-5 bg-[#2F4156] flex flex-col justify-between min-h-[260px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#567C8D]/30 pb-2">
              <span className="text-xs font-bold text-emerald-300">Stable Baseline Group</span>
              <span className="text-[10px] font-bold text-[#C8D9E6]/60">Cohort 03</span>
            </div>
            <p className="text-xs text-[#F5EFEB]/70 leading-relaxed">Healthy retention footprints tracking consistent application metrics with minimal support activity.</p>
            <div className="pt-2 pr-1 space-y-2 text-xs font-medium text-[#F5EFEB]/90 max-h-36 overflow-y-auto custom-scrollbar">
              {stableBaseline.map(c => (
                <div key={c.id} className="flex justify-between border-b border-[#567C8D]/10 pb-1 last:border-0 hover:text-white transition-colors">
                  <span>• {c.accountNode}</span>
                  <span className="text-emerald-300">Stable Node</span>
                </div>
              ))}
              {stableBaseline.length === 0 && <span className="text-[#C8D9E6]/40 italic block pt-2 text-[11px]">No matching accounts identified</span>}
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-300 pt-3 border-t border-[#567C8D]/20 tracking-wider">
            STANDARD CONTINUOUS MONITORING ACTIVE
          </div>
        </div>

      </div>
    </div>
  );
}