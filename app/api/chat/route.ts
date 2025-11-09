import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';

import { Experimental_Agent as Agent, stepCountIs } from 'ai';




import {
  experimental_createMCPClient,

} from '@ai-sdk/mcp';


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


const tools = {
  ...toolSetMinizinc,
  ...toolSetCaldav,
};


const calAgent = new Agent({
  model: anthropic("claude-haiku-4-5-20251001"),
  tools,
  stopWhen: stepCountIs(1000),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = calAgent.stream({
    messages: convertToModelMessages(messages),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
  });

  return result.toUIMessageStreamResponse();
}
