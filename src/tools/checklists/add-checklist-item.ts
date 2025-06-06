import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { ChecklistValidation } from "../../utils/checklist-validation.js";

const addChecklistItemTool: ToolDefinition = {
  name: "add-checklist-item",
  description:
    "Add a new item to an existing Trello checklist by providing the checklist ID and item details",
  params: {
    checklistId: z.string().min(1, "Checklist ID is required"),
    name: z.string().min(1, "Item name is required"),
    pos: z.union([z.string(), z.number()]).optional(),
    checked: z.boolean().optional(),
    due: z.string().optional(),
    dueReminder: z.number().optional(),
    idMember: z.string().optional(),
  },
  handler: async (args: any): Promise<any> => {
    try {
      const { checklistId, name, pos, checked, due, dueReminder, idMember } = args;

      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Validate all parameters using our validation utility
      const validationErrors = ChecklistValidation.validateChecklistItemParameters({
        checklistId,
        name,
        pos,
        checked,
        due,
        dueReminder,
        idMember,
      });

      if (validationErrors.length > 0) {
        const errorMessage = validationErrors
          .map(error => `❌ **${error.field}**: ${error.message}` + 
            (error.expectedFormat ? ` (Expected: ${error.expectedFormat})` : ""))
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text:
                `# Invalid Parameters\n\n` +
                `The following validation errors were found:\n\n` +
                `${errorMessage}\n\n` +
                `## Examples:\n` +
                `✅ Valid checklist ID: \`6836b64d461ba344f5a564a2\`\n` +
                `✅ Valid item name: \`"Review code changes"\`\n` +
                `✅ Valid position: \`"top"\`, \`"bottom"\`, or \`1\`\n` +
                `✅ Valid due date: \`"2023-12-31T23:59:59.000Z"\`\n\n` +
                `Use the get-board-lists and get-cards-for-list tools to find valid checklist IDs.`,
            },
          ],
        };
      }

      // Prepare the request body
      const requestBody: any = {
        name: name.trim(),
      };

      // Add optional parameters if provided
      if (pos !== undefined) {
        requestBody.pos = pos;
      }
      if (checked !== undefined) {
        requestBody.checked = checked;
      }
      if (due !== undefined) {
        requestBody.due = due;
      }
      if (dueReminder !== undefined) {
        requestBody.dueReminder = dueReminder;
      }
      if (idMember !== undefined) {
        requestBody.idMember = idMember;
      }

      // Create the checklist item
      let checklistItem: any;
      try {
        checklistItem = await trelloService.post(
          `/checklists/${checklistId}/checkItems`,
          requestBody
        );
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
              error: "Checklist not found",
              message:
                "The specified checklist ID does not exist or you don't have access to it.",
              suggestion:
                "Use create-checklist tool first to create a checklist, or verify the checklist ID.",
            };
          } else if (
            errorMessage.includes("unauthorized") ||
            errorMessage.includes("401")
          ) {
            errorResponse = {
              success: false,
              error: "Permission denied",
              message: "You don't have permission to add items to this checklist.",
              suggestion: "Ensure you have write access to the board and card.",
            };
          } else if (
            errorMessage.includes("invalid") &&
            (errorMessage.includes("checklist") || errorMessage.includes("id"))
          ) {
            errorResponse = {
              success: false,
              error: "Invalid checklist ID",
              message: "The specified checklist ID is invalid or doesn't exist.",
              suggestion: "Use create-checklist tool or get checklist IDs from cards.",
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
          } else if (
            errorMessage.includes("bad request") ||
            errorMessage.includes("400")
          ) {
            errorResponse = {
              success: false,
              error: "Bad request",
              message: "The request parameters are invalid or malformed.",
              suggestion: "Check your parameters and ensure they meet the API requirements.",
            };
          } else {
            errorResponse = {
              success: false,
              error: "Checklist item creation failed",
              message: error.message,
              suggestion:
                "Please check the checklist ID and parameters, then try again.",
            };
          }
        } else {
          errorResponse = {
            success: false,
            error: "Unknown error",
            message: "An unexpected error occurred while creating the checklist item.",
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
          message: `Checklist item "${checklistItem.name}" created successfully`,
          checklistItemId: checklistItem.id,
          checklistItemName: checklistItem.name,
          checklistId: checklistId,
          cardId: checklistItem.idCard || "unknown",
          state: checklistItem.state || "incomplete",
          position: checklistItem.pos,
          checklistItem: {
            id: checklistItem.id,
            name: checklistItem.name,
            state: checklistItem.state || "incomplete",
            pos: checklistItem.pos,
            due: checklistItem.due || null,
            dueReminder: checklistItem.dueReminder || null,
            idMember: checklistItem.idMember || null,
            idChecklist: checklistId,
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
              `# Error Creating Checklist Item\n\n` +
              `❌ **An unexpected error occurred while creating the checklist item**\n\n` +
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
tools.push(addChecklistItemTool);

export default addChecklistItemTool;
