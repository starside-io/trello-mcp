import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { ConfigManager } from "../../utils/config.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

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
      return generateToolErrorResponse(error, "markdown", {
        resourceType: "board",
        toolName: "get-board-lists",
        troubleshootingSteps: [
          "Verify your board ID with the list-my-boards tool",
          "Check that TRELLO_WORKING_BOARD_ID is correctly set",
          "Ensure you have access to the specified board",
          "Verify your API credentials are valid"
        ],
        additionalInfo: "*This tool retrieves lists from your designated working board*"
      });
    }
  },
};

// Register the tool
tools.push(getBoardListsTool);

export default getBoardListsTool;
