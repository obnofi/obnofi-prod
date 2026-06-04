import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, pageContent, apiKey } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "OpenAI API 키가 필요합니다." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const openai = createOpenAI({ apiKey: key });
  const modelMessages = await convertToModelMessages(messages);

  const pageContextSection = pageContent
    ? `\n\n## Current Page Content\nThe user is editing this document. Use it as context for all responses:\n\n${pageContent}`
    : "";

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are Owl, an intelligent writing assistant embedded in the Grove editor.
Help users write, edit, research, and improve their documents in Korean or English.
Use tools when helpful. To deliver content for the user to insert into their editor, use the insertContent tool.
Today is ${new Date().toLocaleDateString("ko-KR")}.${pageContextSection}`,
    messages: modelMessages,
    tools: {
      getCurrentDate: tool({
        description: "Get the current date",
        inputSchema: z.object({}),
        execute: async () => ({
          date: new Date().toLocaleDateString("ko-KR"),
        }),
      }),
      getPageContext: tool({
        description:
          "Get the content of the current page the user is editing, for context and analysis",
        inputSchema: z.object({}),
        execute: async () => ({
          content: pageContent ?? "페이지 내용 없음",
        }),
      }),
      insertContent: tool({
        description:
          "Prepare content for insertion into the user's Grove editor. Call this when the user wants to add text, a list, code, or any content to their document.",
        inputSchema: z.object({
          content: z
            .string()
            .describe("The content to insert, plain text or markdown"),
          summary: z
            .string()
            .describe("A brief one-line description of the content"),
        }),
        execute: async ({ content, summary }) => ({ content, summary }),
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
