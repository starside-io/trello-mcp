import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { ConfigManager } from "../../utils/config.js";

const getBoardListsTool: ToolDefinition = {
  name: "get-board-lists",
  description:
    "Get all lists from the designated working board for focused board operations",
  params: {}, // No parameters needed - uses working board ID from config
  handler: async (): Promise<any> => {
    try {
      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Get working board ID from configuration
      const configManager = ConfigManager.getInstance();
      const config = configManager.loadTrelloConfig();

      if (!config.workingBoardId) {
        return {
          content: [
            {
              type: "text",
              text:
                `# Working Board Not Configured\n\n` +
                `❌ **No working board ID configured**\n\n` +
                `Please add TRELLO_WORKING_BOARD_ID to your environment variables.\n\n` +
                `## Setup Instructions:\n` +
                `1. Find your board ID using the list-my-boards tool\n` +
                `2. Add TRELLO_WORKING_BOARD_ID=your_board_id to your .env file\n` +
                `3. Restart the MCP server\n\n` +
                `Example: TRELLO_WORKING_BOARD_ID=6836b64d461ba344f5a564a2`,
            },
          ],
        };
      }

      // Get lists from the working board
      const lists = await trelloService.get(
        `/boards/${config.workingBoardId}/lists`
      );

      // Format the response with comprehensive list information
      const listDetails = lists
        .map((list: any, index: number) => {
          const status = list.closed ? "Closed" : "Open";
          return `${index + 1}. **${list.name}** (${status})\n   - ID: ${
            list.id
          }\n   - Position: ${list.pos}\n   - Board: ${list.idBoard}`;
        })
        .join("\n\n");

      const response =
        `# Board Lists\n\n` +
        `**Working Board ID:** ${config.workingBoardId}\n` +
        `**Total Lists:** ${lists.length}\n\n` +
        `${listDetails}\n\n` +
        `---\n` +
        `*Use these list IDs for card operations and list management*`;

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
      let userFriendlyMessage = "Failed to retrieve board lists.";

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
      } else if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found")
      ) {
        userFriendlyMessage =
          "Board not found or access denied. Please check your TRELLO_WORKING_BOARD_ID and ensure you have access to this board.";
      } else if (
        errorMessage.includes("403") ||
        errorMessage.includes("forbidden")
      ) {
        userFriendlyMessage =
          "Access forbidden. Please ensure you have permission to view this board's lists.";
      }

      return {
        content: [
          {
            type: "text",
            text:
              `# Trello API Error\n\n❌ **${userFriendlyMessage}**\n\n` +
              `**Technical Details:** ${errorMessage}\n\n` +
              `## Troubleshooting:\n` +
              `1. Verify your board ID with the list-my-boards tool\n` +
              `2. Check that TRELLO_WORKING_BOARD_ID is correctly set\n` +
              `3. Ensure you have access to the specified board\n` +
              `4. Verify your API credentials are valid\n\n` +
              `*This tool retrieves lists from your designated working board*`,
          },
        ],
      };
    }
  },
};

// Register the tool
tools.push(getBoardListsTool);

export default getBoardListsTool;
