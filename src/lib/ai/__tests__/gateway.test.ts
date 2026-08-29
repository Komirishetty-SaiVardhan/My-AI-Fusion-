import { AIGateway } from "../gateway";
import { AIRouter } from "../router";
import {
  AIProviderAdapter,
  GenerateTextParams,
  AITextResponse,
  StreamTextParams,
  AIStreamChunk,
  AnalyzeImageParams,
  AnalyzeFileParams,
  AIAnalysisResponse,
  EmbedTextParams,
  AIEmbeddingResponse,
} from "../types";
import { ProviderUnavailableError, ProviderTimeoutError } from "../errors";

/**
 * Mock Provider Adapter A (e.g. Model Provider Alpha)
 */
class MockAlphaAdapter implements AIProviderAdapter {
  readonly id: string = "alpha";
  readonly name: string = "Alpha Model Provider";

  isAvailable(): boolean {
    return true;
  }

  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const prompt = typeof params.messages === "string" ? params.messages : params.messages[0]?.content;
    return {
      text: `Alpha response to: ${prompt}`,
      finishReason: "stop",
      model: params.model || "alpha-v1",
      provider: this.id,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    };
  }

  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    yield { type: "status", statusMessage: `Alpha initializing... (${params.model || "default"})` };
    yield { type: "text", content: "Alpha " };
    yield { type: "text", content: "Stream" };
    yield { type: "done", finishReason: "stop" };
  }

  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    return {
      analysis: `Alpha visual analysis for: ${params.prompt}`,
      model: params.model || "alpha-vision",
      provider: this.id,
      usage: { promptTokens: 50, completionTokens: 15, totalTokens: 65 },
    };
  }

  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    return {
      analysis: `Alpha document summary of ${params.filename}`,
      model: params.model || "alpha-doc",
      provider: this.id,
      metadata: { filename: params.filename },
    };
  }

  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const inputs = Array.isArray(params.text) ? params.text : [params.text];
    return {
      embeddings: inputs.map(() => Array(128).fill(0.42)),
      dimensions: 128,
      model: params.model || "alpha-embed",
      provider: this.id,
    };
  }
}

/**
 * Mock Provider Adapter B (e.g. Model Provider Beta - simulating different internal format)
 */
class MockBetaAdapter implements AIProviderAdapter {
  readonly id: string = "beta";
  readonly name: string = "Beta Cloud Provider";

  isAvailable(): boolean {
    return true;
  }

  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const prompt = typeof params.messages === "string" ? params.messages : params.messages[0]?.content;
    return {
      text: `Beta response to: ${prompt}`,
      finishReason: "stop",
      model: params.model || "beta-ultra",
      provider: this.id,
      usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
    };
  }

  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    yield { type: "status", statusMessage: `Beta processing... (${params.model || "default"})` };
    yield { type: "text", content: "Beta " };
    yield { type: "text", content: "Stream" };
    yield { type: "done", finishReason: "stop" };
  }

  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    return {
      analysis: `Beta visual understanding: ${params.prompt}`,
      model: params.model || "beta-vision-pro",
      provider: this.id,
    };
  }

  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    return {
      analysis: `Beta file parsing of ${params.filename}`,
      model: params.model || "beta-doc-pro",
      provider: this.id,
    };
  }

  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const inputs = Array.isArray(params.text) ? params.text : [params.text];
    return {
      embeddings: inputs.map(() => Array(256).fill(0.99)),
      dimensions: 256,
      model: params.model || "beta-embed",
      provider: this.id,
    };
  }
}

/**
 * Mock Unavailable Adapter (e.g. provider with missing credentials)
 */
class MockUnavailableAdapter implements AIProviderAdapter {
  readonly id = "unconfigured";
  readonly name = "Unconfigured Provider";

  isAvailable(): boolean {
    return false;
  }

  async generateText(): Promise<AITextResponse> {
    throw new ProviderUnavailableError(this.name);
  }
  async *streamText(): AsyncGenerator<AIStreamChunk, void, unknown> {
    throw new ProviderUnavailableError(this.name);
  }
  async analyzeImage(): Promise<AIAnalysisResponse> {
    throw new ProviderUnavailableError(this.name);
  }
  async analyzeFile(): Promise<AIAnalysisResponse> {
    throw new ProviderUnavailableError(this.name);
  }
  async embedText(): Promise<AIEmbeddingResponse> {
    throw new ProviderUnavailableError(this.name);
  }
}

