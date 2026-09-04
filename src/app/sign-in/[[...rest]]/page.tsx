import { SignIn } from "@clerk/nextjs";
import { Bot, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-3">
          <Bot className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5">
          <h1 className="font-bold text-2xl tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            My AI
          </h1>
          <Sparkles className="w-4 h-4 text-sky-500" />
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1 text-center max-w-xs">
          Sign in to access your AI assistant, reasoning models, and search history.
        </p>
      </div>

      {/* Clerk SignIn Component with catch-all route */}
      <div className="z-10 shadow-2xl rounded-2xl">
        <SignIn
          appearance={{
            elements: {
              card: "shadow-none border border-[var(--border)] bg-[var(--card)]",
              headerTitle: "text-[var(--foreground)]",
              headerSubtitle: "text-[var(--muted-foreground)]",
              socialButtonsBlockButton: "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]",
              formFieldLabel: "text-[var(--foreground)]",
              formFieldInput: "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:border-sky-500",
              formButtonPrimary: "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md shadow-sky-500/20",
              footerActionLink: "text-sky-500 hover:text-sky-600 font-medium",
              dividerLine: "bg-[var(--border)]",
              dividerText: "text-[var(--muted-foreground)]",
            },
          }}
        />
      </div>
    </div>
  );
}
