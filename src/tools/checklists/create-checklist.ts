import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const createChecklistTool: ToolDefinition = {
  name: "create-checklist",
  description:
    "Create a new checklist for a Trello card by providing the card ID and optional checklist name",
  params: {
    cardId: z.string().min(1, "Card ID is required"),
    name: z.string().optional(),
    pos: z.union([z.string(), z.number()]).optional(),
  },
  handler: async (args: any): Promise<any> => {
    try {
      const { cardId, name, pos } = args;

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

      // Prepare the request body
      const requestBody: any = {
        idCard: cardId,
      };

      // Add optional parameters if provided
      if (name) {
        requestBody.name = name.trim();
      }
      if (pos !== undefined) {
        requestBody.pos = pos;
      }

      // Create the checklist
      let checklist: any;
      try {
        checklist = await trelloService.post("/checklists", requestBody);
      } catch (error) {
        return generateToolErrorResponse(error, "json", {
          toolName: "create-checklist",
          resourceType: "card",
          resourceId: cardId,
          troubleshootingSteps: [
            "Verify the card ID exists and you have access to it",
            "Check that your API credentials are valid",
            "Use get-cards-for-list tool to find valid card IDs"
          ]
        });
      }

      // Format successful response
      const responseText = JSON.stringify(
        {
          success: true,
          message: `Checklist "${checklist.name}" created successfully`,
          checklistId: checklist.id,
          checklistName: checklist.name,
          cardId: checklist.idCard,
          position: checklist.pos,
          checklist: {
            id: checklist.id,
            name: checklist.name,
            idCard: checklist.idCard,
            idBoard: checklist.idBoard,
            pos: checklist.pos,
            checkItems: checklist.checkItems || [],
          },
        },
        null,
        2
      );

      return {
        content: [{ type: "text", text: responseText }],
      };
    } catch (error) {
      return generateToolErrorResponse(error, "markdown", {
        toolName: "create-checklist",
        additionalInfo: "This tool allows you to create new checklists for Trello cards."
      });
    }
  },
};

// Register the tool
tools.push(createChecklistTool);

export default createChecklistTool;