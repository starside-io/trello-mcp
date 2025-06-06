/**
 * Centralized error handling for Trello API responses
 * Provides consistent error parsing and formatting across all tools
 */

export interface TrelloErrorInfo {
  error: string;
  message: string;
  suggestion: string;
}

export interface TrelloErrorContext {
  toolName?: string;
  resourceType?: string;
  resourceId?: string;
  troubleshootingSteps?: string[];
  troubleshootingTitle?: string;
  additionalInfo?: string;
}

/**
 * Common Trello API error patterns and their user-friendly messages
 */
export const TRELLO_ERROR_PATTERNS = {
  NOT_FOUND: {
    patterns: ["not found", "404"],
    error: "Resource not found",
    message: "The requested resource does not exist or you don't have access to it.",
    suggestion: "Verify the ID is correct and that you have proper access permissions."
  },
  UNAUTHORIZED: {
    patterns: ["unauthorized", "401", "credentials"],
    error: "Authentication failed",
    message: "Please check your TRELLO_API_KEY and TRELLO_TOKEN environment variables.",
    suggestion: "Ensure your API credentials are valid and properly configured."
  },
  FORBIDDEN: {
    patterns: ["forbidden", "403"],
    error: "Access forbidden",
    message: "You don't have permission to access this resource.",
    suggestion: "Ensure you have the necessary permissions for this board or resource."
  },
  RATE_LIMITED: {
    patterns: ["rate limit", "429"],
    error: "Rate limit exceeded",
    message: "Too many API requests. Please wait before trying again.",
    suggestion: "Wait a few moments and retry your request."
  },
  NETWORK_ERROR: {
    patterns: ["network", "fetch", "timeout"],
    error: "Network error",
    message: "Please check your internet connection and try again.",
    suggestion: "Verify your network connectivity and retry the operation."
  },
  INVALID_LIST: {
    patterns: ["invalid", "list"],
    error: "Invalid list ID",
    message: "The specified list ID is invalid or doesn't exist.",
    suggestion: "Use get-board-lists tool to find valid list IDs."
  },
  INVALID_BOARD: {
    patterns: ["invalid", "board"],
    error: "Invalid board ID",
    message: "The specified board ID is invalid or doesn't exist.",
    suggestion: "Use list-my-boards tool to find valid board IDs."
  },
  ENVIRONMENT: {
    patterns: ["environment"],
    error: "Missing environment variables",
    message: "Missing environment variables. Please set TRELLO_API_KEY and TRELLO_TOKEN.",
    suggestion: "Configure your environment variables and restart the MCP server."
  }
} as const;

/**
 * Parse error message and return appropriate error information
 */
export function parseError(error: unknown): TrelloErrorInfo {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
  
  // Check for specific error patterns
  for (const [, errorPattern] of Object.entries(TRELLO_ERROR_PATTERNS)) {
    if (errorPattern.patterns.some(pattern => errorMessage.includes(pattern))) {
      return {
        error: errorPattern.error,
        message: errorPattern.message,
        suggestion: errorPattern.suggestion
      };
    }
  }
  
  // Default error for unmatched patterns
  return {
    error: "Operation failed",
    message: error instanceof Error ? error.message : "An unknown error occurred.",
    suggestion: "Please check your request parameters and try again."
  };
}

/**
 * Generate a JSON error response (for tools like update-card)
 */
export function generateJsonErrorResponse(
  error: unknown, 
  context?: TrelloErrorContext
): any {
  const errorInfo = parseError(error);
  
  // Customize messages based on context
  let customMessage = errorInfo.message;
  let suggestion = errorInfo.suggestion;
  
  if (context?.resourceType === "card") {
    if (errorInfo.error === "Resource not found") {
      customMessage = "The specified card ID does not exist or you don't have access to it.";
      suggestion = "Use get-all-cards-for-each-list or get-cards-for-list tools to find valid card IDs.";
    } else if (errorInfo.error === "Access forbidden") {
      customMessage = "You don't have permission to update this card.";
      suggestion = "Ensure you have write access to the board and card.";
    }
  } else if (context?.resourceType === "list" && errorInfo.error === "Resource not found") {
    suggestion = "Use get-board-lists tool to find valid list IDs.";
  } else if (context?.resourceType === "board" && errorInfo.error === "Resource not found") {
    suggestion = "Use list-my-boards tool to find valid board IDs.";
  }
  
  return {
    success: false,
    error: errorInfo.error,
    message: customMessage,
    suggestion: suggestion
  };
}

/**
 * Generate a markdown error response (for most tools)
 */
export function generateMarkdownErrorResponse(
  error: unknown,
  context?: TrelloErrorContext
): string {
  const errorInfo = parseError(error);
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  
  // Customize message based on context
  let customMessage = errorInfo.message;
  if (context?.resourceType === "board") {
    if (errorInfo.error === "Resource not found") {
      customMessage = "Board not found or access denied. Please check your TRELLO_WORKING_BOARD_ID and ensure you have access to this board.";
    } else if (errorInfo.error === "Access forbidden") {
      customMessage = "Access forbidden. Please ensure you have permission to view this board's lists.";
    }
  } else if (context?.resourceType === "list") {
    if (errorInfo.error === "Access forbidden") {
      customMessage = "Access forbidden. Please ensure you have permission to view this board's lists and cards.";
    }
  }
  
  // Build troubleshooting steps
  const defaultSteps = [
    "Verify your API credentials are valid",
    "Check your internet connection",
    "Ensure you have proper access permissions"
  ];
  
  const troubleshootingSteps = context?.troubleshootingSteps || defaultSteps;
  const troubleshootingTitle = context?.troubleshootingTitle || "Troubleshooting";
  const stepsList = troubleshootingSteps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");
  
  let response = `# Trello API Error\n\n❌ **${customMessage}**\n\n`;
  response += `**Technical Details:** ${errorMessage}\n\n`;
  response += `## ${troubleshootingTitle}:\n${stepsList}\n\n`;
  
  if (context?.additionalInfo) {
    response += `${context.additionalInfo}`;
  }
  
  return response;
}

/**
 * Generate MCP tool error response format
 */
export function generateToolErrorResponse(
  error: unknown,
  format: "json" | "markdown" = "markdown",
  context?: TrelloErrorContext
): { content: Array<{ type: string; text: string }> } {
  let text: string;
  
  if (format === "json") {
    const jsonResponse = generateJsonErrorResponse(error, context);
    text = JSON.stringify(jsonResponse, null, 2);
  } else {
    text = generateMarkdownErrorResponse(error, context);
  }
  
  return {
    content: [{ type: "text", text }]
  };
}