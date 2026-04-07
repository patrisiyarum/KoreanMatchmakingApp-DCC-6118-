import http from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { partnerMatching } from "./tools/partnerMatching.js";
import { summarizePracticeSession } from "./tools/summarizePracticeSession.js";
import { scheduleMeeting } from "./tools/scheduleMeeting.js";
import { pronunciationHelp } from "./tools/pronunciation.js";
import { z } from "zod";

export async function startMCPServer() {
  const server = new McpServer({
    name: "languageexchangematchmaker-server",
    version: "1.0.0",
  });

  server.registerTool("partnerMatching", {
    description: "Suggest compatible language practice partners based on user preferences. Can filter by optional criteria like zodiac sign or MBTI type.",
    inputSchema: {
      userId: z.number(),
      criteria: z.object({
        zodiac: z.string().min(1).optional(),
        mbti: z.string().min(2).optional(),
      }).optional(),
    },
  }, async (args) => {
    return await partnerMatching(args);
  });

  server.registerTool("summarizePracticeSession", {
    description: "Summarize a practice session conversation. Only works if AI access was allowed for the session.",
    inputSchema: {
      chatId: z.string(),
      userId: z.number()
    },
  }, async (args) => {
    return await summarizePracticeSession(args);
  });

  server.registerTool("scheduleMeeting", {
    description: "Schedule a meeting/practice session with another user. Both users must be friends and have overlapping available time slots. The tool will automatically find the first available overlapping slot and schedule the meeting.",
    inputSchema: {
      userId: z.number(),
      targetUserName: z.string().min(1),
      preferredDay: z.string().optional(),
      preferredTime: z.string().optional()
    },
  }, async (args) => {
    return await scheduleMeeting(args);
  });

  server.registerTool("pronunciationHelp", {
    description: "Help the user with pronunciation and save it to the database.",
    inputSchema: {
      audioPart: z.object({
        inlineData: z.object({
          data: z.string(),
          mimeType: z.string()
        })
      }),
      userId: z.number(),
    }
  }, async (args) => {
    return await pronunciationHelp(args);
  });

  const httpServer = http.createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => {
      // Generate a session ID
      return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },
  });

  // Handle server requests on transport
  httpServer.on("request", async (req, res) => {
    await transport.handleRequest(req, res);
  });

  await server.connect(transport);

  // Start listening
  const port = process.env.MCP_PORT || 4000;
  httpServer.listen(port, () => {
    console.log(`MCP server running on http://localhost:${port}/mcp`);
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startMCPServer();
}
