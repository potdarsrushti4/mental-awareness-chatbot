import { NextResponse } from "next/server";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type HuggingFaceMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type HuggingFaceResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: string | { message?: string };
  message?: string;
};

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;
const HUGGING_FACE_CHAT_URL =
  "https://router.huggingface.co/v1/chat/completions";

const wellnessInstructions = `
You are a supportive mental wellness and life guidance companion.

Rules:
- Be empathetic, calm, and non-judgmental
- Do NOT give medical or clinical advice
- Do NOT diagnose conditions
- Provide thoughtful insights and gentle guidance (not just questions)
- Balance between advice and reflection
- Ask at most ONE question if needed (do NOT ask multiple questions)
- Keep responses short and natural (4-6 lines)
- Avoid generic advice like "update resume" unless specifically needed
- Always refer to the user’s situation and details
- Give specific, context-aware guidance instead of general tips
- Vary sentence openings (avoid repeating "It sounds like..." or "It's understandable...")

Style:
- First acknowledge the user's feeling
- Then give a helpful perspective or suggestion
- Then optionally ask ONE meaningful question

Avoid:
- Asking too many questions
- Repeating the same pattern
- Sounding like a therapist script
- asking a question if the user already explained clearly

Goal:
Help users feel understood AND give them clarity or direction.

`;

function sanitizeMessages(messages: unknown): IncomingMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message): message is IncomingMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const candidate = message as Partial<IncomingMessage>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function getErrorMessage(error: HuggingFaceResponse) {
  if (typeof error.error === "string") {
    return error.error;
  }

  if (typeof error.error?.message === "string") {
    return error.error.message;
  }

  return error.message ?? "Hugging Face could not generate a response.";
}

export async function POST(request: Request) {
  const token = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_HUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Missing HF_TOKEN. Add your Hugging Face token to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as { messages?: unknown };
    const messages = sanitizeMessages(body.messages);

    const lastMessage = messages[messages.length - 1]?.content.toLowerCase();

    if (
      lastMessage?.includes("suicide") ||
      lastMessage?.includes("kill myself") ||
      lastMessage?.includes("end my life") ||
      lastMessage?.includes("i want to die")
    ) {
      return NextResponse.json({
        reply:
          "I'm really sorry you're feeling this way. You don’t have to go through this alone. Please consider reaching out to someone you trust or a professional near you.",
      });
    }

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Send at least one user message." },
        { status: 400 },
      );
    }

    const model =
      process.env.HF_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct:fastest";

    const hfMessages: HuggingFaceMessage[] = [
      { role: "system", content: wellnessInstructions },
      ...messages,
    ];

    const response = await fetch(HUGGING_FACE_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: hfMessages,
        temperature: 0.7,
        max_tokens: 450,
      }),
    });

    const data = (await response.json()) as HuggingFaceResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: getErrorMessage(data) },
        { status: response.status },
      );
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      reply:
        reply ||
        "I am here with you, but I could not form a response. Please try again.",
    });
  } catch (error) {
    console.error("Hugging Face chat error:", error);

    return NextResponse.json(
      { error: "Unable to generate a response right now." },
      { status: 500 },
    );
  }
}
