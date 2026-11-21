import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import PackageJSON from '../package.json';
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";

// Tools
import * as searchMarket from './tools/search_market.tool.js';
import * as fetchListing from './tools/fetch_listing.tool.js';
import * as createSession from './tools/create_intake.tool.js';

const PORT = 3005;

const handler = createMcpHandler(() => {
  const server = new McpServer({
    name: "healthlist-mcp",
    version: PackageJSON.version
  });

  server.registerTool(
    searchMarket.name,
    {
      description: searchMarket.description,
      inputSchema: searchMarket.input
    },
    searchMarket.execute
  );

  server.registerTool(
    fetchListing.name,
    {
      description: fetchListing.description,
      inputSchema: fetchListing.input
    },
    fetchListing.execute
  );

  server.registerTool(
    createSession.name,
    {
      description: createSession.description,
      inputSchema: createSession.input
    },
    createSession.execute
  );

  return server;
});

const app = createMcpExpressApp();
const nodeHandler = toNodeHandler(handler);

app.all('/mcp', (req, res) => {
  void nodeHandler(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Healthlist MCP server is running on port ${PORT}`);
});
