import { z } from "zod";
import { ToolDefinition, tools } from "./types.js";

const helloWorldTool: ToolDefinition = {
  name: "hello-world",
  description: "Returns a greeting message",
  params: {}, // No parameters needed
  handler: async () => {
    return {
      content: [
        {
          type: "text",
          text: "Hello, world! This is the Trello MCP server.",
        },
      ],
    };
  }
};

// Register the tool
tools.push(helloWorldTool);

// Export the tool for direct access if needed
export default helloWorldTool;
