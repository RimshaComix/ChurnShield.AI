"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both corporate email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginUser(email, password);

        if (!result.success) {
          setErrorMessage(result.error || "Authentication failed. Please verify credentials.");
          return;
        }

        // Successfully authorized: redirect to multi-tenant dashboard
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Network error during authentication.");
      }
    });
  };

  const handleApplyPreset = (presetEmail, presetPassword) => {
    setEmail(presetEmail);
    setPassword(presetPassword);
    setErrorMessage("");
  };

  const corporateFontFamily = { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between bg-[#2F4156] text-[#F5EFEB] antialiased selection:bg-[#567C8D] selection:text-white"
      style={corporateFontFamily}
    >
      {/* 1. TOP MINIMALIST HEADER */}
      <header className="w-full px-6 py-5 border-b border-[#567C8D]/20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-6 w-6 rounded bg-[#567C8D] text-white flex items-center justify-center font-bold text-xs border border-[#567C8D] group-hover:bg-[#4a6b7a] transition-colors">
            Δ
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-white">
            ChurnShield.AI
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-mono uppercase tracking-wider text-[#C8D9E6] hover:text-white transition-colors"
        >
          ← Return to Landing
        </Link>
      </header>

      {/* 2. CENTER SIGN-IN CONSOLE CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header Typography */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#567C8D]/15 border border-[#567C8D]/30 text-[10px] font-mono uppercase tracking-wider text-[#C8D9E6]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Multi-Tenant Isolation Wall Active
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Access Console
            </h1>
            <p className="text-xs text-[#C8D9E6]/80 max-w-sm mx-auto">
              Sign in with your corporate credentials to access tenant-partitioned risk analytics and inference telemetry.
            </p>
          </div>

          {/* Sign-In Card */}
          <div className="rounded-xl border border-[#567C8D]/30 bg-[#243344] p-6 shadow-2xl backdrop-blur-sm space-y-5">
            
            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg border border-rose-900/50 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="text-rose-400 font-bold">✕</span>
                <div className="space-y-0.5">
                  <div className="font-bold uppercase tracking-wider text-[10px]">Authorization Error</div>
                  <div className="text-[11px] leading-relaxed text-rose-300/90">{errorMessage}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email-input"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#C8D9E6]/90 font-semibold"
                >
                  Corporate Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@airtel-enterprise.com"
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#567C8D]/40 bg-[#1e2a38] text-white text-xs placeholder-[#567C8D] focus:outline-none focus:border-[#C8D9E6] focus:ring-1 focus:ring-[#C8D9E6] transition-all font-mono disabled:opacity-60"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password-input"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#C8D9E6]/90 font-semibold"
                >
                  Security Key / Password
                </label>
                <input
                  id="password-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#567C8D]/40 bg-[#1e2a38] text-white text-xs placeholder-[#567C8D] focus:outline-none focus:border-[#C8D9E6] focus:ring-1 focus:ring-[#C8D9E6] transition-all font-mono disabled:opacity-60"
                />
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 rounded-lg bg-[#567C8D] hover:bg-[#4a6b7a] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <span>Authenticate Session →</span>
                )}
              </button>
            </form>

            {/* Quick Tenant Switcher Presets */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="pt-4 border-t border-[#567C8D]/20 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#C8D9E6]/70 uppercase">
                  <span>BENCHMARK TENANT PROFILES:</span>
                  <span className="text-zinc-400">1-CLICK HYDRATE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("admin@airtel-enterprise.com", "admin_secure_password")}
                    disabled={isPending}
                    className="p-2 rounded border border-[#567C8D]/30 bg-[#1e2a38] hover:bg-[#567C8D]/20 hover:border-[#567C8D]/60 text-left transition-all group"
                  >
                    <div className="font-bold text-white group-hover:text-emerald-300">Airtel Enterprise</div>
                    <div className="text-[#C8D9E6]/60 truncate">Role: ADMIN</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("analyst@alpha-fintech.com", "analyst_secure_password")}
                    disabled={isPending}
                    className="p-2 rounded border border-[#567C8D]/30 bg-[#1e2a38] hover:bg-[#567C8D]/20 hover:border-[#567C8D]/60 text-left transition-all group"
                  >
                    <div className="font-bold text-white group-hover:text-cyan-300">Alpha Fintech</div>
                    <div className="text-[#C8D9E6]/60 truncate">Role: ANALYST</div>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Security Footnote */}
          <div className="text-center text-[10px] font-mono text-[#C8D9E6]/50 space-y-1">
            <div>Encrypted HTTP-Only Tokens (AES-256-GCM) • Zero Cross-Tenant Data Leaks</div>
            <div>ChurnShield Telemetry Risk Core v2.0</div>
          </div>

        </div>
      </main>

      {/* 3. MINIMALIST FOOTER */}
      <footer className="w-full px-6 py-4 border-t border-[#567C8D]/20 text-center text-xs font-mono text-[#C8D9E6]/60">
        ChurnShield.AI &copy; {new Date().getFullYear()} — Enterprise Multi-Tenant Privacy Protocol
      </footer>
    </div>
  );
}

