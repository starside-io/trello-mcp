import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const getCardTool: ToolDefinition = {
  name: "get-card",
  description:
    "Get detailed information about a specific Trello card by providing its card ID",
  params: {
    cardId: z.string().min(1, "Card ID is required"),
  },
  handler: async (args: any): Promise<any> => {
    try {
      const { cardId } = args;

      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Get the card information
      let card: any;
      try {
        card = await trelloService.get(`/cards/${cardId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text:
                `# Card Not Found\n\n` +
                `❌ **Could not find card with ID: ${cardId}**\n\n` +
                `This card may not exist or you may not have access to it.\n\n` +
                `## Troubleshooting:\n` +
                `1. Verify the card ID is correct\n` +
                `2. Use the get-cards-for-list or get-all-cards-for-each-list tools to find valid card IDs\n` +
                `3. Check that you have access to the board containing this card\n\n` +
                `**Error details:** ${errorMessage}`,
            },
          ],
        };
      }

      // Get additional card information (board and list names for context)
      let boardName = "Unknown Board";
      let listName = "Unknown List";

      try {
        const board = await trelloService.get(`/boards/${card.idBoard}`);
        boardName = board.name;
      } catch (error) {
        // Continue with unknown board name if we can't fetch it
      }

      try {
        const list = await trelloService.get(`/lists/${card.idList}`);
        listName = list.name;
      } catch (error) {
        // Continue with unknown list name if we can't fetch it
      }

      // Format the card details response
      const cardStatus = card.closed ? "Closed" : "Open";
      const hasDescription = card.desc && card.desc.trim() !== "";
      const hasDueDate = card.due;
      const labelCount = card.labels ? card.labels.length : 0;
      const memberCount = card.idMembers ? card.idMembers.length : 0;

      let response = `# Card Details: ${card.name}\n\n`;
      response += `**Status:** ${cardStatus}\n`;
      response += `**Card ID:** ${card.id}\n`;
      response += `**URL:** [Open Card](${card.shortUrl})\n`;
      response += `**Board:** ${boardName}\n`;
      response += `**List:** ${listName}\n`;
      response += `**Position:** ${card.pos}\n\n`;

      // Description section
      if (hasDescription) {
        response += `## Description\n`;
        response += `${card.desc}\n\n`;
      } else {
        response += `## Description\n`;
        response += `*No description provided*\n\n`;
      }

      // Due date information
      if (hasDueDate) {
        const dueDate = new Date(card.due);
        const isOverdue = dueDate < new Date() && !card.dueComplete;
        const dueStatus = card.dueComplete
          ? "✅ Complete"
          : isOverdue
          ? "⚠️ Overdue"
          : "⏰ Pending";

        response += `## Due Date\n`;
        response += `**Due:** ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}\n`;
        response += `**Status:** ${dueStatus}\n\n`;
      }

      // Labels section
      if (labelCount > 0) {
        response += `## Labels (${labelCount})\n`;
        card.labels.forEach((label: any, index: number) => {
          const labelName = label.name || "Unnamed Label";
          response += `${index + 1}. **${labelName}** (${label.color})\n`;
        });
        response += `\n`;
      }

      // Members section
      if (memberCount > 0) {
        response += `## Assigned Members (${memberCount})\n`;
        card.idMembers.forEach((memberId: string, index: number) => {
          response += `${index + 1}. Member ID: ${memberId}\n`;
        });
        response += `\n`;
      }

      // Metadata section
      response += `## Metadata\n`;
      response += `**Last Activity:** ${new Date(
        card.dateLastActivity
      ).toLocaleDateString()} at ${new Date(
        card.dateLastActivity
      ).toLocaleTimeString()}\n`;
      response += `**Board ID:** ${card.idBoard}\n`;
      response += `**List ID:** ${card.idList}\n`;

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
        toolName: "get-card"
      });
    }
  },
};

tools.push(getCardTool);

export default getCardTool;
