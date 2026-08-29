import { ITool, OpenAIToolDefinition } from "./types";

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();

  /**
   * Registers a tool in the system.
   */
  registerTool(tool: ITool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregisters a tool by name.
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Retrieves a tool by name.
   */
  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Enables a tool.
   */
  enableTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;
    tool.isEnabled = true;
    return true;
  }

  /**
   * Disables a tool.
   */
  disableTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;
    tool.isEnabled = false;
    return true;
  }

  /**
   * Lists all registered tools.
   */
  listTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Lists all currently enabled tools.
   */
  listEnabledTools(): ITool[] {
    return Array.from(this.tools.values()).filter((t) => t.isEnabled);
  }

  /**
   * Exports enabled tools in standard OpenAI/Anthropic function calling schema format.
   */
  getOpenAIToolDefinitions(): OpenAIToolDefinition[] {
    return this.listEnabledTools().map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }
}

export const toolRegistry = new ToolRegistry();
