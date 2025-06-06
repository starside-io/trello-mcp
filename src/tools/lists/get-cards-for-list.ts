import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const getCardsForListTool: ToolDefinition = {
  name: "get-cards-for-list",
  description: "Get all cards for a specific list by providing the list ID",
  params: {
    listId: z.string().min(1, "List ID is required"),
  },
  handler: async (args: any): Promise<any> => {
    try {
      const { listId } = args;

      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // First, get the list information to validate it exists and get its name
      let listInfo: any;
      try {
        listInfo = await trelloService.get(`/lists/${listId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text", 
              text:
                `# List Not Found\n\n` +
                `❌ **Could not find list with ID: ${listId}**\n\n` +
                `This list may not exist or you may not have access to it.\n\n` +
                `## Troubleshooting:\n` +
                `1. Verify the list ID is correct\n` +
                `2. Use the get-board-lists tool to find valid list IDs\n` +
                `3. Check that you have access to the board containing this list\n\n` +
                `**Error details:** ${errorMessage}`,
            },
          ],
        };
      }

      // Get all cards for the list
      let cards: any[];
      try {
        cards = await trelloService.get(`/lists/${listId}/cards`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text:
                `# Error Fetching Cards\n\n` +
                `❌ **Could not fetch cards for list: ${listInfo.name}**\n\n` +
                `**List ID:** ${listId}\n\n` +
                `You may not have access to the cards in this list.\n\n` +
                `**Error details:** ${errorMessage}`,
            },
          ],
        };
      }

      // Format the response
      const listStatus = listInfo.closed ? "Closed" : "Open";
      const cardCount = cards.length;

      let cardsSection = "";
      if (cardCount === 0) {
        cardsSection = `*This list contains no cards.*\n`;
      } else {
        const cardsList = cards
          .map((card: any, index: number) => {
            const cardStatus = card.closed ? "Closed" : "Open";
            const hasDescription = card.desc && card.desc.trim() !== "";
            const hasDueDate = card.due;
            const labelCount = card.labels ? card.labels.length : 0;
            const memberCount = card.idMembers ? card.idMembers.length : 0;

            let cardSection = `### ${index + 1}. ${
              card.name
            } (${cardStatus})\n`;
            cardSection += `**Card ID:** ${card.id}\n`;
            cardSection += `**URL:** [Open Card](${card.shortUrl})\n`;

            if (hasDescription) {
              const truncatedDesc =
                card.desc.length > 100
                  ? card.desc.substring(0, 100) + "..."
                  : card.desc;
              cardSection += `**Description:** ${truncatedDesc}\n`;
            }

            if (hasDueDate) {
              const dueDate = new Date(card.due).toLocaleDateString();
              const dueStatus = card.dueComplete ? "Complete" : "Pending";
              cardSection += `**Due Date:** ${dueDate} (${dueStatus})\n`;
            }

            if (labelCount > 0) {
              const labelNames = card.labels
                .map((label: any) => label.name || `${label.color} label`)
                .join(", ");
              cardSection += `**Labels:** ${labelNames}\n`;
            }

            if (memberCount > 0) {
              cardSection += `**Members:** ${memberCount} assigned\n`;
            }

            cardSection += `**Last Activity:** ${new Date(
              card.dateLastActivity
            ).toLocaleDateString()}\n`;

            return cardSection;
          })
          .join("\n");

        cardsSection = `## Cards\n\n${cardsList}\n`;
      }

      const response =
        `# Cards in List: ${listInfo.name}\n\n` +
        `**List ID:** ${listId}\n` +
        `**List Status:** ${listStatus}\n` +
        `**Board ID:** ${listInfo.idBoard}\n` +
        `**Total Cards:** ${cardCount}\n\n` +
        `${cardsSection}\n` +
        `---\n` +
        `*Use card IDs for specific card operations. Use get-board-lists to find other list IDs.*`;

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
        toolName: "get-cards-for-list"
      });
    }
  },
};

// Register the tool
tools.push(getCardsForListTool);

export default getCardsForListTool;
