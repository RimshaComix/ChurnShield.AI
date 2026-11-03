"use client";

import { useState, useEffect, useRef } from "react";

export default function ShapAnalyticsPanel({ activeNode, predictionLogsList = [] }) {
    const predictionLog = predictionLogsList[0] || null;

    const [complaints, setComplaints] = useState(0);
    const [inactivity, setInactivity] = useState(0);
    const [frequency, setFrequency] = useState(0);

    const [simulatedRisk, setSimulatedRisk] = useState(0);
    const [activeRiskTier, setActiveRiskTier] = useState("STABLE");
    const [activeShapData, setActiveShapData] = useState({});
    const [activeProbability, setActiveProbability] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);

    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (!activeNode) return;

        const timer = setTimeout(() => {
            const initComplaints = parseInt(activeNode.complaintCount, 10) || 0;
            const initInactivity = parseInt(activeNode.inactivityDays, 10) || 0;
            const initFrequency = parseInt(activeNode.usageFrequency, 10) || 0;

            setComplaints(initComplaints);
            setInactivity(initInactivity);
            setFrequency(initFrequency);

            let initialShap = {};
            if (predictionLog && predictionLog.shapExplanations) {
                try {
                    initialShap = typeof predictionLog.shapExplanations === "string"
                        ? JSON.parse(predictionLog.shapExplanations)
                        : predictionLog.shapExplanations || {};
                } catch (e) {
                    initialShap = {};
                }
            }

            const initialProb = predictionLog
                ? Number(predictionLog.churnProbability) || 0.05
                : (initComplaints > 3 ? 0.45 : 0.05);

            const initialTier = predictionLog
                ? String(predictionLog.riskClassification || "").toUpperCase()
                : (initialProb >= 0.45 ? "CRITICAL" : "STABLE");

            setActiveShapData(initialShap);
            setActiveProbability(initialProb);
            setActiveRiskTier(initialTier);
            setSimulatedRisk(Math.round(initialProb * 100));
        }, 0);

        return () => clearTimeout(timer);
    }, [activeNode, predictionLog]);

    useEffect(() => {
        if (!activeNode) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const debounceTimer = setTimeout(async () => {
            setIsSimulating(true);

            const payload = {
                industry: activeNode.industry ? String(activeNode.industry).toUpperCase() : "SAAS",
                features: {
                    monthly_spending: Math.max(0, Number(activeNode.monthlySpending) || 0),
                    inactivity_days: Math.max(0, parseInt(inactivity, 10) || 0),
                    complaint_count: Math.max(0, parseInt(complaints, 10) || 0),
                    usage_frequency: Math.max(0, parseInt(frequency, 10) || 0)
                }
            };

            const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

            try {
                const response = await fetch(`${FASTAPI_URL}/api/v1/predict`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`Inference service error: ${response.status}`);
                }

                const data = await response.json();

                const prob = typeof data.churn_probability === "number" ? data.churn_probability : 0.05;
                const tier = data.risk_tier
                    ? String(data.risk_tier).toUpperCase()
                    : (prob >= 0.65 ? "CRITICAL" : prob >= 0.35 ? "ELEVATED" : "STABLE");
                const shap = data.shap_values || {};

                setActiveProbability(prob);
                setActiveRiskTier(tier);
                setActiveShapData(shap);
                setSimulatedRisk(Math.min(99, Math.max(1, Math.round(prob * 100))));
            } catch (err) {
                if (err.name === "AbortError") {
                    return;
                }

                let fallbackLogit = -1.5;
                fallbackLogit += complaints * 0.42;
                fallbackLogit += inactivity * 0.05;
                fallbackLogit += frequency * -0.15;
                fallbackLogit += (Number(activeNode.monthlySpending) || 0) * 0.0008;

                const fallbackProb = 1.0 / (1.0 + Math.exp(-fallbackLogit));
                const clampedProb = Math.min(0.99, Math.max(0.01, fallbackProb));
                const fallbackTier = clampedProb > 0.65 ? "CRITICAL" : clampedProb >= 0.35 ? "ELEVATED" : "STABLE";

                const fallbackShap = {
                    base_value: 0.18,
                    complaint_count_weight: Math.round(complaints * 0.42 * 10000) / 10000,
                    inactivity_days_weight: Math.round(inactivity * 0.05 * 10000) / 10000,
                    usage_frequency_weight: Math.round(frequency * -0.15 * 10000) / 10000,
                    monthly_spending_weight: Math.round((Number(activeNode.monthlySpending) || 0) * 0.0008 * 10000) / 10000,
                    system_status: "FASTAPI_OFFLINE_FALLBACK_APPLIED"
                };

                setActiveProbability(clampedProb);
                setActiveRiskTier(fallbackTier);
                setActiveShapData(fallbackShap);
                setSimulatedRisk(Math.min(99, Math.max(1, Math.round(clampedProb * 100))));
            } finally {
                setIsSimulating(false);
            }
        }, 120);

        return () => {
            clearTimeout(debounceTimer);
            controller.abort();
        };
    }, [complaints, inactivity, frequency, activeNode]);

    if (!activeNode) {
        return (
            <div className="border border-dashed border-zinc-900 rounded-xl p-6 bg-zinc-900/5 flex flex-col items-center justify-center min-h-[320px] font-mono text-[11px] text-zinc-500">
                <span>{"// PIPELINE_LOG_EMPTY"}</span>
                <p className="text-[10px] mt-1 text-center max-w-xs text-zinc-600">Select an active account footprint node from the tracking queue matrix to view model impact insights.</p>
            </div>
        );
    }

    const playbookRecommendations = predictionLog?.recommendations || [];

    const probabilityPercent = (activeProbability * 100).toFixed(1);
    const riskTierValue = activeRiskTier;

    const weights = [
        { label: "COMPLAINT COUNT IMPACT", val: Number(activeShapData.complaint_count_weight) || 0 },
        { label: "INACTIVITY INTERVAL", val: Number(activeShapData.inactivity_days_weight) || 0 },
        { label: "USAGE DENSITY BIAS", val: Number(activeShapData.usage_frequency_weight) || 0 },
        { label: "CONTRACT VALUE SCALE", val: Number(activeShapData.monthly_spending_weight) || 0 }
    ];

    const structuralMailerTemplateText = `DEAR SYSTEM ACCOUNT MONITOR FOR ${String(activeNode.accountNode).toUpperCase()},

WE ARE NOTICING RECENT ADAPTATION CHANGES REGARDING OPERATIONAL USAGE SIGNALS ACROSS CONTRACTS LINKED TO YOUR BUSINESS SINK GROUP. 

A MITIGATION REVIEW REVEALS A Live RISK VECTOR PROFILE TIED TO AN EXPECTED RISK PROBABILITY INTENSITY OF ${probabilityPercent}%. AN AUTOMATED SERVICE WAIVER HAS BEEN GENERATED FOR DEPLOYMENT ACCORDINGLY.

RETENTION COMPLIANCE SECTOR // CHURN.AI PLATFORM`;

    return (
        <div className="border rounded-xl p-5 font-mono text-[11px] space-y-5 animate-in fade-in duration-200 border-[#567C8D]/20 bg-[#2F4156]">

            <div className="border-b pb-3 space-y-2 border-[#567C8D]/20">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[#C8D9E6] font-bold uppercase text-[9px]">{"// CUSTOMER_360_VIEW"}</span>
                        <h4 className="text-white text-xs font-black tracking-tight uppercase mt-0.5">{activeNode.accountNode}</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded border uppercase ${riskTierValue === "CRITICAL" || riskTierValue === "HIGH"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        : riskTierValue === "ELEVATED" || riskTierValue === "MEDIUM"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        }`}>
                        {riskTierValue}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 text-[10px] text-[#C8D9E6]/70 border-t border-[#567C8D]/10">
                    <div>INDUSTRY SINK: <span className="text-white">{activeNode.industry}</span></div>
                    <div>CONTRACT ALLOC: <span className="text-white">${Number(activeNode.monthlySpending).toFixed(0)}/mo</span></div>
                    <div>COMPLAINTS FILE: <span className="text-white">{activeNode.complaintCount} TICKET LOGS</span></div>
                    <div>INACTIVITY GAP: <span className="text-white">{activeNode.inactivityDays} DAYS IDLE</span></div>
                </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg border bg-black/10 border-[#567C8D]/10">
                <span className="text-[9px] text-[#C8D9E6] font-bold tracking-tight block">{"// HISTORICAL_CHURN_TIMELINE_TRENDS"}</span>
                <div className="flex items-center justify-between text-[10px] text-[#C8D9E6]/60 pt-1">
                    {predictionLogsList.length > 0 ? (
                        predictionLogsList.slice(0, 4).reverse().map((log, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="text-center">
                                    <div className="text-[8px] text-[#C8D9E6]/40">RUN {predictionLogsList.length - (predictionLogsList.length - 1 - index)}</div>
                                    <div className={`font-bold mt-0.5 ${log.churnProbability >= 0.65 ? "text-rose-300" : log.churnProbability >= 0.35 ? "text-amber-300" : "text-emerald-300"}`}>
                                        {(log.churnProbability * 100).toFixed(0)}%
                                    </div>
                                </div>
                                {index < Math.min(predictionLogsList.length, 4) - 1 && <span className="text-[#567C8D]/30">→</span>}
                            </div>
                        ))
                    ) : (
                        <span className="text-[#C8D9E6]/40 italic text-[10px] pl-0.5">No evaluation matrices calculated for selected target.</span>
                    )}
                </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border bg-black/15 border-[#567C8D]/15">
                <div className="flex justify-between text-[10px] text-[#C8D9E6]">
                    <span>CHURN PROBABILITY MODEL EXPOSURE</span>
                    <span className="font-bold text-white">{probabilityPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/20">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${activeProbability >= 0.65 ? "bg-rose-400" : activeProbability >= 0.35 ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                        style={{ width: `${probabilityPercent}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3.5">
                <span className="text-[10px] uppercase tracking-wider block text-[#C8D9E6]/80">Local Feature Weight Vectors:</span>
                <div className="space-y-3">
                    {weights.map((item, idx) => {
                        const isPositive = item.val >= 0;
                        const absoluteWidth = Math.min(Math.abs(item.val) * 100, 100).toFixed(1);

                        return (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-[#F5EFEB]/80">{item.label}</span>
                                    <span className={isPositive ? "text-rose-300" : "text-emerald-300"}>
                                        {isPositive ? `+${item.val.toFixed(4)}` : item.val.toFixed(4)}
                                    </span>
                                </div>

                                <div className="w-full h-3 border rounded relative overflow-hidden flex bg-black/10 border-[#567C8D]/10">
                                    <div className="w-1/2 h-full flex justify-end border-r border-[#567C8D]/10">
                                        {!isPositive && (
                                            <div
                                                className="border-y border-l h-full transition-all duration-300 bg-emerald-500/10 border-emerald-500/30"
                                                style={{ width: `${absoluteWidth}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="w-1/2 h-full">
                                        {isPositive && (
                                            <div
                                                className="border-y border-r h-full transition-all duration-300 bg-rose-500/10 border-rose-500/30"
                                                style={{ width: `${absoluteWidth}%` }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3 p-3 rounded-lg border bg-black/20 border-[#567C8D]/20">
                <div className="flex justify-between items-center border-b pb-1.5 border-[#567C8D]/20">
                    <span className="text-[10px] text-zinc-300 font-bold">{"// RISK_WHAT_IF_SIMULATOR"}</span>
                    <div className="text-right flex items-center gap-2">
                        {isSimulating && (
                            <span className="text-[8px] text-amber-400 font-mono animate-pulse">COMPUTING...</span>
                        )}
                        <div>
                            <span className="text-[8px] text-zinc-500 block">SIMULATED MATRIX</span>
                            <span className={`font-black text-xs ${simulatedRisk >= 65 ? "text-rose-400" : simulatedRisk >= 35 ? "text-amber-400" : "text-emerald-400"}`}>
                                {simulatedRisk.toFixed(0)}% RISK
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-400">
                            <span>SUPPORT COMPLAINT TICKETS</span>
                            <span className="text-zinc-300">{complaints} ATTEMPTS</span>
                        </div>
                        <input type="range" min="0" max="15" value={complaints} onChange={(e) => setComplaints(parseInt(e.target.value, 10))} className="w-full h-1 rounded cursor-pointer accent-[#567C8D] bg-black/40" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-400">
                            <span>INACTIVITY INTERVAL PING</span>
                            <span className="text-zinc-300">{inactivity} IDLE DAYS</span>
                        </div>
                        <input type="range" min="0" max="90" value={inactivity} onChange={(e) => setInactivity(parseInt(e.target.value, 10))} className="w-full h-1 rounded cursor-pointer accent-[#567C8D] bg-black/40" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-400">
                            <span>USAGE FREQUENCY DENSITY</span>
                            <span className="text-zinc-300">{frequency} SESSIONS/WK</span>
                        </div>
                        <input type="range" min="0" max="50" value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value, 10))} className="w-full h-1 rounded cursor-pointer accent-[#567C8D] bg-black/40" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">{"// AUTOMATED_RETENTION_EMAIL_DISPATCH"}</span>
                <div className="relative">
                    <textarea
                        readOnly
                        value={structuralMailerTemplateText}
                        className="w-full h-24 text-zinc-500 text-[9px] p-2.5 rounded font-mono leading-normal resize-none focus:outline-none select-all bg-black/40 border border-[#567C8D]/20"
                    />
                    <div className="absolute bottom-1 right-2 text-[8px] text-zinc-700 font-bold uppercase select-none">
                        Click to Copy Payload Template
                    </div>
                </div>
            </div>

            {playbookRecommendations.length > 0 && (
                <div className="pt-2 space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">{"// MITIGATION_PLAYBOOK_RECOMMENDATIONS"}</span>
                    <div className="space-y-2">
                        {playbookRecommendations.map((rec, i) => (
                            <div key={i} className="rounded p-2.5 space-y-0.5 border border-[#567C8D]/20 bg-[#567C8D]/10">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-zinc-200">{rec.title}</span>
                                    <span className="text-zinc-500 text-[9px] uppercase">[{rec.type}]</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-normal">{rec.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-2 border-t flex justify-between text-[9px] text-zinc-500 select-none border-[#567C8D]/20">
                <span>EXPECTED BASE VALUE: {(Number(activeShapData.base_value) || 0).toFixed(3)}</span>
                <span>ENGINE: FASTAPI_V2_XGB_SHAP</span>
            </div>

        </div>
    );
}
