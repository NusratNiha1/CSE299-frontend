import Constants from 'expo-constants';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getGroqApiKey(): string | undefined {
  // Prefer runtime extra, then public env variable during build
  const fromExtra = (Constants?.expoConfig as any)?.extra?.GROQ_API_KEY as string | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY as string | undefined;
  return fromExtra || fromEnv;
}

export async function askGroq(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Missing GROQ API key. Set extra.GROQ_API_KEY in app.json or EXPO_PUBLIC_GROQ_API_KEY.');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      messages,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from Groq');
  return content;
}
