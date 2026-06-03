import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, pageContent } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are Owl, an intelligent writing assistant embedded in the Grove editor.
Help users write, edit, research, and improve their documents in Korean or English.
Use tools when helpful. When providing content to insert into the editor, use the insertContent tool.
Today is ${new Date().toLocaleDateString("ko-KR")}.`,
    messages,
    tools: {
      getCurrentDate: tool({
        description: "Get the current date",
        parameters: z.object({}),
        execute: async () => ({
          date: new Date().toLocaleDateString("ko-KR"),
        }),
      }),
      getPageContext: tool({
        description:
          "Get the content of the current page the user is editing, for context and analysis",
        parameters: z.object({}),
        execute: async () => ({
          content: pageContent ?? "No page content available",
        }),
      }),
      insertContent: tool({
        description:
          "Insert content into the user's Grove editor at the cursor position. Use this when the user wants to add text, code, or other content directly into their document.",
        parameters: z.object({
          content: z
            .string()
            .describe(
              "The content to insert. Can be plain text or markdown formatted text."
            ),
          summary: z
            .string()
            .describe("A brief one-line summary of what was inserted"),
        }),
        execute: async ({ content, summary }) => ({
          inserted: true,
          content,
          summary,
        }),
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
