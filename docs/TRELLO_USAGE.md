# Trello API Helper Service - Usage Guide

## Overview

The Trello API Helper Service provides a simple, secure way to interact with the Trello REST API without repeatedly managing authentication credentials.

## Setup

### 1. Get Trello API Credentials

1. Visit https://trello.com/app-key
2. Copy your API key
3. Click on the "Token" link to generate a token
4. Copy the generated token

### 2. Configure Environment Variables

Create a `.env` file in the project root (use `.env.example` as a template):

```bash
TRELLO_API_KEY=your_actual_api_key_here
TRELLO_TOKEN=your_actual_token_here
```

### 3. Build and Run

```bash
npm run build
node build/index.js
```

## Features

### TrelloApiService

The main service class that handles all Trello API interactions:

- **Singleton Pattern**: Ensures consistent credential management
- **Automatic Authentication**: Injects API key and token into all requests
- **Error Handling**: Provides user-friendly error messages without exposing credentials
- **Multiple HTTP Methods**: Supports GET, POST, PUT, DELETE operations

### Available Tools

#### about-me Tool

A test tool that demonstrates the Trello API integration by fetching the authenticated user's boards.

**Usage:** Call the `about-me` tool through your MCP client

**Returns:**

- List of user's Trello boards
- Board status (open/closed)
- Organization information (if applicable)
- Board URLs and descriptions

#### list-my-boards Tool

Lists all Trello boards accessible to the authenticated user.

**Usage:** Call the `list-my-boards` tool through your MCP client

**Returns:**

- Complete list of accessible boards
- Board IDs, names, and URLs
- Board status (open/closed)

#### get-board-lists Tool

Retrieves all lists from the designated working board.

**Usage:** Call the `get-board-lists` tool through your MCP client

**Prerequisites:** Set `TRELLO_WORKING_BOARD_ID` environment variable

**Returns:**

- All lists from the working board
- List IDs, names, positions, and status
- Total list count

#### get-all-cards-for-each-list Tool

Retrieves all cards for every list on the designated working board, organized by list.

**Usage:** Call the `get-all-cards-for-each-list` tool through your MCP client

**Prerequisites:** Set `TRELLO_WORKING_BOARD_ID` environment variable

**Returns:**

- All cards organized by their containing lists
- Card details including ID, name, URL, position, labels, due dates
- Card and list counts
- Status indicators for both lists and cards

**Example Output Structure:**

```
# All Cards by List

**Working Board ID:** 6836b64d461ba344f5a564a2
**Total Lists:** 3
**Total Cards:** 15

## 1. To Do (Open)
**List ID:** 6836b64d461ba344f5a564a3
**Cards:** 5

   1. **Setup project structure** (Open)
      - ID: 6836b64d461ba344f5a564a4
      - URL: https://trello.com/c/abc123
      - Position: 16384
      - Labels: 2
      - Due Date: 2025-06-01T10:00:00.000Z
      - Description: Yes

   2. **Create API endpoints** (Open)
      - ID: 6836b64d461ba344f5a564a5
      - URL: https://trello.com/c/def456
      - Position: 32768
      - Labels: 1
      - Due Date: None
      - Description: No
```

#### get-cards-for-list Tool

Retrieves all cards for a specific Trello list by providing the list ID.

**Usage:** Call the `get-cards-for-list` tool through your MCP client

**Parameters:**

- `listId` (required): The ID of the Trello list to fetch cards from

**Returns:**

- All cards in the specified list
- Card details including ID, name, URL, description, due dates, labels, members
- List information and status
- Last activity dates for each card

**Example Usage:**

```
Tool: get-cards-for-list
Parameters:
  listId: "5f7b8c9d1e2f3a4b5c6d7e8f"
```

**Example Output Structure:**

```
# Cards in List: To Do

**List ID:** 5f7b8c9d1e2f3a4b5c6d7e8f
**List Status:** Open
**Board ID:** 6f8c9d1e2f3a4b5c6d7e8f9a
**Total Cards:** 3

## Cards

### 1. Task One (Open)
**Card ID:** 7a8b9c1d2e3f4a5b6c7d8e9f
**URL:** [Open Card](https://trello.com/c/shorturl)
**Description:** Complete the first task...
**Due Date:** 05/30/2025 (Pending)
**Labels:** High Priority, Bug
**Members:** 2 assigned
**Last Activity:** 05/29/2025
```

