import Link from "next/link";
import { redirect } from "next/navigation";
import NavigationLinks from "./NavigationLinks";
import SignOutButton from "./SignOutButton";
import { getSession } from "../actions/auth";

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session?.tenantId) {
    redirect("/login");
  }

  const corporateFontFamily = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

  return (
    <div 
      className="flex min-h-screen bg-[#2F4156] text-[#F5EFEB] antialiased selection:bg-[#567C8D] selection:text-white"
      style={corporateFontFamily}
    >
      
      {/* 1. STRUCTURAL MASTER SIDEBAR PANEL */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-[#567C8D]/30 bg-[#2F4156] p-6 hidden md:flex flex-col justify-between z-30">
        <div className="space-y-6">
          
          {/* Brand Anchor Identity */}
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded bg-[#567C8D] text-white flex items-center justify-center font-bold text-xs border border-[#567C8D]">
              Δ
            </div>
            <span className="font-bold text-xs tracking-wider uppercase text-white">
              ChurnShield Console
            </span>
          </div>

          {/* Active Tenant Workspace Profile Card */}
          <div className="p-3 rounded-lg border border-[#567C8D]/30 bg-[#567C8D]/10 font-mono space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#C8D9E6]/70 uppercase font-bold">
              <span>TENANT PARTITION</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs font-bold text-white truncate">
              {session.tenantName}
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#C8D9E6]/60 pt-0.5 border-t border-[#567C8D]/20">
              <span className="truncate max-w-[130px]">{session.email}</span>
              <span className="px-1.5 py-0.2 rounded bg-[#567C8D]/30 text-emerald-300 font-bold text-[9px]">
                {session.role}
              </span>
            </div>
          </div>

          {/* Console Action Navigation List Tree */}
          <NavigationLinks />
        </div>

        {/* Workspace Session Controls Block */}
        <div className="border-t border-[#567C8D]/20 pt-4 space-y-2">
          <SignOutButton />
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded text-xs font-bold font-mono uppercase tracking-wider text-[#C8D9E6] hover:text-white hover:bg-[#567C8D]/10 transition-colors"
          >
            <span>Exit Workspace</span>
            <span>↗</span>
          </Link>
        </div>
      </aside>

      {/* 2. FULL-WIDTH CORE VIEWPORT CONTEXT */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 bg-[#2F4156]">
        
        {/* Unified Top Control Header */}
        <header className="h-16 border-b border-[#567C8D]/20 bg-[#2F4156]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[#C8D9E6]">
            <span>Analytics Control Desk</span> 
            <span className="text-zinc-500 font-mono hidden sm:inline">|</span>
            <span className="text-zinc-300 font-mono text-[11px] hidden sm:inline">{session.tenantName}</span>
          </div>
          
          {/* Defensible Server Baseline Badge Layer */}
          <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Inference Services Online
          </div>
        </header>

        {/* Stretched View Content Injection Hub */}
        <main className="p-6 w-full flex-1">
          {children}
        </main>
      </div>

    </div>
  );
}
