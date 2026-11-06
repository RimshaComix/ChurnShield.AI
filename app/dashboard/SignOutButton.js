"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "../actions/auth";

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center justify-between px-3 py-2 rounded text-xs font-bold font-mono uppercase tracking-wider text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-colors disabled:opacity-50"
    >
      <span>{isPending ? "Disconnecting..." : "Disconnect Session"}</span>
      <span>⏻</span>
    </button>
  );
}

