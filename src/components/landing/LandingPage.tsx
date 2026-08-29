"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Brain,
  Globe,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Lock,
} from "lucide-react";

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  const FAQS = [
    {
      q: "What makes Auto Mode different from other AI assistants?",
      a: "With traditional AI platforms, you have to manually guess which model to select (e.g. fast vs reasoning) and craft prompts to invoke tools. My AI's Auto Mode analyzes your intent, automatically conducts parallel web searches, executes calculations, and structures answers without you needing to manage technical settings.",
    },
    {
      q: "How does My AI ensure privacy and security?",
      a: "We enforce a zero-secrets guarantee. All user API keys, passwords, and tokens are blocked from persistent memory. Uploaded images are processed ephemerally in memory and purged unless you explicitly choose to save them. All data is strictly isolated per user.",
    },
    {
      q: "Are the web research citations verified?",
      a: "Yes. Our 10-stage web research pipeline removes tracking parameters, deduplicates URLs, extracts verified evidence, and strictly sanitizes responses to prevent hallucinated citations.",
    },
    {
      q: "Can I use My AI for free?",
      a: "Yes! Our Free plan provides 50 requests per day with Auto Mode, Fast model streaming, and basic tool execution with no credit card required.",
    },
    {
      q: "What file and image formats are supported?",
      a: "We support PDF, DOCX, Markdown, and TXT files for document vector search, plus JPEG, PNG, WebP, and GIF for screenshots, diagrams, charts, handwritten notes, and scanned pages.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-sky-500/20">
      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              My AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--muted-foreground)]">
            <a href="#capabilities" className="hover:text-[var(--foreground)] transition-colors">
              Capabilities
            </a>
            <a href="#auto-mode" className="hover:text-[var(--foreground)] transition-colors">
              Auto Mode
            </a>
            <a href="#security" className="hover:text-[var(--foreground)] transition-colors">
              Security
            </a>
            <a href="#pricing" className="hover:text-[var(--foreground)] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[var(--foreground)] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 text-center overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-semibold mb-6 shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Introducing Auto Mode ⚡ The Zero-Complexity AI Experience</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.15] mb-6">
            One AI. Every task.{" "}
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Zero complexity.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop switching models and tweaking prompts. My AI automatically selects the fastest routes, performs deep web research, analyzes files and images, and executes safe math tools with precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-14">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#auto-mode"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium transition-colors"
            >
              <span>See Auto Mode Demo</span>
            </a>
          </div>

          {/* Feature Highlights Ticker */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] pt-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Web Research</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Multimodal Vision & OCR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Vector Document Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero-Secrets Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Auto Mode Explanation */}
      <section id="auto-mode" className="py-20 px-4 sm:px-6 bg-[var(--muted)]/30 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
              How Auto Mode Works
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              You ask a question; the system handles the intelligence stack behind the scenes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] relative shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-mono font-bold text-xs mb-3">
                1
              </div>
              <h3 className="font-semibold text-sm mb-1 text-[var(--foreground)]">Understanding</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Decomposes intent, detects research needs, and identifies necessary tools.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] relative shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-mono font-bold text-xs mb-3">
                2
              </div>
              <h3 className="font-semibold text-sm mb-1 text-[var(--foreground)]">Searching</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Executes parallel search queries, removes duplicate URLs, and ranks authoritative sources.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] relative shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-mono font-bold text-xs mb-3">
                3
              </div>
              <h3 className="font-semibold text-sm mb-1 text-[var(--foreground)]">Analyzing</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Extracts grounded evidence, runs sandboxed calculations, and models trade-offs.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] relative shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-mono font-bold text-xs mb-3">
                4
              </div>
              <h3 className="font-semibold text-sm mb-1 text-[var(--foreground)]">Preparing Answer</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Streams formatted markdown tables, comparisons, and verified citations directly to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Grid */}
      <section id="capabilities" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
              Comprehensive AI Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Built with production-grade TypeScript and provider-independent architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-sky-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2 text-[var(--foreground)]">Web Research Pipeline</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                10-stage research engine with parallel search, URL deduplication, and grounded source citations.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2 text-[var(--foreground)]">Document Intelligence</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Vector retrieval-augmented generation across PDF, DOCX, Markdown, and TXT with page references.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-purple-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2 text-[var(--foreground)]">Multimodal Vision</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Understand screenshots, architectural diagrams, charts, handwritten notes, and scanned invoices.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2 text-[var(--foreground)]">Safe AI Memory</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Learns stable user preferences and project rules. Never stores ephemeral chatter or secrets.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-amber-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2 text-[var(--foreground)]">Secure Tool Calling</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Sandboxed math evaluator and search integrations with timeout guards and loop prevention.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-rose-500/40 transition-colors shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2 text-[var(--foreground)]">Security & Privacy Guard</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Prompt injection defense, SSRF blocking, tenant data isolation, and rate-limited APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Security & Privacy */}
      <section id="security" className="py-20 px-4 sm:px-6 bg-[var(--muted)]/30 border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
              Enterprise-Grade Security by Design
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Your data belongs to you. We protect inputs and identities at every layer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2">Zero-Secrets Logging</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                API keys, passwords, and private tokens are automatically scrubbed from memory and runtime logs.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2">SSRF & Injection Defense</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Adversarial jailbreaks and private subnet metadata IP accesses are blocked at the perimeter.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-2">Ephemeral File Storage</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Uploaded images and temporary documents are held in session memory and purged cleanly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Transparent Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Start for free, upgrade when you need unlimited deep reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="p-7 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Free Plan
                </span>
                <div className="mt-3 mb-6">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">₹0</span>
                  <span className="text-xs text-[var(--muted-foreground)] ml-1">/ forever</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--muted-foreground)] mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>50 requests per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Auto Mode intelligent routing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Low-latency streaming responses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>10MB upload limits</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onLaunchApp}
                className="w-full py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-xs font-semibold transition-colors cursor-pointer"
              >
                Start Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-7 rounded-3xl border-2 border-sky-500 bg-[var(--card)] shadow-xl shadow-sky-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                  Pro Plan
                </span>
                <div className="mt-3 mb-6">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">₹1,499</span>
                  <span className="text-xs text-[var(--muted-foreground)] ml-1">/ month ($19)</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--muted-foreground)] mb-8">
                  <li className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    <span>2,000 requests per day</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    <span>Unlimited Deep Reasoning</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    <span>Full Multi-Source Web Research</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    <span>50MB document uploads & larger context</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-sky-500" />
                    <span>Priority compute & zero wait queues</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onLaunchApp}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-[var(--muted)]/30 border-y border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Everything you need to know about My AI.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-xs sm:text-sm text-[var(--foreground)] hover:text-sky-500 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA */}
      <section className="py-24 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-4">
            Ready to experience effortless AI?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-8 max-w-lg mx-auto leading-relaxed">
            Join thousands of developers, researchers, and creators using My AI every day.
          </p>

          <button
            onClick={onLaunchApp}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Launch My AI Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4 sm:px-6 text-center text-xs text-[var(--muted-foreground)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--foreground)]">My AI</span>
            <span>•</span>
            <span>One AI. Every task. Zero complexity.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <span>© {new Date().getFullYear()} My AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
