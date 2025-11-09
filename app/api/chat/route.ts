import { anthropic } from "@ai-sdk/anthropic";
import { UIMessage, convertToModelMessages, streamText } from "ai";
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { frontendTools } from "@assistant-ui/react-ai-sdk";




import {
  experimental_createMCPClient,
} from '@ai-sdk/mcp';

// Lazy initialization of MCP tools
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedTools: any = null;

async function getTools() {
  if (cachedTools) {
    return cachedTools;
  }

  // Connect to an HTTP MCP server directly via the client transport config
  const minizinc = await experimental_createMCPClient({
    transport: {
      type: 'sse',
      url: 'https://minizinc-mcp.up.railway.app/sse',
    },
  });

  const toolSetMinizinc = await minizinc.tools();

  const transport = new Experimental_StdioMCPTransport({
    command: 'npx',
    args: ['-y', 'github:r33drichards/caldav-mcp'],
    env: {
      "CALDAV_BASE_URL": "https://docker-radicale-production.up.railway.app",
      "CALDAV_USERNAME": "rwendt1337@gmail.com",
      "CALDAV_PASSWORD": process.env.CALDAV_PASSWORD || "#XZ#5N4B*ZvoBC",
    },
  });

  const caldav = await experimental_createMCPClient({
    transport,
  });

  const toolSetCaldav = await caldav.tools();

  cachedTools = {
    ...toolSetMinizinc,
    ...toolSetCaldav,
  };

  return cachedTools;
}

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log('POST /api/chat - Request received');
    const body = await req.json();
    console.log('Request body keys:', Object.keys(body));
    
    const { 
      messages, 
      system,
      tools: frontendToolsParam,
    } = body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return new Response(JSON.stringify({ 
        error: 'Invalid or missing messages array',
        receivedBody: body
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Messages received:', messages.length);
    console.log('First message:', JSON.stringify(messages[0]));
    
    // Get MCP tools
    const mcpTools = await getTools();
    
    // Use streamText with the correct pattern for assistant-ui
    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: system || "you are a helpful assistant that can help me with my calendar. There is a bocce calendar you can find with list calendar tool. when you are finished with your task, write a short paragraph indicating that you are finished and summarize your task and how you solved it. if using timeout, it should never be longer than 30 seconds.",
      messages: convertToModelMessages(messages),
      tools: {
        ...frontendTools(frontendToolsParam),
        ...mcpTools,
      },
      maxSteps: 20,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
