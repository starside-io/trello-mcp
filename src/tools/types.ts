import { z, ZodSchema } from "zod";

// Type for the content returned by tools
export type ToolContent = {
  content: Array<{ type: "text"; text: string }>;
};

// Interface for the tool definition
export interface ToolDefinition {
  name: string;
  description: string;
  params: Record<string, ZodSchema> | Record<string, never>;
  handler: (args: Record<string, any>) => Promise<ToolContent>;
}

// Array to store all registered tools
export const tools: ToolDefinition[] = [];