#### get-card Tool

Retrieves detailed information about a specific Trello card by providing its card ID.

**Usage:** Call the `get-card` tool through your MCP client

**Parameters:**

- `cardId` (required): The ID of the Trello card to retrieve

**Returns:**

- Comprehensive card details including all properties and metadata
- Board and list context information
- Card status, position, and timestamps
- Description, due dates, labels, and assigned members
- Direct links and IDs for further operations

**Example Usage:**

```
Tool: get-card
Parameters:
  cardId: "7a8b9c1d2e3f4a5b6c7d8e9f"
```

**Example Output Structure:**

```
# Card Details: Task One

**Status:** Open
**Card ID:** 7a8b9c1d2e3f4a5b6c7d8e9f
**URL:** [Open Card](https://trello.com/c/shorturl)
**Board:** Project Board
**List:** To Do
**Position:** 32768

## Description
Complete the first task for the project milestone...

## Due Date
**Due:** 05/30/2025 at 11:59:00 PM
**Status:** ⏰ Pending

## Labels (2)
1. **High Priority** (red)
2. **Bug** (orange)

## Assigned Members (2)
1. Member ID: 1a2b3c4d5e6f7a8b9c1d2e3f
2. Member ID: 2b3c4d5e6f7a8b9c1d2e3f4a

## Metadata
**Last Activity:** 05/29/2025 at 2:30:15 PM
**Board ID:** 6f8c9d1e2f3a4b5c6d7e8f9a
**List ID:** 5f7b8c9d1e2f3a4b5c6d7e8f
```

#### update-card Tool

Updates Trello card details with comprehensive parameter support and validation. Supports partial updates - only provided parameters will be modified.

**Usage:** Call the `update-card` tool through your MCP client

**Parameters:**

- `cardId` (required): The ID of the Trello card to update (24-character hexadecimal string)
- `name` (optional): New name for the card
- `desc` (optional): New description for the card
- `closed` (optional): Whether to archive (true) or unarchive (false) the card
- `idList` (optional): ID of the list to move the card to (24-character hexadecimal string)
- `idBoard` (optional): ID of the board to move the card to (24-character hexadecimal string)
- `pos` (optional): Position of the card in the list. Use 'top', 'bottom', or a positive number
- `due` (optional): Due date for the card in ISO 8601 format (e.g., '2023-12-31T23:59:59.000Z')
- `start` (optional): Start date for the card in ISO 8601 format (e.g., '2023-12-31T00:00:00.000Z')
- `dueComplete` (optional): Whether the due date has been completed
- `idMembers` (optional): Array of member IDs to assign to the card (24-character hexadecimal strings)
- `idLabels` (optional): Array of label IDs to assign to the card (24-character hexadecimal strings)

**Returns:**

- Updated card information with complete details
- Summary of changes made
- Success/failure status with detailed error messages
- Suggestions for resolving errors when they occur

**Example Usage - Update Card Name:**

```
Tool: update-card
Parameters:
  cardId: "7a8b9c1d2e3f4a5b6c7d8e9f"
  name: "Updated Task Name"
```

**Example Usage - Move Card to Different List:**

```
Tool: update-card
Parameters:
  cardId: "7a8b9c1d2e3f4a5b6c7d8e9f"
  idList: "5f7b8c9d1e2f3a4b5c6d7e8f"
  pos: "top"
```

**Example Usage - Set Due Date and Assign Members:**

```
Tool: update-card
Parameters:
  cardId: "7a8b9c1d2e3f4a5b6c7d8e9f"
  due: "2025-06-15T17:00:00.000Z"
  idMembers: ["1a2b3c4d5e6f7a8b9c1d2e3f", "2b3c4d5e6f7a8b9c1d2e3f4a"]
```

**Example Success Response:**

