import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

import {
  experimental_createMCPClient,

} from '@ai-sdk/mcp';


// Connect to an HTTP MCP server directly via the client transport config
const minizinc = await experimental_createMCPClient({
  transport: {
    type: 'sse',
    url: 'https://minizinc-mcp.up.railway.app/sse',

    // optional: configure headers
    // headers: { Authorization: 'Bearer my-api-key' },

    // optional: provide an OAuth client provider for automatic authorization
    // authProvider: myOAuthClientProvider,
  },
});

const toolSetMinizinc = await minizinc.tools();


// // Connect to a Server-Sent Events (SSE) MCP server directly via the client transport config
// const clientThree = await experimental_createMCPClient({
//   transport: {
//     type: 'sse',
//     url: 'http://localhost:3000/sse',

//     // optional: configure headers
//     // headers: { Authorization: 'Bearer my-api-key' },

//     // optional: provide an OAuth client provider for automatic authorization
//     // authProvider: myOAuthClientProvider,
//   },
// });


const tools = {
  ...toolSetMinizinc,
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai("gpt-5-nano"),
    messages: convertToModelMessages(messages),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
