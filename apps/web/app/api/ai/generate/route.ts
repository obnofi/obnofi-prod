import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { AiCommandType } from "@obnofi/types/ai";

export const maxDuration = 30;

const systemPrompts: Record<AiCommandType, string> = {
  summarize:
    "You are a helpful assistant. Summarize the following text in Korean within three concise bullet points:",
  translate:
    "You are a helpful assistant. Translate the following text to Korean naturally:",
  continue:
    "You are a helpful assistant. Continue writing from the following text in Korean:",
  improve:
    "You are a helpful assistant. Improve the following text to be more clear and professional in Korean:",
  shorter:
    "You are a helpful assistant. Make the following text shorter and more concise in Korean:",
  longer:
    "You are a helpful assistant. Expand the following text with more details in Korean:",
  explain:
    "You are a helpful assistant. Explain the following text in simple terms in Korean:",
  code: "You are a helpful assistant. Write code based on the following description:",
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, context, command } = await req.json();

    if (!prompt || !command) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = systemPrompts[command as AiCommandType];
    const userPrompt = context
      ? `${systemPrompt}\n\nContext: ${context}\n\nText: ${prompt}`
      : `${systemPrompt}\n\nText: ${prompt}`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
