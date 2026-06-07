"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { ensureSession } from "@/lib/api";
import { useAppStore } from "@/lib/store";

function DemoBootstrap() {
  const setDemoUser = useAppStore((s) => s.setDemoUser);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") setDemoUser();
    ensureSession().catch(console.error);
  }, [setDemoUser]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <DemoBootstrap />
      {children}
    </SessionProvider>
  );
}
