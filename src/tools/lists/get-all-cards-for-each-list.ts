import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { ConfigManager } from "../../utils/config.js";

const getAllCardsForEachListTool: ToolDefinition = {
  name: "get-all-cards-for-each-list",
  description:
    "Get all cards for every list on the designated working board, organized by list",
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

      // Get all lists from the working board
      const lists = await trelloService.get(
        `/boards/${config.workingBoardId}/lists`
      );

      if (!lists || lists.length === 0) {
        return {
          content: [
            {
              type: "text",
              text:
                `# No Lists Found\n\n` +
                `❌ **No lists found on the working board**\n\n` +
                `**Working Board ID:** ${config.workingBoardId}\n\n` +
                `This board may be empty or you may not have access to its lists.\n\n` +
                `Use the get-board-lists tool to verify board access.`,
            },
          ],
        };
      }

      // Fetch cards for each list
      const listsWithCards: Array<{ list: any; cards: any[] }> = [];
      let totalCards = 0;

      for (const list of lists) {
        try {
          const cards = await trelloService.get(`/lists/${list.id}/cards`);
          listsWithCards.push({
            list: list,
            cards: cards,
          });
          totalCards += cards.length;
        } catch (error) {
          // If we can't fetch cards for a specific list, add it with empty cards array
          // but don't fail the entire operation
          listsWithCards.push({
            list: list,
            cards: [],
          });
        }
      }

      // Format the response
      const listDetails = listsWithCards
        .map((item, index) => {
          const { list, cards } = item;
          const listStatus = list.closed ? "Closed" : "Open";
          const cardCount = cards.length;

          let listSection = `## ${index + 1}. ${list.name} (${listStatus})\n`;
          listSection += `**List ID:** ${list.id}\n`;
          listSection += `**Cards:** ${cardCount}\n\n`;

          if (cardCount === 0) {
            listSection += `*No cards in this list*\n`;
          } else {
            const cardsList = cards
              .map((card: any, cardIndex: number) => {
                const cardStatus = card.closed ? "Closed" : "Open";
                const hasDescription = card.desc && card.desc.trim() !== "";
                const hasDueDate = card.due;
                const labelCount = card.labels ? card.labels.length : 0;

                return (
                  `   ${cardIndex + 1}. **${card.name}** (${cardStatus})\n` +
                  `      - ID: ${card.id}\n` +
                  `      - URL: ${card.shortUrl}\n` +
                  `      - Position: ${card.pos}\n` +
                  `      - Labels: ${labelCount}\n` +
                  `      - Due Date: ${hasDueDate ? card.due : "None"}\n` +
                  `      - Description: ${hasDescription ? "Yes" : "No"}`
                );
              })
              .join("\n\n");
            listSection += cardsList + "\n";
          }

          return listSection;
        })
        .join("\n");

      const response =
        `# All Cards by List\n\n` +
        `**Working Board ID:** ${config.workingBoardId}\n` +
        `**Total Lists:** ${lists.length}\n` +
        `**Total Cards:** ${totalCards}\n\n` +
        `${listDetails}\n\n` +
        `---\n` +
        `*Cards are organized by their containing lists. Use card IDs for card operations.*`;

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
      let userFriendlyMessage = "Failed to retrieve cards for board lists.";

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
          "Access forbidden. Please ensure you have permission to view this board's lists and cards.";
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
              `4. Verify your API credentials are valid\n` +
              `5. Try the get-board-lists tool first to verify board access\n\n` +
              `*This tool retrieves all cards from your designated working board*`,
          },
        ],
      };
    }
  },
};

// Register the tool
tools.push(getAllCardsForEachListTool);

export default getAllCardsForEachListTool;
