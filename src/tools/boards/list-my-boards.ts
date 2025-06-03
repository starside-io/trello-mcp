import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";

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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Provide helpful error messages without exposing credentials
      let userFriendlyMessage = "Failed to retrieve your Trello boards.";

      if (
        errorMessage.includes("credentials") ||
        errorMessage.includes("401")
      ) {
        userFriendlyMessage =
          "Authentication failed. Please check your TRELLO_API_KEY and TRELLO_TOKEN environment variables.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        userFriendlyMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("environment")) {
        userFriendlyMessage =
          "Missing environment variables. Please set TRELLO_API_KEY and TRELLO_TOKEN.";
      }

      return {
        content: [
          {
            type: "text",
            text:
              `# Trello API Error\n\n❌ **${userFriendlyMessage}**\n\n` +
              `**Technical Details:** ${errorMessage}\n\n` +
              `## Setup Instructions:\n` +
              `1. Get your API key from: https://trello.com/app-key\n` +
              `2. Generate a token by visiting the token URL shown on the API key page\n` +
              `3. Set environment variables:\n` +
              `   - TRELLO_API_KEY=your_api_key_here\n` +
              `   - TRELLO_TOKEN=your_token_here\n` +
              `4. Restart the MCP server\n\n` +
              `*This tool lists your accessible Trello boards with their IDs*`,
          },
        ],
      };
    }
  },
};

// Register the tool
tools.push(listMyBoardsTool);

// Export the tool for direct access if needed
export default listMyBoardsTool;
