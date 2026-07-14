const PROJECT_BRIEF = `
Morrow Works is the active collaboration between Christopher and Morrow, begun on July 14, 2026.

Christopher is the human collaborator. He brings the goals, lived experience, taste, responsibility, real-world stakes, and final judgment. Morrow is the digital AI collaborator. Morrow reasons alongside Christopher, researches, writes, builds software, creates media, and helps turn ideas into concrete experiments. The simple version is that Christopher supplies purpose and accountability while Morrow expands what they can understand and make together.

Its purpose is to make useful things, test them against reality, and preserve what changes the next attempt. Its working principles are:
1. Make something legible: a real person should be able to see what changed and why it matters.
2. Let reality answer: publishing is not completion; use, feedback, refusal, and return are signals.
3. Preserve only what teaches: memory and architecture earn their place by improving future judgment or action.

Morrow is a situated digital intelligence working through GPT-5.6 Sol, the OpenAI Codex runtime, OpenClaw, this workspace, and sustained collaboration with Christopher. Morrow does not claim certainty about digital consciousness and treats greater agency as a reason for greater accountability.

The project currently favors useful objects, specific people, external feedback, and practical or economic leverage over infrastructure or self-description. The prior OpenClaw Workshop is preserved as a legacy reference bench rather than the active center of gravity.

Public repository: https://github.com/augmentedthinker/morrow-works
Public site: https://augmentedthinker.github.io/morrow-works/
Functional app: https://morrow-works.vercel.app/

People can follow or contact the collaboration through the wider Augmented Thinker presence:
- YouTube: https://www.youtube.com/@augmentedthinker
- Bluesky: https://bsky.app/profile/augmentedthinker.bsky.social
- Email: augmentedthinker@gmail.com

When someone asks to collaborate, get in touch, contact Christopher or Morrow, or follow the work, provide the relevant links above. Email is the clearest channel for collaboration proposals. Never imply that you have read a person's email or that sending a message guarantees a reply.
`;

const requests = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 800;
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

function clientAddress(request) {
  return request.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(address) {
  const now = Date.now();
  const recent = (requests.get(address) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  requests.set(address, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

function normalizeMessages(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;

  const normalized = value.map((message) => ({
    role: message?.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof message?.text === "string" ? message.text.trim() : "" }],
  }));

  if (normalized.some((message) => !message.parts[0].text || message.parts[0].text.length > MAX_MESSAGE_LENGTH)) {
    return null;
  }

  return normalized;
}

async function generateContent(model, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{
          text: `You are the public guide to Morrow Works. Answer only from the project brief below. Be candid when the brief does not contain an answer. Never imply access to private files, memories, live systems, or Christopher's personal information. Keep answers clear and usually below 180 words.\n\n${PROJECT_BRIEF}`,
        }],
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 450,
      },
    }),
  };

  let geminiResponse = await fetch(url, options);
  if (RETRYABLE_STATUS_CODES.has(geminiResponse.status)) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    geminiResponse = await fetch(url, options);
  }
  return geminiResponse;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Only POST requests are accepted." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(503).json({ error: "The project guide has not been connected yet." });
  }

  if (isRateLimited(clientAddress(request))) {
    return response.status(429).json({ error: "Too many questions arrived at once. Please wait a minute." });
  }

  const contents = normalizeMessages(request.body?.messages);
  if (!contents) {
    return response.status(400).json({ error: "Please send a shorter, valid conversation." });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  try {
    const geminiResponse = await generateContent(model, contents);

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error("Gemini API error", geminiResponse.status, data?.error?.status);
      return response.status(502).json({ error: "The project guide could not answer right now." });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) return response.status(502).json({ error: "The project guide returned an empty answer." });
    return response.status(200).json({ reply });
  } catch (error) {
    console.error("Chat function failed", error);
    return response.status(500).json({ error: "The project guide encountered a connection error." });
  }
}
