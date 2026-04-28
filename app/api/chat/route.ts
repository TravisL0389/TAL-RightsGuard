import { NextResponse } from 'next/server';
import { ChatMessage, getGoogleAIClient, RIGHTS_MODEL, RIGHTS_SYSTEM_INSTRUCTION } from '@/lib/ai';

export const runtime = 'nodejs';

function toContents(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));
}

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as { messages?: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'A non-empty messages array is required.' }, { status: 400 });
    }

    const ai = getGoogleAIClient();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await (ai.models as any).generateContentStream({
            model: RIGHTS_MODEL,
            contents: toContents(messages),
            config: {
              systemInstruction: RIGHTS_SYSTEM_INSTRUCTION,
              tools: [{ googleSearch: {} }, { urlContext: {} }],
            },
          });

          for await (const chunk of response) {
            const text = chunk?.text ?? '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }

          controller.close();
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Unknown server error';
          controller.enqueue(encoder.encode(`Unable to complete the rights analysis right now. ${detail}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
