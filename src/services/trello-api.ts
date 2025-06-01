import {
  TrelloConfig,
  TrelloBoard,
  TrelloMember,
  TrelloRequestOptions,
  HttpMethod,
} from "../types/trello.js";
import { ConfigManager } from "../utils/config.js";
import { HttpClient } from "../utils/http-client.js";

/**
 * Trello API Service - Main service for interacting with Trello REST API
 * Handles authentication, request management, and provides a simple interface for API calls
 */
export class TrelloApiService {
  private static instance: TrelloApiService;
  private config!: TrelloConfig; // Use definite assignment assertion
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of TrelloApiService
   */
  public static getInstance(): TrelloApiService {
    if (!TrelloApiService.instance) {
      TrelloApiService.instance = new TrelloApiService();
    }
    return TrelloApiService.instance;
  }

  /**
   * Initialize the service with configuration
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load configuration
      const configManager = ConfigManager.getInstance();
      this.config = configManager.loadTrelloConfig();

      // Validate credentials by making a test API call
      await this.validateCredentials();

      this.isInitialized = true;
    } catch (error) {
      console.error("TrelloApiService initialization error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to initialize Trello API Service: ${message}`);
    }
  }

  /**
   * Validate credentials by making a test API call
   */
  private async validateCredentials(): Promise<void> {
    try {
      // Make a direct request without using makeAuthenticatedRequest
      // since we're still in initialization phase
      const url = `${this.config.baseUrl}/members/me`;
      const authParams = {
        key: this.config.apiKey,
        token: this.config.token,
      };

      await HttpClient.request(url, {
        method: "GET",
        params: authParams,
      });
    } catch (error) {
      throw new Error(
        "Invalid Trello API credentials. Please check your TRELLO_API_KEY and TRELLO_TOKEN."
      );
    }
  }

  /**
   * Make an authenticated request to the Trello API
   */
  public async makeAuthenticatedRequest(
    endpoint: string,
    options: TrelloRequestOptions = {}
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error(
        "Trello API Service not initialized. Call initialize() first."
      );
    }

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;
    const url = `${this.config.baseUrl}/${cleanEndpoint}`;

    // Inject authentication parameters
    const authParams = {
      key: this.config.apiKey,
      token: this.config.token,
      ...options.params,
    };

    const requestOptions: TrelloRequestOptions = {
      ...options,
      params: authParams,
    };

    return HttpClient.request(url, requestOptions);
  }

  /**
   * Get current user's boards
   */
  public async getUserBoards(): Promise<TrelloBoard[]> {
    return this.makeAuthenticatedRequest("/members/me/boards");
  }

  /**
   * Get current user information
   */
  public async getCurrentUser(): Promise<TrelloMember> {
    return this.makeAuthenticatedRequest("/members/me");
  }

  /**
   * Get a specific board by ID
   */
  public async getBoard(boardId: string): Promise<TrelloBoard> {
    return this.makeAuthenticatedRequest(`/boards/${boardId}`);
  }

  /**
   * Generic GET request method
   */
  public async get(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(endpoint, { method: "GET", params });
  }

  /**
   * Generic POST request method
   */
  public async post(
    endpoint: string,
    body?: any,
    params?: Record<string, string | number | boolean>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "POST",
      body,
      params,
    });
  }

  /**
   * Generic PUT request method
   */
  public async put(
    endpoint: string,
    body?: any,
    params?: Record<string, string | number | boolean>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "PUT",
      body,
      params,
    });
  }

  /**
   * Generic DELETE request method
   */
  public async delete(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: "DELETE",
      params,
    });
  }

  /**
   * Check if service is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration (without exposing credentials)
   */
  public getServiceInfo(): { baseUrl: string; initialized: boolean } {
    return {
      baseUrl: this.config?.baseUrl || "Not configured",
      initialized: this.isInitialized,
    };
  }
}
