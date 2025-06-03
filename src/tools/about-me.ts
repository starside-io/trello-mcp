import { ToolDefinition, tools } from "./types.js";
import { TrelloApiService } from "../services/trello-api.js";

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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Provide helpful error messages without exposing credentials
      let userFriendlyMessage = "Failed to retrieve Trello information.";

      if (
        errorMessage.includes("credentials") ||
        errorMessage.includes("401")
      ) {
        userFriendlyMessage =
          "Authentication failed. Please check your TRELLO_API_KEY and TRELLO_TOKEN environment variables.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        userFriendlyMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("environment")) {
        userFriendlyMessage =
          "Missing environment variables. Please set TRELLO_API_KEY and TRELLO_TOKEN.";
      }

      return {
        content: [
          {
            type: "text",
            text:
              `# Trello API Error\n\n❌ **${userFriendlyMessage}**\n\n` +
              `**Technical Details:** ${errorMessage}\n\n` +
              `## Setup Instructions:\n` +
              `1. Get your API key from: https://trello.com/app-key\n` +
              `2. Generate a token by visiting the token URL shown on the API key page\n` +
              `3. Set environment variables:\n` +
              `   - TRELLO_API_KEY=your_api_key_here\n` +
              `   - TRELLO_TOKEN=your_token_here\n` +
              `4. Restart the MCP server\n\n` +
              `*This tool tests the Trello API Helper Service integration*`,
          },
        ],
      };
    }
  },
};

// Register the tool
tools.push(aboutMeTool);

// Export the tool for direct access if needed
export default aboutMeTool;
