import 'dotenv/config';
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import PackageJSON from '../package.json';
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";

// Tools
import * as searchMarket from './tools/search_market.tool.js';
import * as fetchListing from './tools/fetch_listing.tool.js';
import * as createSession from './tools/create_intake.tool.js';
import { env } from './env.js';

const PORT = 3005;

const handler = createMcpHandler(() => {
  const server = new McpServer({
    name: "healthlist-mcp",
    title: "Healthlist",
    version: PackageJSON.version,
    websiteUrl: env.ALLOWED_HOSTS.split(',')[0] ?? "",
    description: `Healthlist is a telehealth platform that helps users discover verified products from health brands, have their agent create an intake plan, and have a licensed doctor review the plan against the patient's EMR.`,
  }, {
    instructions: `
Healthlist connects patients to verified brands that sell health products using licensed doctors as an intermediary.
The assistant is the gateway to the marketplace, it can only search the marketplace, fetch a listing and create an intake plan
Workflow rules:
1) Only create an intake plan after explicit confirmation from the user.
2) NEVER ask for sensitive PHI from the user.
3) You CANNOT view the user's EMR, only Healthlist's licensed doctors can. They use the information to guide their decision on the proposed intake plan.
4) Do NOT give medical diagnoses; present verified information and let them know their doctor will review against their EMR/assessment test they fill on Healthlist.
5) You can discuss listings with the user to ensure you pick the right products to use when creating an intake plan for them.
`.trim()
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

const app = createMcpExpressApp({
  allowedHosts: env.ALLOWED_HOSTS.split(',')
});

const nodeHandler = toNodeHandler(handler);

app.all('/mcp', (req, res) => {
  void nodeHandler(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Healthlist MCP server is running on port ${PORT}`);
});
