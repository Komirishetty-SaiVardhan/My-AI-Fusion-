"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/components/landing/LandingPage";

export default function HomePage() {
  const [view, setView] = useState<"app" | "landing">(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("view") === "landing") {
        return "landing";
      }
    }
    return "app";
  });

  if (view === "landing") {
    return <LandingPage onLaunchApp={() => setView("app")} />;
  }

  return <AppShell />;
}
