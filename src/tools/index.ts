// Import all tools - when you add a new tool, just import it here

// Core connectivity tools
import "./hello-world.js";
import "./random-number.js";
import "./about-me.js";
import "./debug-trello.js";

// Organized tool categories
import "./boards/index.js";
import "./lists/index.js";
import "./cards/index.js";

// Export the tools array which contains all registered tools
export { tools } from "./types.js";
