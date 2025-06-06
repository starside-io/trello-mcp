import { ToolDefinition, tools } from "./types.js";
import { TrelloApiService } from "../services/trello-api.js";
import { generateToolErrorResponse } from "../utils/trello-error-handler.js";

const debugTrelloTool: ToolDefinition = {
  name: "debug-trello",
  description: "Debug Trello API connection and credentials",
  params: {},
  handler: async (): Promise<any> => {
    try {
      const trelloService = TrelloApiService.getInstance();

      // Get service info without initializing
      const serviceInfo = trelloService.getServiceInfo();

      let debugInfo = `# Trello API Debug Information\n\n`;
      debugInfo += `**Service Initialized:** ${serviceInfo.initialized}\n`;
      debugInfo += `**Base URL:** ${serviceInfo.baseUrl}\n\n`;

      // Try to initialize and see what happens
      debugInfo += `## Initialization Test\n\n`;

      try {
        await trelloService.initialize();
        debugInfo += `✅ **Initialization successful!**\n\n`;

        // Try to get user info
        debugInfo += `## User Info Test\n\n`;
        const user = await trelloService.getCurrentUser();
        debugInfo += `✅ **User Info Retrieved:**\n`;
        debugInfo += `- Username: ${user.username || "N/A"}\n`;
        debugInfo += `- Full Name: ${user.fullName || "N/A"}\n`;
        debugInfo += `- ID: ${user.id}\n\n`;

        // Try to get boards
        debugInfo += `## Boards Test\n\n`;
        const boards = await trelloService.getUserBoards();
        debugInfo += `✅ **Boards Retrieved:** ${boards.length} boards found\n`;
      } catch (initError) {
        const errorMsg =
          initError instanceof Error ? initError.message : "Unknown error";
        debugInfo += `❌ **Initialization failed:**\n`;
        debugInfo += `- Error: ${errorMsg}\n\n`;

        // Check environment variables
        debugInfo += `## Environment Check\n\n`;
        debugInfo += `- TRELLO_API_KEY: ${
          process.env.TRELLO_API_KEY ? "Set" : "Not set"
        }\n`;
        debugInfo += `- TRELLO_TOKEN: ${
          process.env.TRELLO_TOKEN ? "Set" : "Not set"
        }\n`;

        if (process.env.TRELLO_API_KEY) {
          debugInfo += `- API Key starts with: ${process.env.TRELLO_API_KEY.substring(
            0,
            8
          )}...\n`;
        }
        if (process.env.TRELLO_TOKEN) {
          debugInfo += `- Token starts with: ${process.env.TRELLO_TOKEN.substring(
            0,
            8
          )}...\n`;
          debugInfo += `- Token length: ${process.env.TRELLO_TOKEN.length} characters\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: debugInfo,
          },
        ],
      };
    } catch (error) {
      return generateToolErrorResponse(error, "markdown", {
        toolName: "debug-trello",
        additionalInfo: "This debug tool helps test your Trello API connection."
      });
    }
  },
};

// Register the tool
tools.push(debugTrelloTool);

export default debugTrelloTool;
