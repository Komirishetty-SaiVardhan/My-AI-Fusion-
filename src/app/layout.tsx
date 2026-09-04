import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/context/ThemeContext";
import { ChatProvider } from "@/context/ChatContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My AI — Fast, Reasoning & Multimodal AI Assistant",
  description:
    "An AI assistant platform designed for high performance, deep reasoning, web research, code synthesis, and an effortless user experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0ea5e9",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-sky-500/20 selection:text-sky-500`}
        >
          <ThemeProvider>
            <ChatProvider>{children}</ChatProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

