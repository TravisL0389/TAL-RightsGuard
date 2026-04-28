import { NextResponse } from 'next/server';
import { getGoogleAIClient, RIGHTS_MODEL } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };

    if (!url) {
      return NextResponse.json({ error: 'A platform URL is required.' }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'URL must start with http or https.' }, { status: 400 });
    }

    const ai = getGoogleAIClient();
    const response = await (ai.models as any).generateContent({
      model: RIGHTS_MODEL,
      contents: `Review the latest Terms of Service or usage policy for ${parsedUrl.toString()}.

Summarize in three short paragraphs:
1. Commercial usage rights and plan restrictions.
2. Ownership or licensing position for generated music.
3. Practical watchouts for an artist releasing AI-assisted music.

Keep it concise, practical, and focused on AI music copyright and distribution risk.`,
      config: {
        tools: [{ urlContext: {} }, { googleSearch: {} }],
      },
    });

    return NextResponse.json({ summary: response?.text ?? '' });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
