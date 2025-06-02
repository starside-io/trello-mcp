import { z } from "zod";
import { ToolDefinition, tools } from "./types.js";

const randomNumberTool: ToolDefinition = {
  name: "random-number",
  description: "Generate a random number within a specified range",
  params: {
    min: z.number().default(1).describe("Minimum value (inclusive)"),
    max: z.number().default(100).describe("Maximum value (inclusive)"),
  },
  handler: async (args: Record<string, any>) => {
    const min = args.min as number;
    const max = args.max as number;
    // Generate random number between min and max (inclusive)
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      content: [
        {
          type: "text",
          text: `Your random number is: ${randomNum}`,
        },
      ],
    };
  }
};

// Register the tool
tools.push(randomNumberTool);

// Export the tool for direct access if needed
export default randomNumberTool;
