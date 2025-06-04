import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const listMyBoardsTool: ToolDefinition = {
  name: "list-my-boards",
  description:
    "List all Trello boards that the authenticated user has access to, including their names and IDs",
  params: {}, // No parameters needed
  handler: async (): Promise<any> => {
    try {
      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Get user's boards
      const boards = await trelloService.getUserBoards();

      // Format the response with simple board list
      const boardList = boards
        .map((board, index) => {
          const status = board.closed ? "Closed" : "Open";
          return `${index + 1}. **${board.name}** (${status})\n   - ID: ${
            board.id
          }\n   - URL: ${board.shortUrl}`;
        })
        .join("\n\n");

      const response =
        `# My Trello Boards\n\n` +
        `**Total Boards:** ${boards.length}\n\n` +
        `${boardList}\n\n` +
        `---\n` +
        `*Use these board IDs for other Trello operations*`;

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      return generateToolErrorResponse(error, "markdown", {
        toolName: "list-my-boards", 
        troubleshootingTitle: "Setup Instructions",
        troubleshootingSteps: [
          "Get your API key from: https://trello.com/app-key",
          "Generate a token by visiting the token URL shown on the API key page",
          "Set environment variables:\n   - TRELLO_API_KEY=your_api_key_here\n   - TRELLO_TOKEN=your_token_here",
          "Restart the MCP server"
        ],
        additionalInfo: "*This tool lists your accessible Trello boards with their IDs*"
      });
    }
  },
};

// Register the tool
tools.push(listMyBoardsTool);

// Export the tool for direct access if needed
export default listMyBoardsTool;
