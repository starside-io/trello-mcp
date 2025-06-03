#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

// Import all tools (this will register them in the tools array)
import { tools } from "./tools/index.js";
import { TrelloApiService } from "./services/trello-api.js";

// Load environment variables
dotenv.config();

// Create server instance
const server = new McpServer({
  name: "trello-mcp",
  version: "0.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Initialize Trello API service
const trelloApi = TrelloApiService.getInstance();

// Register all tools dynamically
tools.forEach((tool) => {
  server.tool(
    tool.name,
    tool.description,
    tool.params,
    async (args: Record<string, any>) => {
      try {
        // Ensure Trello API is initialized before any tool execution
        if (!trelloApi.isServiceInitialized()) {
          await trelloApi.initialize();
        }

        const result = await tool.handler(args);
        return {
          content: result.content.map((item) => ({
            type: item.type as "text",
            text: item.text,
          })),
        };
      } catch (error) {
        console.error(`Error in tool ${tool.name}:`, error);
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${message}`,
            },
          ],
        };
      }
    }
  );
});

async function main() {
  try {
    // Initialize the Trello API service
    console.error("Initializing Trello API service...");
    await trelloApi.initialize();
    console.error("Trello API service initialized successfully");

    // Start the MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Trello MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to initialize Trello MCP Server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
