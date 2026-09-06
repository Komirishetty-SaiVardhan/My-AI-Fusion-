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
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=Homemade+Apple&family=Indie+Flower&family=Kalam:wght@300;400;700&family=Patrick+Hand&family=Shadows+Into+Light&display=swap"
            rel="stylesheet"
          />
        </head>
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

