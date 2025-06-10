import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const updateCheckitemTool: ToolDefinition = {
  name: "update-checkitem",
  description:
    "Update a checkitem on a Trello card by providing the card ID, checkitem ID, and update details",
  params: {
    cardId: z.string().min(1, "Card ID is required").describe("The ID of the Trello card containing the checkitem (24-character hexadecimal string)"),
    checkitemId: z.string().min(1, "Checkitem ID is required").describe("The ID of the checkitem to update (24-character hexadecimal string)"),
    name: z.string().optional().describe("New name for the checkitem"),
    state: z.enum(["complete", "incomplete"]).optional().describe("State of the checkitem (complete or incomplete)"),
    idChecklist: z.string().optional().describe("ID of the checklist to move the checkitem to (24-character hexadecimal string)"),
    pos: z.union([z.string(), z.number()]).optional().describe("Position of the checkitem. Use 'top', 'bottom', or a positive number"),
  },
  handler: async (args: any): Promise<any> => {
    try {
      const { cardId, checkitemId, name, state, idChecklist, pos } = args;

      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Validate required parameters
      const validationErrors: string[] = [];

      // Validate cardId format (24-character hexadecimal)
      if (!HEX_24_REGEX.test(cardId)) {
        validationErrors.push("❌ **cardId**: Invalid card ID format (Expected: 24-character hexadecimal string)");
      }

      if (!HEX_24_REGEX.test(checkitemId)) {
        validationErrors.push("❌ **checkitemId**: Invalid checkitem ID format (Expected: 24-character hexadecimal string)");
      }

      if (idChecklist !== undefined && !HEX_24_REGEX.test(idChecklist)) {
        validationErrors.push("❌ **idChecklist**: Invalid checklist ID format (Expected: 24-character hexadecimal string)");
      }

      // Validate name length if provided
      if (name !== undefined && (name.length === 0 || name.length > 16384)) {
        validationErrors.push("❌ **name**: Checkitem name must be between 1 and 16384 characters");
      }

      // Validate position if provided
      if (pos !== undefined) {
        if (typeof pos === "string") {
          if (!["top", "bottom"].includes(pos)) {
            const parsedPos = Number(pos);
            if (isNaN(parsedPos) || parsedPos < 0 || !Number.isInteger(parsedPos)) {
              validationErrors.push("❌ **pos**: Position must be 'top', 'bottom', or a positive number");
            }
          }
        } else if (typeof pos === "number" && (pos < 0 || !Number.isInteger(pos))) {
          validationErrors.push("❌ **pos**: Position number must be a non-negative integer");
        }
      }

      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.join("\n");

        return {
          content: [
            {
              type: "text",
              text:
                `# Invalid Parameters\n\n` +
                `The following validation errors were found:\n\n` +
                `${errorMessage}\n\n` +
                `## Examples:\n` +
                `✅ Valid card ID: \`6836b64d461ba344f5a564a2\`\n` +
                `✅ Valid checkitem ID: \`7a8b9c1d2e3f4a5b6c7d8e9f\`\n` +
                `✅ Valid name: \`"Review code changes"\`\n` +
                `✅ Valid state: \`"complete"\` or \`"incomplete"\`\n` +
                `✅ Valid position: \`"top"\`, \`"bottom"\`, or \`1\`\n\n` +
                `Use the get-checklists-for-card tool to find valid checkitem IDs.`,
            },
          ],
        };
      }

      // Check if at least one update parameter is provided
      const hasUpdateParams = name !== undefined || state !== undefined || idChecklist !== undefined || pos !== undefined;
      if (!hasUpdateParams) {
        return {
          content: [
            {
              type: "text",
              text:
                `# No Update Parameters Provided\n\n` +
                `Please provide at least one parameter to update:\n\n` +
                `- **name**: New name for the checkitem\n` +
                `- **state**: Set to "complete" or "incomplete"\n` +
                `- **idChecklist**: Move to a different checklist\n` +
                `- **pos**: Change position ("top", "bottom", or number)\n\n` +
                `## Example Usage:\n` +
                `\`\`\`\n` +
                `{\n` +
                `  "cardId": "6836b64d461ba344f5a564a2",\n` +
                `  "checkitemId": "7a8b9c1d2e3f4a5b6c7d8e9f",\n` +
                `  "state": "complete"\n` +
                `}\n` +
                `\`\`\``,
            },
          ],
        };
      }

      // Prepare the request body
      const requestBody: any = {};

      // Add parameters if provided
      if (name !== undefined) {
        requestBody.name = name.trim();
      }
      if (state !== undefined) {
        requestBody.state = state;
      }
      if (idChecklist !== undefined) {
        requestBody.idChecklist = idChecklist;
      }
      if (pos !== undefined) {
        requestBody.pos = pos;
      }

      // Update the checkitem
      let updatedCheckitem: any;
      try {
        updatedCheckitem = await trelloService.put(
          `/cards/${cardId}/checkItem/${checkitemId}`,
          requestBody
        );
      } catch (error) {
        return generateToolErrorResponse(error, "json", {
          toolName: "update-checkitem",
          resourceType: "checkitem",
          resourceId: checkitemId,
          troubleshootingSteps: [
            "Verify the card ID exists and you have access to it",
            "Verify the checkitem ID exists on the specified card",
            "Check that your API credentials are valid",
            "Use get-checklists-for-card tool to find valid checkitem IDs"
          ]
        });
      }

      // Generate changes summary
      const changes: string[] = [];
      if (name !== undefined) {
        changes.push(`name updated to "${updatedCheckitem.name}"`);
      }
      if (state !== undefined) {
        changes.push(`state changed to "${updatedCheckitem.state}"`);
      }
      if (idChecklist !== undefined) {
        changes.push(`moved to checklist ${updatedCheckitem.idChecklist}`);
      }
      if (pos !== undefined) {
        changes.push(`position changed to ${updatedCheckitem.pos}`);
      }

      // Format successful response
      const responseText = JSON.stringify(
        {
          success: true,
          message: `Checkitem "${updatedCheckitem.name}" updated successfully`,
          checkitemId: updatedCheckitem.id,
          checkitemName: updatedCheckitem.name,
          cardId: cardId,
          state: updatedCheckitem.state,
          position: updatedCheckitem.pos,
          checklistId: updatedCheckitem.idChecklist,
          changes: changes,
          updatedCheckitem: {
            id: updatedCheckitem.id,
            name: updatedCheckitem.name,
            state: updatedCheckitem.state,
            pos: updatedCheckitem.pos,
            due: updatedCheckitem.due || null,
            dueReminder: updatedCheckitem.dueReminder || null,
            idMember: updatedCheckitem.idMember || null,
            idChecklist: updatedCheckitem.idChecklist,
            idCard: cardId,
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
        toolName: "update-checkitem",
        additionalInfo: "This tool allows you to update checkitems on Trello cards."
      });
    }
  },
};

// Register the tool
tools.push(updateCheckitemTool);

export default updateCheckitemTool;