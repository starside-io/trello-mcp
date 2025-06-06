import { z } from "zod";
import { ToolDefinition, tools } from "../types.js";
import { TrelloApiService } from "../../services/trello-api.js";
import { ChecklistValidation } from "../../utils/checklist-validation.js";
import { generateToolErrorResponse } from "../../utils/trello-error-handler.js";

// Define the schema for individual checklist items in the batch
const checklistItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  pos: z.union([z.string(), z.number()]).optional(),
  checked: z.boolean().optional(),
  due: z.string().optional(),
  dueReminder: z.number().optional(),
  idMember: z.string().optional(),
});

// Define the main batch tool schema
const batchAddChecklistItemsTool: ToolDefinition = {
  name: "batch-add-checklist-items",
  description:
    "Add multiple checklist items to an existing Trello checklist in a single batch operation. Processes items sequentially with rate limiting to avoid API overwhelm.",
  params: {
    checklistId: z.string().min(1, "Checklist ID is required"),
    items: z.array(checklistItemSchema).min(1, "At least one item is required").max(50, "Maximum 50 items allowed per batch"),
  },
  handler: async (args: any): Promise<any> => {
    try {
      const { checklistId, items } = args;

      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Validate all parameters using our batch validation utility
      const validationErrors = ChecklistValidation.validateBatchChecklistItemParameters({
        checklistId,
        items,
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
                `✅ Valid batch items:\n` +
                `\`\`\`json\n` +
                `[\n` +
                `  { "name": "Review code changes" },\n` +
                `  { "name": "Update documentation", "pos": "top" },\n` +
                `  { "name": "Run tests", "checked": false, "due": "2023-12-31T23:59:59.000Z" }\n` +
                `]\n` +
                `\`\`\`\n\n` +
                `Use the get-board-lists and get-cards-for-list tools to find valid checklist IDs.`,
            },
          ],
        };
      }

      // Initialize batch processing results
      const results: Array<{
        index: number;
        success: boolean;
        item: any;
        result?: any;
        error?: string;
      }> = [];

      let successfulCount = 0;
      let failedCount = 0;

      // Process items sequentially with rate limiting
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        try {
          // Prepare the request body for this item
          const requestBody: any = {
            name: item.name.trim(),
          };

          // Add optional parameters if provided
          if (item.pos !== undefined) {
            requestBody.pos = item.pos;
          }
          if (item.checked !== undefined) {
            requestBody.checked = item.checked;
          }
          if (item.due !== undefined) {
            requestBody.due = item.due;
          }
          if (item.dueReminder !== undefined) {
            requestBody.dueReminder = item.dueReminder;
          }
          if (item.idMember !== undefined) {
            requestBody.idMember = item.idMember;
          }

          // Create the checklist item via API
          const checklistItem = await trelloService.post(
            `/checklists/${checklistId}/checkItems`,
            requestBody
          );

          // Record successful result
          results.push({
            index: i,
            success: true,
            item,
            result: {
              id: checklistItem.id,
              name: checklistItem.name,
              state: checklistItem.state,
              pos: checklistItem.pos,
              due: checklistItem.due,
              dueReminder: checklistItem.dueReminder,
              idMember: checklistItem.idMember,
            },
          });

          successfulCount++;

        } catch (error) {
          // Handle individual item failure
          let errorMessage = "Unknown error occurred";
          
          if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase();
            
            if (errorMsg.includes("not found") || errorMsg.includes("404")) {
              errorMessage = "Checklist not found. Please verify the checklist ID exists and you have access to it.";
            } else if (errorMsg.includes("unauthorized") || errorMsg.includes("401")) {
              errorMessage = "Unauthorized access. Please check your Trello API credentials and board permissions.";
            } else if (errorMsg.includes("forbidden") || errorMsg.includes("403")) {
              errorMessage = "Access forbidden. You don't have permission to modify this checklist.";
            } else if (errorMsg.includes("rate limit") || errorMsg.includes("429")) {
              errorMessage = "Rate limit exceeded. Please wait before making more requests.";
            } else {
              errorMessage = error.message;
            }
          }

          // Record failed result
          results.push({
            index: i,
            success: false,
            item,
            error: errorMessage,
          });

          failedCount++;
        }

        // Add delay between API calls to respect rate limits (except for last item)
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      // Prepare the batch response
      const batchSummary = {
        total: items.length,
        successful: successfulCount,
        failed: failedCount,
        checklistId,
      };

      // Determine overall success status
      const overallSuccess = failedCount === 0;

      return {
        content: [
          {
            type: "text",
            text:
              `# Batch Checklist Items ${overallSuccess ? "✅ Completed Successfully" : "⚠️ Completed with Errors"}\n\n` +
              `## Summary\n` +
              `- **Total Items**: ${batchSummary.total}\n` +
              `- **Successful**: ${batchSummary.successful}\n` +
              `- **Failed**: ${batchSummary.failed}\n` +
              `- **Checklist ID**: \`${batchSummary.checklistId}\`\n\n` +
              (successfulCount > 0 ? 
                `## ✅ Successfully Added Items (${successfulCount})\n` +
                results
                  .filter(r => r.success)
                  .map(r => `- **${r.result.name}** (ID: \`${r.result.id}\`)`)
                  .join("\n") + "\n\n"
                : "") +
              (failedCount > 0 ? 
                `## ❌ Failed Items (${failedCount})\n` +
                results
                  .filter(r => !r.success)
                  .map(r => `- **${r.item.name}**: ${r.error}`)
                  .join("\n") + "\n\n"
                : "") +
              `## 💡 Tips\n` +
              `- Use the \`get-cards-for-list\` tool to find checklists on cards\n` +
              `- If you encounter rate limiting, try reducing batch size or adding delays\n` +
              `- Check that you have proper permissions for the board and checklist`,
          },
        ],
        _meta: {
          batchOperation: true,
          summary: batchSummary,
          results,
        },
      };

    } catch (error) {
      return generateToolErrorResponse(error, "markdown", {
        toolName: "batch-add-checklist-items",
        resourceType: "checklist",
        troubleshootingSteps: [
          "Verify your Trello API credentials are valid",
          "Check that the checklist ID exists and you have access to it",
          "Ensure your network connection is stable",
          "Try with a smaller batch size if the error persists"
        ],
        additionalInfo: "Use the `debug-trello` tool to test your connection and credentials."
      });
    }
  },
};

// Register the tool
tools.push(batchAddChecklistItemsTool);

export { batchAddChecklistItemsTool };
