# Trello MCP Server

A Model Context Protocol (MCP) server for integrating with the Trello API, providing secure and easy access to Trello boards, cards, and other resources.

## Features

- 🔐 **Secure Authentication**: Environment-based credential management
- 🛠️ **Easy Integration**: Simple API wrapper with automatic authentication injection
- 🧰 **Ready-to-use Tools**: Built-in tools for common Trello operations
- 🔍 **Error Handling**: Comprehensive error handling with user-friendly messages
- 🏗️ **Extensible**: Foundation for building custom Trello integrations

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Setup Trello Credentials

To connect to Trello, you'll need both an API key and a token. Follow the [Trello REST API Guide](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/) for detailed information about the Trello API.

1. **Get your API key** from https://trello.com/app-key
2. **Generate a token** using the link provided on the API key page
3. **Create a `.env` file** (use `.env.example` as template):

```bash
TRELLO_API_KEY=your_api_key_here
TRELLO_TOKEN=your_token_here
```

4. **Find your working board ID** by running the `list-my-boards` tool after setup, then add it to your `.env`:

```bash
TRELLO_WORKING_BOARD_ID=your_working_board_id_here
```

### 3. Build and Run

```bash
npm run build
node build/index.js
```

### 4. Configure in VS Code

After building the project, you can add the MCP server to your VS Code configuration by updating your settings:

```json
"mcp": {
  "servers": {
    "trello-mcp": {
      "command": "node",
      "args": ["/path/to/trello-mcp/build/index.js"],
      "env": {}
    }
  }
}
```

Replace `/path/to/trello-mcp` with the actual path to your project directory.

## Available Tools

### `about-me`

Test tool that retrieves and displays your Trello boards. Perfect for validating your API setup.

**Usage**: Call through your MCP client
**Returns**: List of your Trello boards with details

### `list-my-boards`

Lists all Trello boards accessible to the authenticated user. Use this tool to find your working board ID.

**Usage**: Call through your MCP client
**Returns**: Complete list of accessible boards with their IDs, names, and URLs

### `update-card`

Update Trello card details such as name, description, due dates, position, list assignment, and member/label assignments. Supports partial updates - only provided parameters will be modified.

**Usage**: Call through your MCP client with `cardId` and optional update parameters
**Parameters**:

- `cardId` (required) - The ID of the Trello card to update
- `name` (optional) - New name for the card
- `desc` (optional) - New description for the card
- `closed` (optional) - Whether to archive (true) or unarchive (false) the card
- `idList` (optional) - ID of the list to move the card to
- `idBoard` (optional) - ID of the board to move the card to
- `pos` (optional) - Position in the list ('top', 'bottom', or number)
- `due` (optional) - Due date in ISO 8601 format
- `start` (optional) - Start date in ISO 8601 format
- `dueComplete` (optional) - Whether the due date has been completed
- `idMembers` (optional) - Array of member IDs to assign to the card
- `idLabels` (optional) - Array of label IDs to assign to the card

**Returns**: Updated card information with change summary

### `get-cards-for-list`

Retrieves all cards for a specific Trello list by providing the list ID.

**Usage**: Call through your MCP client with `listId` parameter
**Parameters**: `listId` (required) - The ID of the Trello list
**Returns**: All cards in the specified list with detailed information

### `get-card`

Retrieves detailed information about a specific Trello card by providing its card ID.

**Usage**: Call through your MCP client with `cardId` parameter
**Parameters**: `cardId` (required) - The ID of the Trello card
**Returns**: Comprehensive card details including properties, metadata, labels, members, and due dates

### `hello-world`

Simple greeting tool for testing MCP server connectivity.

### `random-number`

Generates a random number - useful for testing tool execution.

## Development

### Project Structure

```
src/
├── services/
│   └── trello-api.ts          # Main Trello API service
├── tools/
│   ├── about-me.ts            # Trello boards tool
│   └── ...                    # Other tools
├── utils/
│   ├── config.ts              # Environment configuration
│   └── http-client.ts         # HTTP utilities
└── types/
    └── trello.ts              # TypeScript interfaces
```

### Adding New Tools

1. Create your tool in `src/tools/`
2. Import it in `src/tools/index.ts`
3. Use `TrelloApiService.getInstance()` for Trello API access

See [docs/TRELLO_USAGE.md](docs/TRELLO_USAGE.md) for detailed usage examples.

### Building

```bash
npm run build
```

## Documentation

- [Trello REST API Guide](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/) - Official Trello API documentation
- [Trello Usage Guide](docs/TRELLO_USAGE.md) - Detailed usage and examples
- [Implementation Plan](docs/features/001-trello-api-helper-service.md) - Technical implementation details
- [User Story](docs/stories/001-trello-api-helper-service-story.md) - Original requirements

## Security

- API credentials are stored in environment variables
- Credentials are never logged or exposed in error messages
- All API requests are automatically authenticated
- Error messages are sanitized to prevent credential leaks

## Contributing

1. Follow the existing patterns in `src/tools/` for new tools
2. Use the `TrelloApiService` for all Trello API interactions
3. Include proper error handling and user-friendly messages
4. Update documentation for new features

## License

[Add your license here]

## Support

For issues related to:

- **Trello API**: Check the [official Trello API documentation](https://developer.atlassian.com/cloud/trello/rest/)
- **MCP Protocol**: See the [Model Context Protocol documentation](https://modelcontextprotocol.io/)
- **This Server**: Create an issue in this repository
