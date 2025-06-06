import { ToolDefinition, tools } from "./types.js";
import { TrelloApiService } from "../services/trello-api.js";
import { generateToolErrorResponse } from "../utils/trello-error-handler.js";

const aboutMeTool: ToolDefinition = {
  name: "about-me",
  description:
    "Get information about the authenticated Trello user and their boards",
  params: {}, // No parameters needed
  handler: async (): Promise<any> => {
    try {
      // Get Trello API service instance
      const trelloService = TrelloApiService.getInstance();

      // Initialize service if not already done
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Get user's boards
      const boards = await trelloService.getUserBoards();

      // Format the response
      const boardList = boards
        .map((board, index) => {
          const status = board.closed ? "(Closed)" : "(Open)";
          const orgInfo = board.organization
            ? ` - Org: ${board.organization.displayName}`
            : "";
          return `${index + 1}. **${
            board.name
          }** ${status}${orgInfo}\n   - URL: ${
            board.shortUrl
          }\n   - Description: ${board.desc || "No description"}`;
        })
        .join("\n\n");

      const response =
        `# Trello User Boards\n\n` +
        `Successfully connected to Trello API! Here are your boards:\n\n` +
        `**Total Boards Found:** ${boards.length}\n\n` +
        `## Your Boards:\n\n${boardList}\n\n` +
        `---\n` +
        `*This information was retrieved using the Trello API Helper Service*`;

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
        toolName: "about-me",
        resourceType: "user",
        troubleshootingSteps: [
          "Get your API key from: https://trello.com/app-key",
          "Generate a token by visiting the token URL shown on the API key page",
          "Set environment variables: TRELLO_API_KEY and TRELLO_TOKEN",
          "Restart the MCP server"
        ],
        troubleshootingTitle: "Setup Instructions",
        additionalInfo: "*This tool tests the Trello API Helper Service integration*"
      });
    }
  },
};

// Register the tool
tools.push(aboutMeTool);

// Export the tool for direct access if needed
export default aboutMeTool;
