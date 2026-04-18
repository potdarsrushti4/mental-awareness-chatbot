"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

function createMessage(role: Role, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function AssistantAvatar() {
  return (
    <div className="avatar assistant-avatar" aria-hidden="true">
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M5 19c8.8-.4 14-5.6 14-14-8.4.3-14 5.7-14 14Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M9 15c2.5-1 4.5-3 6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="avatar user-avatar" aria-hidden="true">
      You
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <AssistantAvatar />
      <h2>What is on your mind today?</h2>
      <p>
        Share a thought, feeling, or small moment. Mindful Assistant will reply
        with calm support.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <article className={`message-row ${isAssistant ? "assistant" : "user"}`}>
      {isAssistant ? <AssistantAvatar /> : <UserAvatar />}
      <div className="message-stack">
        {isAssistant ? (
          <span className="message-label">Mindful Assistant</span>
        ) : null}
        <div className="message-bubble">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}

function TypingIndicator() {
  return (
    <article className="message-row assistant">
      <AssistantAvatar />
      <div className="message-stack">
        <span className="message-label">Mindful Assistant</span>
        <div className="message-bubble typing-bubble">
          <span>Mindful Assistant is typing</span>
          <span className="typing-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </article>
  );
}

function ChatComposer({
  canSend,
  input,
  inputRef,
  isSending,
  onChange,
  onKeyDown,
  onSubmit,
}: {
  canSend: boolean;
  input: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isSending: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <textarea
        aria-label="Message"
        disabled={isSending}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message..."
        ref={inputRef}
        rows={1}
        value={input}
      />
      <button aria-label="Send message" disabled={!canSend} type="submit">
        <svg
          aria-hidden="true"
          fill="none"
          height="20"
          viewBox="0 0 24 24"
          width="20"
        >
          <path
            d="m5 12 13-7-4 14-3-5-6-2Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </form>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isSending,
    [input, isSending],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isSending) {
      return;
    }

    const userMessage = createMessage("user", text);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? "The chat service is unavailable.");
      }

      setMessages((current) => [
        ...current,
        createMessage("assistant", data.reply as string),
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.";

      setError(message);
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main className="shell">
      <section className="chat-panel" aria-label="Mental wellness chat">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Mindful Chat</p>
            <h1>A calm space to pause and reflect</h1>
          </div>
          <span className="status-pill">
            <span aria-hidden="true" />
            Online
          </span>
        </header>

        <div className="message-list" aria-live="polite" ref={scrollRef}>
          {messages.length === 0 ? <EmptyState /> : null}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isSending ? <TypingIndicator /> : null}
        </div>

        <div className="bottom-bar">
          {error ? <p className="error-message">{error}</p> : null}
          <ChatComposer
            canSend={canSend}
            input={input}
            inputRef={inputRef}
            isSending={isSending}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
          />
          <p className="safety-note">
            This chat is not medical care. If you may harm yourself or someone
            else, contact local emergency services or a trusted crisis line now.
          </p>
        </div>
      </section>
    </main>
  );
}
