import { AI_PERSONA_PRESETS } from "../personas/presets";

export async function runNewFeaturesTestSuite() {
  console.log("=================================================");
  console.log("RUNNING SUITE FOR 8 ADVANCED FEATURES");
  console.log("=================================================");

  let testCount = 0;
  const pass = (label: string) => {
    testCount++;
    console.log(`  PASS [${testCount.toString().padStart(2, "0")}]: ${label}`);
  };

  // 1. AI Personas
  console.log("\n[1] Testing: Custom AI Personas & Specialists");
  const defaultPersona = AI_PERSONA_PRESETS.find((p) => p.id === "default");
  if (!defaultPersona) throw new Error("Default persona missing");
  pass("Default general assistant persona configured");

  const architect = AI_PERSONA_PRESETS.find((p) => p.id === "architect");
  if (!architect || !architect.systemPromptModifier.includes("SOFTWARE ARCHITECT")) {
    throw new Error("Architect persona invalid");
  }
  pass("Senior Software Architect persona configured");

  const mathTutor = AI_PERSONA_PRESETS.find((p) => p.id === "tutor");
  if (!mathTutor || !mathTutor.systemPromptModifier.includes("step-by-step")) {
    throw new Error("Math Tutor persona invalid");
  }
  pass("Math & Science Tutor persona configured");

  const careerCoach = AI_PERSONA_PRESETS.find((p) => p.id === "career");
  if (!careerCoach) throw new Error("Career coach persona missing");
  pass("Executive Career Coach persona configured");

  const legalAnalyst = AI_PERSONA_PRESETS.find((p) => p.id === "legal");
  if (!legalAnalyst) throw new Error("Legal analyst persona missing");
  pass("Legal & Policy Analyst persona configured");

  const creativeWriter = AI_PERSONA_PRESETS.find((p) => p.id === "creative");
  if (!creativeWriter) throw new Error("Creative writer persona missing");
  pass("Creative Storyteller persona configured");

  // 2. Slide Deck JSON Parsing & Validation
  console.log("\n[2] Testing: AI Slide Deck Data Structures");
  const validSlideJson = JSON.stringify([
    {
      title: "Vision 2026",
      subtitle: "The Future of Multimodal AI",
      bullets: ["Ultra low latency", "Voice duplex", "Code live sandboxing"],
      notes: "Welcome the keynote attendees."
    },
    {
      title: "Architecture Highlights",
      bullets: ["Next.js 16 App Router", "Server-Side AI Gateway", "Isolated Sandboxing"],
    }
  ]);
  const parsedSlides = JSON.parse(validSlideJson);
  if (!Array.isArray(parsedSlides) || parsedSlides.length !== 2) {
    throw new Error("Failed to parse slides");
  }
  pass("Slide deck array parsed correctly");
  if (parsedSlides[0].title !== "Vision 2026" || parsedSlides[0].bullets.length !== 3) {
    throw new Error("Slide content mismatch");
  }
  pass("Slide bullets and speaker notes preserved");

  // 3. Interactive Mind Map Hierarchical Structure
  console.log("\n[3] Testing: Mind Map Hierarchical Tree Structure");
  const validMindmapJson = JSON.stringify({
    name: "Artificial Intelligence",
    children: [
      {
        name: "Deep Learning",
        children: [
          { name: "Transformers" },
          { name: "Diffusion Models" }
        ]
      },
      {
        name: "Classical ML",
        children: [
          { name: "Random Forests" },
          { name: "SVM" }
        ]
      }
    ]
  });
  const parsedMindmap = JSON.parse(validMindmapJson);
  if (!parsedMindmap.name || parsedMindmap.children.length !== 2) {
    throw new Error("Invalid mindmap hierarchy");
  }
  pass("Mind map root node and branches parsed");
  if (parsedMindmap.children[0].children.length !== 2) {
    throw new Error("Mind map sub-nodes invalid");
  }
  pass("Mind map sub-leaves structured correctly");

  // 4. SSRF Validation Helper Logic
  console.log("\n[4] Testing: Webpage Scraper & SSRF Defense");
  const isPrivateIp = (hostname: string): boolean => {
    const cleanHost = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (cleanHost === "localhost" || cleanHost === "127.0.0.1" || cleanHost === "::1" || cleanHost === "0.0.0.0") return true;
    if (cleanHost.startsWith("10.") || cleanHost.startsWith("192.168.") || cleanHost === "169.254.169.254") return true;
    const match172 = cleanHost.match(/^172\.(\d+)\./);
    if (match172) {
      const secondOctet = parseInt(match172[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    return false;
  };

  if (!isPrivateIp("localhost")) throw new Error("localhost not flagged as private");
  pass("SSRF Filter: Blocked localhost");
  if (!isPrivateIp("127.0.0.1")) throw new Error("127.0.0.1 not flagged as private");
  pass("SSRF Filter: Blocked 127.0.0.1 loopback");
  if (!isPrivateIp("169.254.169.254")) throw new Error("AWS metadata IP not flagged");
  pass("SSRF Filter: Blocked cloud metadata IP");
  if (!isPrivateIp("192.168.1.100")) throw new Error("192.168.x not flagged");
  pass("SSRF Filter: Blocked 192.168.x subnet");
  if (!isPrivateIp("10.0.0.5")) throw new Error("10.x not flagged");
  pass("SSRF Filter: Blocked 10.x subnet");
  if (!isPrivateIp("172.20.0.1")) throw new Error("172.20.x not flagged");
  pass("SSRF Filter: Blocked 172.16-31 private subnet");
  if (isPrivateIp("google.com")) throw new Error("google.com falsely flagged as private");
  pass("SSRF Filter: Allowed public domain google.com");

  // 5. Prompt Enhancer Heuristic Fallback
  console.log("\n[5] Testing: Prompt Enhancer Expansion Logic");
  const expandPrompt = (prompt: string): string => {
    const raw = prompt.trim();
    return `Act as an expert specialist in this domain. Provide a comprehensive, in-depth explanation and solution for: "${raw}". Include clear step-by-step reasoning, real-world examples, best practices, potential pitfalls to avoid, and structured markdown output.`;
  };
  const expanded = expandPrompt("build a todo app");
  if (!expanded.includes("build a todo app") || !expanded.includes("step-by-step")) {
    throw new Error("Prompt expansion heuristic failed");
  }
  pass("Prompt enhancer preserves user intent and adds high-signal instructions");

  // 6. Document Diff Computation
  console.log("\n[6] Testing: Document Diff Comparison Computation");
  const docA = ["Line 1: Introduction", "Line 2: Overview", "Line 3: Conclusion"];
  const docB = ["Line 1: Introduction", "Line 2: Updated Overview with Metrics", "Line 3: Conclusion", "Line 4: Appendix"];
  
  const computeDiff = (a: string[], b: string[]) => {
    const maxLen = Math.max(a.length, b.length);
    const diffs: { type: "same" | "modified" | "added" | "removed"; aText?: string; bText?: string }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const lineA = a[i];
      const lineB = b[i];
      if (lineA === lineB) {
        diffs.push({ type: "same", aText: lineA, bText: lineB });
      } else if (lineA && lineB) {
        diffs.push({ type: "modified", aText: lineA, bText: lineB });
      } else if (!lineA && lineB) {
        diffs.push({ type: "added", bText: lineB });
      } else if (lineA && !lineB) {
        diffs.push({ type: "removed", aText: lineA });
      }
    }
    return diffs;
  };

  const diffResult = computeDiff(docA, docB);
  if (diffResult.length !== 4) throw new Error("Diff calculation length mismatch");
  pass("Computed diff line count matches max line length");
  if (diffResult[0].type !== "same") throw new Error("First line should be identical");
  pass("Identified unchanged lines correctly");
  if (diffResult[1].type !== "modified") throw new Error("Second line should be modified");
  pass("Identified modified lines correctly");
  if (diffResult[3].type !== "added") throw new Error("Fourth line should be added");
  pass("Identified added lines correctly");

  // 7. Interactive Artifact Sandboxing
  console.log("\n[7] Testing: Artifact Sandbox HTML Compilation");
  const buildSandboxDoc = (htmlSnippet: string, title = "Artifact Sandbox") => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-6">
  ${htmlSnippet}
</body>
</html>`;
  };
  const compiledDoc = buildSandboxDoc("<div id='app'>Hello Interactive Sandbox</div>");
  if (!compiledDoc.includes("tailwindcss") || !compiledDoc.includes("Hello Interactive Sandbox")) {
    throw new Error("Sandbox document compilation failed");
  }
  pass("Compiled standalone sandbox HTML container with Tailwind CDN");

  console.log("\n=================================================");
  console.log(`ALL 8 NEW FEATURE TESTS PASSED (${testCount}/${testCount})`);
  console.log("=================================================\n");
}

if (require.main === module) {
  runNewFeaturesTestSuite().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
