# 🚀 My AI Fusion

> **An advanced, all-in-one AI platform for human-like conversational intelligence, autonomous agents, infinite diagram whiteboards, in-browser Python data science, multi-agent debates, interactive multi-file project workspaces, and high-performance productivity.**
> 
> **Solely Created & Developed by [Komirishetty Sai Vardhan](https://github.com/Komirishetty-SaiVardhan)**

---

## 🌟 Overview

**My AI Fusion** is a production-grade full-stack AI platform that unifies state-of-the-art LLM capabilities, multimodal document understanding, deterministic handwriting synthesis, client-side WebAssembly compute, and autonomous multi-agent systems into an intuitive, ultra-fast workspace.

---

## ✨ Flagship Feature Matrix

### 🧠 1. Human-Like AI Intelligence Suite
- **🎙️ Real-Time Conversational Voice Call Mode**:
  - Full-duplex conversational voice call interface with an animated 3D pulsating audio frequency orb.
  - Automated 1.2s silence turn-taking detection, instant interruption (*barge-in*) handling, and low-latency text-to-speech synthesis.
  - Live transcript drawer with microphone mute and speaker toggles.
- **🤖 Autonomous Multi-Step Task Agent**:
  - Automatically decomposes complex engineering goals into multi-stage execution pipelines (`plan`, `search`, `code`, `verify`, `reflect`, `finalize`).
  - Real-time execution trace logs, self-critique/self-correction callouts, and packaged code artifacts.
- **💡 "Thinking Out Loud" Cognitive Monologue Stream**:
  - Collapsible 5-stage Chain-of-Thought drawer (*Hypothesis ➔ Analysis ➔ Counterpoint & Risk ➔ Refinement ➔ Decision*) exposing internal human-like reasoning.
- **💻 Interactive Multi-File Project Workspace & Live Sandbox**:
  - Side-by-side IDE with a file tree explorer, tabbed code editor, live HTML/CSS/JS sandbox runner with mobile/desktop viewports, and one-click JSON/ZIP project export.
- **🎭 Emotional Intelligence & Adaptive Tone (EQ Engine)**:
  - Real-time sentiment & intent classifier (*Urgent ⚡, Frustrated 🛡️, Curious 💡, Analytical 🎯, Celebratory 🎉*) with dynamic tone modulation.
- **📄 Deep Multimodal Document & PDF Visual Inspector**:
  - Page-by-page document breakdowns, executive summaries, AI margin notes with clause commentary, and extracted tabular data tables.
- **🔮 Proactive Assistant & Smart Next-Step Anticipation**:
  - One-click contextual action chips (*"🧪 Generate Unit Tests"*, *"⚡ Benchmark & Optimize"*, *"🎨 Draw on Infinite Canvas"*, *"🗂️ Create Study Deck"*) rendered below messages.

---

### 🎨 2. Next-Gen Creative & Computing Tools
- **🎨 Infinite AI Canvas & Diagram Whiteboard**:
  - Infinite 2D pan/zoom whiteboard (20% to 300%) rendering system architectures, flowcharts, and concept maps with draggable nodes, bezier curves, and SVG vector export.
- **🎭 Multi-Agent Debate & "Panel of Experts" Mode**:
  - Orchestrates structured debates between 4 specialized personas (*Dr. Aris Vance* [Proponent], *Elena Rostova* [Skeptic], *Marcus Brody* [Pragmatist], and *Athena Core* [Synthesizer]) with trade-off matrices and actionable consensus.
- **🐍 In-Browser Python & Data Science Sandbox (Pyodide REPL)**:
  - Zero-backend client-side Python 3 execution via WebAssembly, supporting `stdout`/`stderr` terminal consoles and live **Matplotlib** chart captures.
- **🗂️ Quiz & Flashcard Study Deck Engine (SuperMemo SM-2)**:
  - 3D interactive flip flashcards with spaced repetition algorithms calculating optimal review intervals (*Again, Hard, Good, Easy*), plus multiple-choice quizzes with explanations.
- **🎙️ Audio Meeting & Lecture Summarizer**:
  - Structured meeting minutes with timestamp scrubber, executive takeaways, decision logs, and an interactive action item checklist with assignees.
- **🌐 Deep Autonomous Research Agent**:
  - Multi-hop web research visualization with real-time stage progress (*Planning, Searching, Verifying, Synthesizing*) and source credibility scoring.
- **🧠 Personal Memory & Knowledge Hub**:
  - Persistent user preference management center (*Tech Stack, Style Rules, Bio, Facts*) with pin/unpin controls and automatic context injection.
- **🎨 AI Image Studio & Variation Lab**:
  - Interactive visual art studio with 8 style presets (*Photorealistic 8K, Cyberpunk Neon, Studio Anime, Isometric 3D, Minimalist Vector, Oil Painting, Watercolor, Retro 80s Synthwave*) and aspect ratio selector.

---

### ✍️ 3. Deterministic Handwritten Notes & Document Synthesis
- **Deterministic Handwriting Engine**:
  - Generates 100% spelling-accurate, multi-page handwritten notes, essays, and assignments.
  - Paper textures: `lined`, `legal-pad`, `blank`, `grid`, `parchment`, `chalkboard`.
  - Inks: `blue`, `black`, `royal-blue`, `gel-black`, `red`, `emerald`, `pencil`, `white`.
  - Handwriting fonts: `Caveat`, `Kalam`, `Patrick Hand`, `Architects Daughter`, `Apple Script`, `Dancing Script`, `Indie Flower`, `Shadows Into Light`.
  - High-res PNG & SVG vector download.
- **Interactive Slide Decks & Mind Maps**:
  - Presenter-mode slide decks with speaker notes and PDF export.
  - Hierarchical mind map node graphs with zoom/pan and branch collapse.

---

## ⚡ Speed & Performance Architecture

My AI is engineered for ultra-low latency:
1. **Sub-400ms Time To First Token (TTFT)**: Non-blocking SSE stream parsing for concurrent reasoning and text tokens.
2. **Sliding-Window Context Pruning**: Preserves core prompt goals while pruning historical image payloads in long conversations (16+ turns), preventing token lag.
3. **HTTP/2 & Keep-Alive Connection Reuse**: Eliminates repetitive TCP handshake and TLS negotiation overhead.
4. **Multi-Tier Fallback Resilience**: Automated failover to active Gemini Flash models during provider traffic spikes.

---

## 🛠️ Technology Stack

- **Frontend & App Router**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS, Glassmorphism, Lucide Icons
- **AI Core & Routing**: Google Gemini 3.6 Flash / 3.7 Pro, Provider-Agnostic AI Gateway
- **Compute & Sandbox**: Pyodide (Python in WebAssembly), HTML/JS Live Iframe Sandbox
- **Memory & Storage**: LocalStorage + Encrypted Cloud Sync, SuperMemo SM-2 Engine
- **Auth & Security**: Clerk Authentication, SSRF Protection, Server-Side Rate Limiter, Zero-Secrets Memory Guard

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install
```bash
git clone https://github.com/SaiVardhan-os/My-AI-Fusion-.git
cd My-AI-Fusion-
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the automated test suites:
```bash
# Run all regression tests
npm test

# Run Human-Like AI Intelligence test suite
npm run test:human

# Run Next-Gen Features test suite
npm run test:nextgen

# Run TypeScript compilation check
npx tsc --noEmit
```

---

## 👨‍💻 Author & Developer

**Komirishetty Sai Vardhan**
- Sole Creator & Lead Developer of **My AI Fusion**
- GitHub: [@Komirishetty-SaiVardhan](https://github.com/Komirishetty-SaiVardhan)

---

## 📄 License
All rights reserved © 2026 Komirishetty Sai Vardhan.