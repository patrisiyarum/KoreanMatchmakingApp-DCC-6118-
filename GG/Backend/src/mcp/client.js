import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { partnerMatching } from "./tools/partnerMatching.js";
import { scheduleMeeting } from "./tools/scheduleMeeting.js";
import { summarizePracticeSession } from "./tools/summarizePracticeSession.js";

let mcpClientInstance = null;
let mcpClientPromise = null;

/** Matches `server.js`: MCP HTTP server is off in production unless ENABLE_MCP=1. */
function isMcpHttpServerEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_MCP === "1";
}

/**
 * MCP `tools/call` returns CallToolResult; `aiAssistantController.formatToolResponse` expects the tool payload (matches, error, etc.).
 */
function normalizeToolResult(raw) {
  if (!raw || typeof raw !== "object") return raw;
  if (raw.structuredContent && typeof raw.structuredContent === "object") {
    return raw.structuredContent;
  }
  const c0 = raw.content?.[0];
  if (c0?.type === "text" && typeof c0.text === "string") {
    try {
      const parsed = JSON.parse(c0.text);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* not JSON */
    }
  }
  const { content, structuredContent, isError, _meta, ...rest } = raw;
  if (Object.keys(rest).length) return rest;
  return raw;
}

async function callToolWithInProcessFallback(name, args, directFn) {
  if (!isMcpHttpServerEnabled()) {
    return directFn();
  }
  try {
    const client = await getMcpClient();
    const raw = await client.callTool({ name, arguments: args });
    return normalizeToolResult(raw);
  } catch (err) {
    console.warn(
      `[MCP] ${name} failed (${err?.message || err}); running in-process tool instead.`
    );
    return directFn();
  }
}

export async function getMcpClient() {
  // If client already exists and is connected, return it
  if (mcpClientInstance) {
    return mcpClientInstance;
  }
  if (mcpClientPromise) {
    return mcpClientPromise;
  }

  // Create new client connection
  mcpClientPromise = (async () => {
    try {
      const transport = new StreamableHTTPClientTransport(
        new URL(process.env.MCP_URL || "http://127.0.0.1:4000/mcp")
      );

      const client = new Client(
        {
          name: "languageexchangematchmaker-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      console.log("MCP client connected to server");
      
      mcpClientInstance = client;
      mcpClientPromise = null; // Reset promise after successful connection
      return client;
    } catch (error) {
      mcpClientPromise = null; // Reset promise on error
      console.error("Error creating MCP client:", error);
      throw error;
    }
  })();

  return mcpClientPromise;
}

export async function callPronunciationHelp(audioPart, userId) {
  if (audioPart == null) {
    return {
      error: "Invalid audioFile provided",
      details: "audioFile was null!"
    };
  }

  try {
    const args = { audioPart: audioPart, userId: userId };
    return await callToolWithInProcessFallback(
      "pronunciationHelp",
      args,
      async () => ({ error: "pronunciationHelp requires MCP server in this deployment" })
    );

  } catch (error) {
    console.error("Error calling pronunciationHelp tool:", error);
    return {
      error: "Failed to call pronunciationHelp tool",
      details: error.message
    };
  }
}

export async function callPartnerMatching(userId, criteria = {}) {
  // Ensure userId is a number
  const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  
  if (isNaN(numericUserId)) {
    return {
      error: "Invalid userId provided",
      details: `userId must be a number, got: ${userId} (type: ${typeof userId})`
    };
  }

  try {
    const args = { userId: numericUserId };
    
    if (criteria && (criteria.zodiac || criteria.mbti)) {
      args.criteria = {};
      if (criteria.zodiac) args.criteria.zodiac = criteria.zodiac;
      if (criteria.mbti) args.criteria.mbti = criteria.mbti;
    }
    
    return await callToolWithInProcessFallback("partnerMatching", args, async () =>
      partnerMatching(args)
    );
  } catch (error) {
    console.error("Error calling partnerMatching tool:", error);
    return {
      error: "Failed to call partnerMatching tool",
      details: error.message
    };
  }
}

export async function callSummarizePracticeSession(chatId, requestingUserId) {
  // Ensure requestingUserId is a number
  console.log(chatId);
  try {
    const args = {
      chatId: chatId,
      userId: requestingUserId,
    };
    return await callToolWithInProcessFallback(
      "summarizePracticeSession",
      args,
      async () => summarizePracticeSession(args)
    );
  } catch (error) {
    console.error("Error calling summarizePracticeSession tool:", error);
    return {
      error: "Failed to call summarizePracticeSession tool",
      details: error.message
    };
  }
}

/**
 * Call the scheduleMeeting tool
 */
export async function callScheduleMeeting(userId, targetUserName, preferredDay = null, preferredTime = null) {
  // Ensure userId is a number
  const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  
  if (isNaN(numericUserId)) {
    return {
      error: "Invalid userId provided",
      details: `userId must be a number, got: ${userId} (type: ${typeof userId})`
    };
  }

  if (!targetUserName || typeof targetUserName !== 'string') {
    return {
      error: "Invalid targetUserName provided",
      details: "targetUserName must be a non-empty string"
    };
  }

  try {
    const args = {
      userId: numericUserId,
      targetUserName: targetUserName
    };
    
    if (preferredDay) {
      args.preferredDay = preferredDay;
    }
    
    if (preferredTime) {
      args.preferredTime = preferredTime;
    }
    
    return await callToolWithInProcessFallback("scheduleMeeting", args, async () =>
      scheduleMeeting(args)
    );
  } catch (error) {
    console.error("Error calling scheduleMeeting tool:", error);
    return {
      error: "Failed to call scheduleMeeting tool",
      details: error.message
    };
  }
}

/**
 * Create a new MCP client (for summarizePracticeSession or other tools)
 * Note: This should ideally also use the singleton, but kept separate for now
 */
export async function createMcpClient() {
  return getMcpClient();
}