export async function runGatewayTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING AI GATEWAY PROVIDER INDEPENDENCE TESTS");
  console.log("=================================================");

  const router = new AIRouter();
  const alpha = new MockAlphaAdapter();
  const beta = new MockBetaAdapter();
  const unavailable = new MockUnavailableAdapter();

  router.register(alpha);
  router.register(beta);
  router.register(unavailable);

  const gateway = new AIGateway(router);
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. Test generateText() with provider independence
  console.log("\n[1] Testing generateText() with multiple providers:");
  const resAlpha = await gateway.generateText({
    provider: "alpha",
    messages: "Hello AI",
  });
  assert(resAlpha.provider === "alpha", "Normalized provider name is 'alpha'");
  assert(resAlpha.text.includes("Alpha response to: Hello AI"), "Alpha text generated");
  assert(resAlpha.finishReason === "stop", "Normalized finishReason is 'stop'");
  assert(typeof resAlpha.usage?.totalTokens === "number", "Normalized usage object returned");

  const resBeta = await gateway.generateText({
    provider: "beta",
    messages: "Hello AI",
  });
  assert(resBeta.provider === "beta", "Normalized provider name is 'beta'");
  assert(resBeta.text.includes("Beta response to: Hello AI"), "Beta text generated");
  assert(resBeta.finishReason === "stop", "Normalized finishReason is 'stop'");

  // 2. Test streamText() with provider independence
  console.log("\n[2] Testing streamText() streaming generator:");
  const alphaStream = gateway.streamText({ provider: "alpha", messages: "Stream prompt" });
  const alphaChunks: AIStreamChunk[] = [];
  for await (const chunk of alphaStream) {
    alphaChunks.push(chunk);
  }
  assert(alphaChunks.some((c) => c.type === "text" && c.content === "Alpha "), "Stream chunk 1 received");
  assert(alphaChunks.some((c) => c.type === "done"), "Done chunk received");

  // 3. Test analyzeImage() multimodal visual understanding
  console.log("\n[3] Testing analyzeImage() multimodal operation:");
  const imgRes = await gateway.analyzeImage({
    provider: "alpha",
    image: "https://example.com/chart.png",
    prompt: "Describe this chart",
  });
  assert(imgRes.provider === "alpha", "Normalized image response provider");
  assert(imgRes.analysis.includes("Alpha visual analysis"), "Analysis text populated");

  // 4. Test analyzeFile() document understanding
  console.log("\n[4] Testing analyzeFile() document operation:");
  const fileRes = await gateway.analyzeFile({
    provider: "beta",
    file: "ColumnA,ColumnB\n1,2\n3,4",
    filename: "data.csv",
    mimeType: "text/csv",
    prompt: "Summarize this CSV",
  });
  assert(fileRes.provider === "beta", "File analysis routed to beta");
  assert(fileRes.analysis.includes("Beta file parsing"), "File analysis parsed");

  // 5. Test embedText() text embeddings
  console.log("\n[5] Testing embedText() vector operation:");
  const embedRes = await gateway.embedText({
    provider: "alpha",
    text: ["Test vector 1", "Test vector 2"],
  });
  assert(embedRes.provider === "alpha", "Embedding routed to alpha");
  assert(embedRes.embeddings.length === 2, "2 embedding vectors returned");
  assert(embedRes.dimensions === 128, "Embedding dimensions normalized to 128");

  // 6. Test unconfigured provider throws ProviderUnavailableError cleanly
  console.log("\n[6] Testing missing credentials error handling:");
  let caughtUnavailable = false;
  try {
    await gateway.generateText({ provider: "unconfigured", messages: "Hi" });
  } catch (err) {
    if (err instanceof ProviderUnavailableError) {
      caughtUnavailable = true;
    }
  }
  assert(caughtUnavailable, "Unconfigured provider throws ProviderUnavailableError");

  // 7. Test request timeout handling
  console.log("\n[7] Testing request timeout handling:");
  class SlowAdapter extends MockAlphaAdapter {
    override readonly id: string = "slow";
    override async generateText(): Promise<AITextResponse> {
      await new Promise((r) => setTimeout(r, 500));
      return super.generateText({ messages: "Done" });
    }
  }
  router.register(new SlowAdapter());
  let caughtTimeout = false;
  try {
    await gateway.generateText({ provider: "slow", messages: "Slow call", timeoutMs: 100 });
  } catch (err) {
    if (err instanceof ProviderTimeoutError) {
      caughtTimeout = true;
    }
  }
  assert(caughtTimeout, "Timeout properly aborted and threw ProviderTimeoutError");

  console.log("\n=================================================");
  console.log(`ALL TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

// Allow running directly via node/ts-node
if (typeof require !== "undefined" && require.main === module) {
  runGatewayTestSuite().catch((err) => {
    console.error("Test suite failed:", err);
    process.exit(1);
  });
}
