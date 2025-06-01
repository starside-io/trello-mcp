import { TrelloRequestOptions, HttpMethod } from "../types/trello.js";

/**
 * HTTP Client utility for making API requests
 */
export class HttpClient {
  /**
   * Make an HTTP request with proper error handling
   */
  public static async request(
    url: string,
    options: TrelloRequestOptions = {}
  ): Promise<any> {
    const { method = "GET", params, body, headers = {} } = options;

    try {
      // Build URL with query parameters
      const requestUrl = new URL(url);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          requestUrl.searchParams.append(key, String(value));
        });
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Trello-MCP-Client/1.0",
          ...headers,
        },
      };

      if (body && method !== "GET") {
        requestOptions.body = JSON.stringify(body);
      }

      // Make the request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(requestUrl.toString(), {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} - ${errorText}`
          );
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Request timeout after 30 seconds");
        }
        throw fetchError;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Unknown error occurred during HTTP request: ${String(error)}`
      );
    }
  }

  /**
   * Make a GET request
   */
  public static async get(
    url: string,
    params?: Record<string, any>
  ): Promise<any> {
    return this.request(url, { method: "GET", params });
  }

  /**
   * Make a POST request
   */
  public static async post(
    url: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<any> {
    return this.request(url, { method: "POST", body, params });
  }

  /**
   * Make a PUT request
   */
  public static async put(
    url: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<any> {
    return this.request(url, { method: "PUT", body, params });
  }

  /**
   * Make a DELETE request
   */
  public static async delete(
    url: string,
    params?: Record<string, any>
  ): Promise<any> {
    return this.request(url, { method: "DELETE", params });
  }
}
