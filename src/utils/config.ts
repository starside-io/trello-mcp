// Load environment variables
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root (two levels up from utils/)
config({ path: join(__dirname, "../../.env") });

import { TrelloConfig } from "../types/trello.js";

/**
 * Configuration utility for managing environment variables and Trello API settings
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: TrelloConfig | null = null;

  private constructor() {}

  /**
   * Get singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load Trello configuration from environment variables
   */
  public loadTrelloConfig(): TrelloConfig {
    if (this.config) {
      return this.config;
    }

    const apiKey = process.env.TRELLO_API_KEY;
    const token = process.env.TRELLO_TOKEN;
    const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
    const workingBoardId = process.env.TRELLO_WORKING_BOARD_ID;

    if (!apiKey || !token) {
      throw new Error(
        "Missing required Trello API credentials. Please set TRELLO_API_KEY and TRELLO_TOKEN environment variables."
      );
    }

    this.config = {
      apiKey,
      token,
      baseUrl,
      workingBoardId,
    };

    return this.config;
  }

  /**
   * Validate that the configuration is properly loaded
   */
  public validateConfig(): boolean {
    try {
      const config = this.loadTrelloConfig();
      return !!(config.apiKey && config.token && config.baseUrl);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current configuration (returns null if not loaded)
   */
  public getConfig(): TrelloConfig | null {
    return this.config;
  }

  /**
   * Clear cached configuration (useful for testing or credential updates)
   */
  public clearConfig(): void {
    this.config = null;
  }
}
