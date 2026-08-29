import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { ONBOARDING_SYSTEM_PROMPT } from '@/lib/onboarding';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Streamt Claude 3.5 Sonnet's antwoord door naar de client, via dezelfde OpenRouter-route als
// coach.ts's openRouterChat (geen aparte Anthropic-key nodig). Geen tool-calling/structured-
// output tijdens het streamen — simpeler en betrouwbaarder: het model schrijft aan het eind van
// fase 5 zelf een ```json-blok (zie ONBOARDING_SYSTEM_PROMPT), dat de client eruit parseert
// zodra de stream klaar is en naar /api/onboarding/complete stuurt.
export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages is verplicht' }, { status: 400 });
  }

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://reis.weareimpact.nl',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-5',
      max_tokens: 1000,
      stream: true,
      messages: [
        { role: 'system', content: ONBOARDING_SYSTEM_PROMPT },
        ...body.messages,
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    console.error('Onboarding chat upstream error:', upstream.status, text);
    return NextResponse.json({ error: 'Kon geen verbinding maken met de AI' }, { status: 502 });
  }

  // OpenRouter/OpenAI-stijl SSE ("data: {...}\n\n", eindigend op "data: [DONE]") herleiden naar
  // platte tekst-chunks — de client hoeft geen SSE te parsen, alleen de responsebody te lezen.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // onvolledige/niet-JSON regel, negeren
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
