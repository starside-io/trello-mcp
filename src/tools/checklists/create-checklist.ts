import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";

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
        // Handle different types of API errors
        let errorResponse: any;

        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();

          if (
            errorMessage.includes("not found") ||
            errorMessage.includes("404")
          ) {
            errorResponse = {
              success: false,
              error: "Card not found",
              message:
                "The specified card ID does not exist or you don't have access to it.",
              suggestion:
                "Use get-all-cards-for-each-list or get-cards-for-list tools to find valid card IDs.",
            };
          } else if (
            errorMessage.includes("unauthorized") ||
            errorMessage.includes("401")
          ) {
            errorResponse = {
              success: false,
              error: "Permission denied",
              message: "You don't have permission to create checklists on this card.",
              suggestion: "Ensure you have write access to the board and card.",
            };
          } else if (
            errorMessage.includes("invalid") &&
            errorMessage.includes("card")
          ) {
            errorResponse = {
              success: false,
              error: "Invalid card ID",
              message: "The specified card ID is invalid or doesn't exist.",
              suggestion: "Use get-cards-for-list tool to find valid card IDs.",
            };
          } else if (
            errorMessage.includes("rate limit") ||
            errorMessage.includes("429")
          ) {
            errorResponse = {
              success: false,
              error: "Rate limit exceeded",
              message: "Too many API requests. Please wait before trying again.",
              suggestion: "Wait a few moments and retry your request.",
            };
          } else {
            errorResponse = {
              success: false,
              error: "Checklist creation failed",
              message: error.message,
              suggestion:
                "Please check the card ID and parameters, then try again.",
            };
          }
        } else {
          errorResponse = {
            success: false,
            error: "Unknown error",
            message: "An unexpected error occurred while creating the checklist.",
            suggestion: "Please check your API credentials and try again.",
          };
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(errorResponse, null, 2) },
          ],
        };
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
      return {
        content: [
          {
            type: "text",
            text:
              `# Error Creating Checklist\n\n` +
              `❌ **An unexpected error occurred while creating the checklist**\n\n` +
              `Please check your API credentials and try again.\n\n` +
              `**Error details:** ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
          },
        ],
      };
    }
  },
};

// Register the tool
tools.push(createChecklistTool);

export default createChecklistTool;