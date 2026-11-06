"use client";

import { useState } from "react";
import Link from "next/link";

const REVIEWS = [
  { name: "Sarah Jenkins", role: "Growth at SaaSify", text: "Recovered $42k ARR in 30 days via the inference pipeline." },
  { name: "Marcus Chen", role: "Retention at TelcoCorp", text: "SHAP metrics stopped guessing. Agents know exactly why users flag." },
  { name: "Elena Rostova", role: "Analytics at FinBank", text: "Flawless Next.js implementation straight out of our DB clusters." },
  { name: "David Miller", role: "Ops Lead at StreamNet", text: "Inactivity scoring is lethal. Immediate tactical insights." }
];

export default function Home() {
  const [isDark, setIsDark] = useState(true);

  // Elite corporate font stack 
  const corporateFontFamily = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

  return (
    <div 
      className={`min-h-screen flex flex-col antialiased selection:bg-[#567C8D] selection:text-white transition-colors duration-200 ${
        isDark ? "bg-[#2F4156] text-[#F5EFEB]" : "bg-[#F5EFEB] text-[#2F4156]"
      }`} 
      style={corporateFontFamily}
    >
      
      {/* 1. NAVIGATION HUB */}
      <header className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors duration-200 ${
        isDark ? "bg-[#2F4156]/90 border-[#567C8D]/30" : "bg-[#F5EFEB]/90 border-[#C8D9E6]"
      }`}>
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
          
          {/* Logo Frame */}
          <div className="flex items-center gap-2.5">
            <div className={`h-6 w-6 rounded flex items-center justify-center font-bold text-xs border ${
              isDark ? "bg-[#567C8D] text-white border-[#567C8D]" : "bg-[#2F4156] text-white border-[#2F4156]"
            }`}>
              Δ
            </div>
            <span className={`font-bold text-sm tracking-tight ${isDark ? "text-white" : "text-[#2F4156]"}`}>
              ChurnShield.AI
            </span>
          </div>

          {/* Navigation Tracks */}
          <nav className={`hidden md:flex items-center gap-8 text-xs font-bold tracking-wide ${
            isDark ? "text-[#C8D9E6]/80" : "text-[#567C8D]"
          }`}>
            <a href="#features" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Features</a>
            <a href="#capabilities" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Capabilities</a>
            <a href="#reviews" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Case Studies</a>
            <a href="#sectors" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Sectors</a>
          </nav>

          {/* Theme & Access Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`text-xs px-3 py-1.5 rounded border font-bold transition-colors ${
                isDark ? "border-[#567C8D]/40 bg-[#567C8D]/10 text-[#C8D9E6] hover:bg-[#567C8D]/20" : "border-[#C8D9E6] bg-white text-[#567C8D] hover:bg-[#C8D9E6]/20"
              }`}
            >
              {isDark ? "Light Presentation" : "Dark Presentation"}
            </button>
            <Link 
              href="/login" 
              className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${
                isDark ? "border-[#567C8D]/40 text-[#C8D9E6] hover:text-white hover:bg-[#567C8D]/20" : "border-[#C8D9E6] text-[#567C8D] hover:bg-[#C8D9E6]/20"
              }`}
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className={`text-xs font-bold px-4 py-1.5 rounded transition-colors ${
                isDark ? "bg-[#567C8D] text-white hover:bg-[#4a6b7a]" : "bg-[#2F4156] text-white hover:bg-[#233142]"
              }`}
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* CORE DISPLAY CONTAINER (Edge-to-Edge Fluid Flow Layout) */}
      <main className="flex-1 w-full px-6 md:px-12 py-12 lg:py-16 flex flex-col gap-16">
        
        {/* 2. SPLIT HERO PANEL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* LEFT PANEL: SCIENTIFICALLY OBJECTIVE HEADLINE AND VALUE PROP */}
          <div className="lg:col-span-7 flex flex-col items-start text-left w-full">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-bold mb-6 ${
              isDark ? "border-[#567C8D]/30 bg-[#567C8D]/10 text-[#C8D9E6]" : "border-[#C8D9E6] bg-white text-[#567C8D]"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#567C8D]" />
              Enterprise Customer Retention Platform
            </div>
            
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 ${
              isDark ? "text-white" : "text-[#2F4156]"
            }`}>
              PREDICT CHURN RISK.<br />
              <span className={isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}>ENABLE PROACTIVE CUSTOMER RETENTION.</span>
            </h1>
            
            <p className={`max-w-2xl text-xs sm:text-sm mb-8 font-normal leading-relaxed ${
              isDark ? "text-[#F5EFEB]/80" : "text-[#2F4156]/90"
            }`}>
              An AI-powered customer retention platform that combines predictive analytics, explainable AI, customer segmentation, and intelligent recommendations to help organizations identify churn risk and make proactive, data-driven retention decisions.
            </p>

            <div className="w-full max-w-xs">
              <Link
                className={`w-full h-11 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                  isDark ? "bg-[#567C8D] text-white hover:bg-[#4a6b7a]" : "bg-[#2F4156] text-white hover:bg-[#233142]"
                }`}
                href="/dashboard"
              >
                Launch Dashboard Console
              </Link>
            </div>
          </div>

          {/* RIGHT PANEL: LIVE HONEST PIPELINE TIMELINE TERMINAL */}
          <div className="lg:col-span-5 flex flex-col w-full">
            <div className={`p-5 rounded border flex flex-col justify-between h-[516px] w-full ${
              isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-white"
            }`}>
              <div className="w-full flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}`}>Live Execution Terminal</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-500">SYSTEM_READY</span>
                  </div>
                </div>

                {/* Raw Code Terminal Shell */}
                <div className="flex-1 rounded p-4 font-mono text-[11px] leading-relaxed overflow-y-auto bg-black/30 border border-slate-500/5 text-slate-300">
                  <div className="flex gap-2">
                    <span className="text-[#567C8D] font-bold">$&gt;</span>
                    <span>npm run start:pipeline</span>
                  </div>
                  <div className="text-zinc-500 mt-2">[info] Initializing inference services...</div>
                  <div className="text-zinc-400">[success] Database connection established</div>
                  <div className="text-zinc-500 mt-2">[info] Loading inference engine...</div>
                  <div className="text-zinc-400">[success] Inference service initialized</div>
                  <div className="text-zinc-500 mt-2">[info] Loading explainability module...</div>
                  <div className="text-[#567C8D] font-bold">[active] SHAP feature attribution enabled</div>
                  <div className="text-zinc-500 mt-2">[info] Initializing customer segmentation...</div>
                  <div className="text-emerald-400 font-bold">[online] Monitoring 12,480 active customer records</div>
                  <div className="mt-3 flex gap-1 animate-pulse">
                    <span className="text-[#567C8D] font-bold">$&gt;</span>
                    <span className="h-4 w-1.5 bg-[#567C8D]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-500/10 pt-3 mt-3 w-full">
                <div className="min-w-0">
                  <div className={`text-[10px] font-bold ${isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}`}>Attribution Monitoring Core</div>
                  <div className={`text-xs font-normal truncate ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>pipeline_runtime_verification_stream</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 shrink-0">EXECUTION OK</span>
              </div>
            </div>
          </div>

        </section>

        {/* 📊 LIVE PLATFORM REAL-TIME DATA BANNER */}
        <section className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-500/10 bg-black/5 dark:bg-black/10 px-6 rounded-md">
          {[
            { label: "Customers Monitored", value: "12,480+" },
            { label: "Predictions Generated", value: "84,000+" },
            { label: "Revenue at Risk", value: "₹12.4M" },
            { label: "Inference Confidence", value: "94.2%" }
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col justify-center">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#C8D9E6]/60" : "text-[#567C8D]/80"}`}>
                {stat.label}
              </span>
              <div className={`text-2xl font-black tracking-tight mt-1 ${isDark ? "text-white" : "text-[#2F4156]"}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </section>

        {/* 🛠️ CORE PRODUCT CAPABILITIES GRID */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
          {[
            { title: "Predictive Analytics", desc: "AI-powered churn prediction using customer behavioral insights." },
            { title: "Explainable AI", desc: "Understand exactly why each customer is predicted to churn." },
            { title: "Customer Segmentation", desc: "Identify high-value, loyal, and at-risk customer cohorts." },
            { title: "Retention Playbooks", desc: "Generate personalized retention strategies based on customer risk and behavior." }
          ].map((feat, idx) => (
            <div key={idx} className={`p-5 rounded border ${isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-white"}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>{feat.title}</h4>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#F5EFEB]/70" : "text-[#2F4156]/80"}`}>{feat.desc}</p>
            </div>
          ))}
        </section>

        {/* 3. BENTO PARAMETER MATRIX */}
        <section id="features" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Accurate Performance Metrics */}
          <div className={`p-6 rounded border flex flex-col justify-between h-44 md:col-span-2 ${
            isDark ? "border-[#567C8D]/20 bg-[#567C8D]/10" : "border-[#C8D9E6] bg-[#C8D9E6]/20"
          }`}>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}`}>Inference Confidence</span>
              <div className={`text-4xl font-bold tracking-tight mt-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>94.2%</div>
            </div>
            <span className={`text-xs font-bold ${isDark ? "text-[#C8D9E6]/60" : "text-[#567C8D]"}`}>
              Validation Dataset
            </span>
          </div>

          {/* Card 2: SHAP Explainability Matrix */}
          <div className={`p-6 rounded border flex flex-col justify-between h-44 ${
            isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-white"
          }`}>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}`}>SHAP Explainability</span>
              <div className={`text-4xl font-bold tracking-tight mt-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>&lt; 45 ms</div>
            </div>
            <p className={`text-xs ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>Feature contribution analysis</p>
          </div>

          {/* Card 3: Telecommunications */}
          <div id="sectors" className={`p-6 rounded border flex flex-col justify-between h-48 ${
            isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-white"
          }`}>
            <div>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>Telecommunications</h3>
              <p className={`text-xs leading-normal ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>
                Analyzes usage patterns, inactivity, billing history, and customer support interactions to identify churn risk.
              </p>
            </div>
          </div>

          {/* Card 4: Banking Arena */}
          <div className={`p-6 rounded border flex flex-col justify-between h-48 md:col-span-2 ${
            isDark ? "border-[#567C8D]/20 bg-[#567C8D]/10" : "border-[#C8D9E6] bg-[#C8D9E6]/20"
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className={`font-bold text-sm mb-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>Banking</h3>
                  <p className={`text-xs leading-normal ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>
                    Analyzes transaction activity, account balance trends, and customer engagement to detect potential churn.
                  </p>
                </div>
              </div>
              <div className={`rounded p-4 flex flex-col justify-center text-center ${
                isDark ? "border border-[#567C8D]/30 bg-[#2F4156]" : "border border-[#C8D9E6] bg-white"
              }`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}`}>Estimated Retention Impact</span>
                <div className="text-3xl font-bold text-emerald-500 mt-1">22.4%</div>
                <span className={`text-[8px] uppercase tracking-wider block mt-1 ${isDark ? "text-[#C8D9E6]/40" : "text-[#567C8D]/50"}`}>Simulation</span>
              </div>
            </div>
          </div>

          {/* Card 5: SaaS Platforms */}
          <div className={`p-6 rounded border flex flex-col justify-between h-48 md:col-span-2 ${
            isDark ? "border-[#567C8D]/20 bg-[#567C8D]/10" : "border-[#C8D9E6] bg-[#C8D9E6]/20"
          }`}>
            <div>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>SaaS Platforms</h3>
              <p className={`text-xs leading-normal max-w-md ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>
                Tracks product usage, workspace activity, seat utilization, and engagement metrics to identify at-risk customers.
              </p>
            </div>
          </div>

          {/* Card 6: Commerce */}
          <div className={`p-6 rounded border flex flex-col justify-between h-48 ${
            isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-white"
          }`}>
            <div>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? "text-white" : "text-[#2F4156]"}`}>Commerce</h3>
              <p className={`text-xs leading-normal ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>
                Monitors purchase frequency, subscription activity, and customer engagement to identify retention opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* ✅ PLATFORM CORE CAPABILITIES CHECKLIST GRID */}
        <section id="capabilities" className="w-full flex flex-col gap-6 py-4">
          <div className="border-b border-slate-500/10 pb-3">
            <h3 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-[#2F4156]"}`}>Core Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { title: "Predict Churn Risk", desc: "Estimate the likelihood of customer churn." },
              { title: "Explain Predictions", desc: "Identify the key factors influencing each prediction." },
              { title: "Segment Customers", desc: "Group customers based on behavioral patterns." },
              { title: "Recommend Actions", desc: "Generate personalized retention strategies." },
              { title: "Monitor Revenue Risk", desc: "Estimate potential financial impact from churn." }
            ].map((cap, i) => (
              <div key={i} className="flex flex-col text-left">
                <span className="text-[#567C8D] text-xs font-bold mb-1">✓ {cap.title}</span>
                <p className={`text-xs leading-relaxed ${isDark ? "text-[#F5EFEB]/60" : "text-[#2F4156]/70"}`}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. PERFORMANCE VERIFICATION CASE STUDIES */}
        <section id="reviews" className={`w-full py-10 border-y relative overflow-hidden select-none ${
          isDark ? "bg-[#567C8D]/10 border-[#567C8D]/20" : "bg-[#C8D9E6]/10 border-[#C8D9E6]"
        }`}>
          <div className="flex gap-6 animate-marquee whitespace-nowrap min-w-full [animation-duration:15s] will-change-transform hover:[animation-play-state:paused]">
            {[...REVIEWS, ...REVIEWS].map((item, idx) => (
              <div 
                key={idx} 
                className={`inline-block whitespace-normal w-72 shrink-0 p-5 rounded border ${
                  isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-white"
                }`}
              >
                <div className="flex gap-0.5 mb-3 text-amber-500 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>

                <p className={`text-xs leading-relaxed mb-4 font-bold ${isDark ? "text-white" : "text-[#2F4156]"}`}>
                  “{item.text}”
                </p>
                <div className="flex flex-col border-t border-slate-500/10 pt-2">
                  <span className={`font-bold text-xs tracking-tight ${isDark ? "text-white" : "text-[#2F4156]"}`}>{item.name}</span>
                  <span className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-[#C8D9E6]" : "text-[#567C8D]"}`}>{item.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 5. DEFENSIVE COMPREHENSIVE FOOTER DIRECTORY */}
      <footer className={`w-full border-t transition-colors ${
        isDark ? "border-[#567C8D]/20 bg-[#2F4156]" : "border-[#C8D9E6] bg-[#F5EFEB]"
      }`}>
        <div className={`w-full px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between text-xs font-bold gap-4 ${
          isDark ? "text-[#C8D9E6]/60" : "text-[#567C8D]"
        }`}>
          <span>Enterprise Security Framework Baseline © {new Date().getFullYear()}</span>
          <div className="flex gap-6">
            <a href="#" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Enterprise Security</a>
            <a href="#" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Data Privacy</a>
            <a href="#" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>REST API</a>
            <a href="#" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-[#2F4156]"}`}>Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
