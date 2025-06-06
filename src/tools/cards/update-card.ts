import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { CardValidation } from "../../utils/card-validation.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

const updateCardTool: ToolDefinition = {
  name: "update-card",
  description:
    "Update Trello card details such as name, description, due dates, position, list assignment, and member/label assignments. Supports partial updates - only provided parameters will be modified.",
  params: {
    cardId: z
      .string()
      .describe(
        "The ID of the Trello card to update (required, 24-character hexadecimal string)"
      ),
    name: z.string().optional().describe("New name for the card"),
    desc: z.string().optional().describe("New description for the card"),
    closed: z
      .boolean()
      .optional()
      .describe("Whether to archive (true) or unarchive (false) the card"),
    idList: z
      .string()
      .optional()
      .describe(
        "ID of the list to move the card to (24-character hexadecimal string)"
      ),
    idBoard: z
      .string()
      .optional()
      .describe(
        "ID of the board to move the card to (24-character hexadecimal string)"
      ),
    pos: z
      .union([z.string(), z.number()])
      .optional()
      .describe(
        "Position of the card in the list. Use 'top', 'bottom', or a positive number"
      ),
    due: z
      .string()
      .optional()
      .describe(
        "Due date for the card in ISO 8601 format (e.g., '2023-12-31T23:59:59.000Z')"
      ),
    start: z
      .string()
      .optional()
      .describe(
        "Start date for the card in ISO 8601 format (e.g., '2023-12-31T00:00:00.000Z')"
      ),
    dueComplete: z
      .boolean()
      .optional()
      .describe("Whether the due date has been completed"),
    idMembers: z
      .array(z.string())
      .optional()
      .describe(
        "Array of member IDs to assign to the card (24-character hexadecimal strings)"
      ),
    idLabels: z
      .array(z.string())
      .optional()
      .describe(
        "Array of label IDs to assign to the card (24-character hexadecimal strings)"
      ),
  },
  handler: async (args: any): Promise<any> => {
    try {
      // Validate input parameters
      const params = args;
      const validationErrors = CardValidation.validateUpdateParameters(params);

      if (validationErrors.length > 0) {
        const errorText = JSON.stringify(
          {
            success: false,
            message: "Validation failed",
            errors: validationErrors.map(
              (err) =>
                `${err.field}: ${err.message}${
                  err.expectedFormat ? ` (Expected: ${err.expectedFormat})` : ""
                }`
            ),
          },
          null,
          2
        );

        return {
          content: [{ type: "text", text: errorText }],
        };
      }

      // Sanitize input parameters
      const sanitizedParams = CardValidation.sanitizeParameters(params);

      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Prepare the update payload (exclude cardId from the payload)
      const updatePayload: any = {};
      if (sanitizedParams.name !== undefined)
        updatePayload.name = sanitizedParams.name;
      if (sanitizedParams.desc !== undefined)
        updatePayload.desc = sanitizedParams.desc;
      if (sanitizedParams.closed !== undefined)
        updatePayload.closed = sanitizedParams.closed;
      if (sanitizedParams.idList !== undefined)
        updatePayload.idList = sanitizedParams.idList;
      if (sanitizedParams.idBoard !== undefined)
        updatePayload.idBoard = sanitizedParams.idBoard;
      if (sanitizedParams.pos !== undefined)
        updatePayload.pos = sanitizedParams.pos;
      if (sanitizedParams.due !== undefined)
        updatePayload.due = sanitizedParams.due;
      if (sanitizedParams.start !== undefined)
        updatePayload.start = sanitizedParams.start;
      if (sanitizedParams.dueComplete !== undefined)
        updatePayload.dueComplete = sanitizedParams.dueComplete;
      if (sanitizedParams.idMembers !== undefined)
        updatePayload.idMembers = sanitizedParams.idMembers;
      if (sanitizedParams.idLabels !== undefined)
        updatePayload.idLabels = sanitizedParams.idLabels;

      // Check if there are any changes to make
      if (Object.keys(updatePayload).length === 0) {
        const errorText = JSON.stringify(
          {
            success: false,
            message:
              "No update parameters provided. Please provide at least one field to update.",
            availableFields: [
              "name",
              "desc",
              "closed",
              "idList",
              "idBoard",
              "pos",
              "due",
              "start",
              "dueComplete",
              "idMembers",
              "idLabels",
            ],
          },
          null,
          2
        );

        return {
          content: [{ type: "text", text: errorText }],
        };
      }

      // Make the API call to update the card
      const updatedCard = await trelloService.put(
        `/cards/${sanitizedParams.cardId}`,
        updatePayload
      );

      // Generate changes summary
      const changes = CardValidation.generateChangesSummary(sanitizedParams);

      // Format successful response
      const responseText = JSON.stringify(
        {
          success: true,
          message: `Card "${updatedCard.name}" updated successfully`,
          cardId: updatedCard.id,
          cardName: updatedCard.name,
          cardUrl: updatedCard.url,
          changes: changes,
          updatedCard: {
            id: updatedCard.id,
            name: updatedCard.name,
            desc: updatedCard.desc,
            closed: updatedCard.closed,
            pos: updatedCard.pos,
            idList: updatedCard.idList,
            idBoard: updatedCard.idBoard,
            due: updatedCard.due,
            dueComplete: updatedCard.dueComplete,
            idMembers: updatedCard.idMembers,
            labels: updatedCard.labels,
            url: updatedCard.url,
            dateLastActivity: updatedCard.dateLastActivity,
          },
        },
        null,
        2
      );

      return {
        content: [{ type: "text", text: responseText }],
      };
    } catch (error) {
      return generateToolErrorResponse(error, "json", {
        resourceType: "card",
        toolName: "update-card"
      });
    }
  },
};

// Register the tool
tools.push(updateCardTool);

// Export the tool for direct access if needed
export default updateCardTool;