```json
{
  "success": true,
  "message": "Card \"Updated Task Name\" updated successfully",
  "cardId": "7a8b9c1d2e3f4a5b6c7d8e9f",
  "cardName": "Updated Task Name",
  "cardUrl": "https://trello.com/c/shorturl",
  "changes": [
    "name updated to \"Updated Task Name\"",
    "moved to list 5f7b8c9d1e2f3a4b5c6d7e8f",
    "position changed to top"
  ],
  "updatedCard": {
    "id": "7a8b9c1d2e3f4a5b6c7d8e9f",
    "name": "Updated Task Name",
    "desc": "Task description",
    "closed": false,
    "pos": 16384,
    "idList": "5f7b8c9d1e2f3a4b5c6d7e8f",
    "idBoard": "6f8c9d1e2f3a4b5c6d7e8f9a",
    "due": null,
    "dueComplete": false,
    "idMembers": [],
    "labels": [],
    "url": "https://trello.com/c/shorturl",
    "dateLastActivity": "2025-05-29T12:00:00.000Z"
  }
}
```

**Example Error Response:**

```json
{
  "success": false,
  "error": "Card not found",
  "message": "The specified card ID does not exist or you don't have access to it.",
  "suggestion": "Use get-all-cards-for-each-list or get-cards-for-list tools to find valid card IDs."
}
```

**Common Update Patterns:**

1. **Archive a completed card:**

   ```
   Parameters: { cardId: "...", closed: true }
   ```

2. **Move card between lists:**

   ```
   Parameters: { cardId: "...", idList: "new_list_id", pos: "bottom" }
   ```

3. **Update card with due date:**

   ```
   Parameters: { cardId: "...", due: "2025-06-30T23:59:59.000Z", dueComplete: false }
   ```

4. **Bulk property update:**
   ```
   Parameters: {
     cardId: "...",
     name: "New Name",
     desc: "New Description",
     idMembers: ["member1", "member2"],
     idLabels: ["label1", "label2"]
   }
   ```

## API Usage Examples

### Using the Service Directly

```typescript
import { TrelloApiService } from "./services/trello-api.js";

// Get service instance
const trelloService = TrelloApiService.getInstance();

// Initialize (validates credentials)
await trelloService.initialize();

// Get user's boards
const boards = await trelloService.getUserBoards();

// Get current user info
const user = await trelloService.getCurrentUser();

// Make custom API calls
const customData = await trelloService.get("/members/me/cards");
```

### Creating New Tools

When creating new tools that use the Trello API:

```typescript
import { TrelloApiService } from "../services/trello-api.js";

const myTool: ToolDefinition = {
  name: "my-trello-tool",
  description: "My custom Trello tool",
  params: {},
  handler: async () => {
    try {
      const trelloService = TrelloApiService.getInstance();

      // Service will auto-initialize if needed
      if (!trelloService.isServiceInitialized()) {
        await trelloService.initialize();
      }

      // Use the service
      const data = await trelloService.get("/some/endpoint");

      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      // Handle errors appropriately
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  },
};
```

## Security Features

- **Credential Protection**: API credentials are never exposed in logs or error messages
- **Environment-based Config**: Credentials stored securely in environment variables
- **Error Sanitization**: Error messages are cleaned to remove potential credential leaks
- **Validation**: Credentials are validated on service initialization

## Error Handling

The service provides comprehensive error handling:

- **Missing Credentials**: Clear instructions for setting up environment variables
- **Invalid Credentials**: User-friendly authentication error messages
- **Network Issues**: Helpful messages for connectivity problems
- **API Errors**: Proper handling of Trello API error responses

## Testing

Use the `about-me` tool to verify your setup:

1. Set up your environment variables
2. Build and run the server
3. Call the `about-me` tool
4. You should see your Trello boards listed

If there are issues, the tool will provide specific error messages and setup instructions.

## Future Extensions

The service is designed to be easily extensible for additional Trello features:

- Board management
- Card operations
- List management
- Member operations
- Webhook handling

All future Trello-related tools should use this service for consistent authentication and error handling.
