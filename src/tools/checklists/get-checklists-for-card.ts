import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const getChecklistsForCardTool: ToolDefinition = {
  name: "get-checklists-for-card",
  description:
    "Get all checklists for a specific Trello card by providing the card ID",
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

      // Validate card ID format (24-character hexadecimal)
      const cardIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!cardIdRegex.test(cardId)) {
        return {
          content: [
            {
              type: "text",
              text:
                `# Invalid Card ID Format\n\n` +
                `❌ **Invalid card ID: ${cardId}**\n\n` +
                `Card IDs must be 24-character hexadecimal strings.\n\n` +
                `## Example:\n` +
                `✅ Valid: \`6836b64d461ba344f5a564a2\`\n` +
                `❌ Invalid: \`${cardId}\`\n\n` +
                `Use the get-cards-for-list or get-all-cards-for-each-list tools to find valid card IDs.`,
            },
          ],
        };
      }

      // Get the checklists for the card
      let checklists: any[];
      try {
        checklists = await trelloService.get(`/cards/${cardId}/checklists`);
      } catch (error) {
        return generateToolErrorResponse(error, "markdown", {
          resourceType: "card",
          toolName: "get-checklists-for-card",
          troubleshootingSteps: [
            "Verify the card ID is correct (24-character hexadecimal string)",
            "Use get-cards-for-list or get-all-cards-for-each-list tools to find valid card IDs",
            "Check that you have access to the board containing this card",
            "Ensure your API credentials are valid and properly configured"
          ]
        });
      }

      // Format the response
      let response = `# Checklists for Card\n\n`;
      response += `**Card ID:** ${cardId}\n`;
      response += `**Total Checklists:** ${checklists.length}\n\n`;

      if (checklists.length === 0) {
        response += `*No checklists found for this card.*\n\n`;
        response += `You can create a new checklist using the create-checklist tool.`;
      } else {
        response += `## Checklists\n\n`;
        
        checklists.forEach((checklist: any, index: number) => {
          const checkItems = checklist.checkItems || [];
          const completedItems = checkItems.filter((item: any) => item.state === "complete").length;
          const totalItems = checkItems.length;
          const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          
          response += `### ${index + 1}. ${checklist.name}\n\n`;
          response += `**Checklist ID:** ${checklist.id}\n`;
          response += `**Position:** ${checklist.pos}\n`;
          response += `**Progress:** ${completedItems}/${totalItems} items completed (${progressPercent}%)\n`;
          
          if (totalItems > 0) {
            response += `\n**Items:**\n`;
            checkItems.forEach((item: any, itemIndex: number) => {
              const status = item.state === "complete" ? "✅" : "⏹️";
              response += `${itemIndex + 1}. ${status} ${item.name}\n`;
            });
          } else {
            response += `\n*No items in this checklist.*\n`;
          }
          
          response += `\n`;
        });
      }

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
        toolName: "get-checklists-for-card"
      });
    }
  },
};

// Register the tool
tools.push(getChecklistsForCardTool);

export default getChecklistsForCardTool;