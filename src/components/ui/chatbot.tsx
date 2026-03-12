"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  X,
  Trash2,
  ChevronDown,
  RotateCw,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

const SYSTEM_PROMPT = `You are Xpool's friendly ride assistant. Help users book rides, 
answer questions about pricing, drivers, safety, and coverage areas. 
Be concise, warm, and on-brand. Xpool operates in 30+ cities with 100% verified drivers and ~4 min avg pickup.`;

const SUGGESTIONS = [
  "How do I book a ride?",
  "What cities are covered?",
  "How are drivers verified?",
  "Average pickup time?",
];

// ─────────────────────────────────────────────────────────────────────────────
// API Call — direct to Anthropic (no proxy needed)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchReply(messages: Message[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "I'm sorry, I couldn't process that.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Hook: useChat  (no localStorage — not supported in this env)
// ─────────────────────────────────────────────────────────────────────────────

function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always keep a ref in sync so async callbacks read fresh state
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, retryId?: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      // Remove failed message on retry
      if (retryId) {
        setMessages((prev) => prev.filter((m) => m.id !== retryId));
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
        status: "sending",
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        // Use ref so we always pass the latest history
        const history = messagesRef.current;
        // Build the conversation list to send (include the new user message)
        const toSend: Message[] = retryId
          ? [...history, userMsg]
          : [...history]; // userMsg is already appended via setMessages above,
        // but messagesRef hasn't updated yet, so add manually
        // Actually messagesRef is stale here (set happens asynchronously),
        // so build the list explicitly:
        const previousMsgs = messagesRef.current.filter(
          (m) => m.id !== userMsg.id && m.status !== "error"
        );
        const apiMessages: Message[] = [...previousMsgs, userMsg];

        const reply = await fetchReply(apiMessages);

        // Mark user message as sent
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id ? { ...m, status: "sent" } : m
          )
        );

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id ? { ...m, status: "error" } : m
          )
        );
        setError(
          err?.message?.includes("API key")
            ? "API key missing or invalid. Set VITE_ANTHROPIC_API_KEY."
            : "Failed to send message. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(() => {
    if (window.confirm("Clear the entire conversation?")) {
      setMessages([]);
      setError(null);
    }
  }, []);

  const retryMessage = useCallback(
    (messageId: string) => {
      const failedMsg = messagesRef.current.find((m) => m.id === messageId);
      if (failedMsg?.role === "user") {
        sendMessage(failedMsg.content, messageId);
      }
    },
    [sendMessage]
  );

  return { messages, isLoading, error, sendMessage, clearMessages, retryMessage };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ScrollToBottomButton = ({
  onClick,
  isVisible,
}: {
  onClick: () => void;
  isVisible: boolean;
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.button
        className="scroll-bottom-btn"
        onClick={onClick}
        aria-label="Scroll to bottom"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
      >
        <ChevronDown size={18} />
      </motion.button>
    )}
  </AnimatePresence>
);

const TypingIndicator = () => (
  <div className="message-group assistant">
    <div className="typing-bubble">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  </div>
);

const MessageBubble = ({
  message,
  onRetry,
}: {
  message: Message;
  onRetry: (id: string) => void;
}) => {
  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      className={`message-group ${message.role}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <div className={`bubble ${message.role} ${message.status === "error" ? "bubble-error" : ""}`}>
        {message.content}
        {message.status === "error" && (
          <button
            className="retry-btn"
            onClick={() => onRetry(message.id)}
            aria-label="Retry sending message"
            title="Retry"
          >
            <RotateCw size={12} />
          </button>
        )}
      </div>
      <div className="timestamp">
        {timeStr}
        {message.status === "sending" && (
          <span className="msg-status"> · Sending…</span>
        )}
        {message.status === "sent" && (
          <span className="msg-status sent" aria-label="Sent">
            <Check size={10} />
          </span>
        )}
        {message.status === "error" && (
          <span className="msg-status error"> · Failed</span>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Chatbot() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryMessage,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Scroll tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // ── Auto-scroll on new messages ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // ── Unread badge ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") setHasUnread(true);
    }
  }, [messages, isOpen]);

  // ── Focus management ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      // Small delay so the panel animation completes first
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // ── Keyboard handlers ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") setIsOpen(false);
  };

  const handleSend = useCallback(() => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  }, [input, isLoading, sendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Animation variants ───────────────────────────────────────────────────
  const panelVariants = prefersReducedMotion
    ? { hidden: {}, visible: {}, exit: {} }
    : {
      hidden: { opacity: 0, y: 20, scale: 0.95 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      },
      exit: {
        opacity: 0,
        y: 10,
        scale: 0.95,
        transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
      },
    };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ----------------------------------------------
           Professional UI Refresh for Xpool Chatbot
           - Refined color palette (amber with modern neutrals)
           - Improved typography (Inter, system fonts)
           - Softer shadows, consistent border radii
           - Better micro-interactions
        ---------------------------------------------- */

        :root {
          --color-primary: #f59e0b;
          --color-primary-light: #fbbf24;
          --color-primary-lighter: #fde68a;
          --color-primary-dark: #d97706;
          --color-bg-panel: rgba(255, 255, 255, 0.85);
          --color-bg-header: rgba(255, 247, 235, 0.8);
          --color-text: #1f2937;
          --color-text-soft: #6b7280;
          --color-border: rgba(245, 158, 11, 0.2);
          --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          --font-display: 'Syne', var(--font-sans);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* ── Trigger ── */
        .chat-trigger {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          width: 60px;
          height: 60px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #f59e0b, #fbbf24);
          box-shadow: var(--shadow-lg), 0 0 0 2px rgba(255, 255, 255, 0.5) inset;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .chat-trigger:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-xl), 0 0 0 3px rgba(255, 255, 255, 0.6) inset;
        }
        .chat-trigger img {
          width: 36px;
          height: 36px;
          border-radius: 14px;
          object-fit: cover;
        }
        .unread-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* ── Panel ── */
        .chat-panel {
          position: fixed;
          bottom: 104px;
          right: 28px;
          z-index: 9998;
          width: 380px;
          max-height: min(500px, calc(100vh - 120px));
          display: flex;
          flex-direction: column;
          border-radius: 32px;
          overflow: hidden;
          background: var(--color-bg-panel);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          box-shadow: var(--shadow-xl), 0 0 0 1.5px rgba(245, 158, 11, 0.2);
          font-family: var(--font-sans);
          color: var(--color-text);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* ── Header ── */
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          background: var(--color-bg-header);
          border-bottom: 1px solid var(--color-border);
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
          flex-shrink: 0;
        }
        .logo-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .header-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          color: #1f2937;
        }
        .header-title span {
          color: var(--color-primary);
          font-weight: 800;
        }
        .header-status {
          font-size: 0.75rem;
          color: var(--color-text-soft);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
          animation: pulse-dot 2s infinite;
        }
        .header-actions {
          display: flex;
          gap: 6px;
        }
        .icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(245, 158, 11, 0.25);
          background: rgba(255, 255, 255, 0.5);
          color: #b45309;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        .icon-btn:hover {
          background: rgba(251, 191, 36, 0.15);
          border-color: var(--color-primary);
          transform: scale(1.05);
          box-shadow: var(--shadow-sm);
        }
        .icon-btn:active {
          transform: scale(0.95);
        }

        /* ── Messages area ── */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 158, 11, 0.3) transparent;
          background: rgba(255, 255, 255, 0.3);
        }
        .messages-container::-webkit-scrollbar {
          width: 5px;
        }
        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.3);
          border-radius: 20px;
        }

        /* ── Empty state ── */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 24px;
          text-align: center;
        }
        .empty-logo {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          opacity: 0.9;
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.15);
        }
        .empty-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
          color: #1f2937;
        }
        .empty-sub {
          font-size: 0.9rem;
          color: var(--color-text-soft);
          line-height: 1.6;
          max-width: 260px;
        }
        .suggestion-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 8px;
        }
        .chip {
          padding: 8px 16px;
          border-radius: 40px;
          border: 1.5px solid rgba(245, 158, 11, 0.3);
          background: rgba(255, 255, 255, 0.6);
          color: #b45309;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        .chip:hover {
          background: white;
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        /* ── Bubbles ── */
        .message-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .message-group.user {
          align-items: flex-end;
        }
        .message-group.assistant {
          align-items: flex-start;
        }

        .bubble {
          max-width: 85%;
          padding: 12px 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          word-break: break-word;
          border-radius: 24px;
          position: relative;
          white-space: pre-wrap;
          box-shadow: var(--shadow-sm);
        }
        .bubble.user {
          background: linear-gradient(145deg, #f59e0b, #fbbf24);
          color: #1a0800;
          font-weight: 500;
          border-bottom-right-radius: 8px;
          box-shadow: 0 6px 14px rgba(245, 158, 11, 0.25);
        }
        .bubble.assistant {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          color: #1f2937;
          border: 1.5px solid rgba(245, 158, 11, 0.15);
          border-bottom-left-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .bubble.bubble-error {
          border: 1.5px solid rgba(239, 68, 68, 0.3) !important;
          background: rgba(255, 245, 245, 0.95) !important;
        }

        .retry-btn {
          margin-left: 8px;
          background: none;
          border: none;
          color: #b45309;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 30px;
          transition: background 0.2s;
          vertical-align: middle;
        }
        .retry-btn:hover {
          background: rgba(245, 158, 11, 0.15);
        }

        .timestamp {
          font-size: 0.7rem;
          color: #9ca3af;
          padding: 4px 8px 0;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .msg-status {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .msg-status.sent {
          color: #22c55e;
        }
        .msg-status.error {
          color: #ef4444;
        }

        /* ── Typing indicator ── */
        .typing-bubble {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(245, 158, 11, 0.15);
          border-radius: 28px;
          border-bottom-left-radius: 8px;
          padding: 14px 22px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: var(--shadow-sm);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        /* ── Scroll-to-bottom ── */
        .scroll-bottom-btn {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: white;
          backdrop-filter: blur(5px);
          border: 1.5px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-md);
          transition: all 0.2s;
        }
        .scroll-bottom-btn:hover {
          background: white;
          border-color: #f59e0b;
          transform: scale(1.1);
          box-shadow: var(--shadow-lg);
        }

        /* ── Footer / Input ── */
        .footer {
          padding: 14px 16px 18px;
          border-top: 1px solid var(--color-border);
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        .input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1.5px solid rgba(245, 158, 11, 0.2);
          border-radius: 32px;
          padding: 4px 4px 4px 20px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .input-row:focus-within {
          border-color: #f59e0b;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1f2937;
          padding: 10px 0;
        }
        .chat-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
        .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 30px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #f59e0b, #fbbf24);
          color: #1a0800;
          box-shadow: 0 6px 14px rgba(245, 158, 11, 0.4);
          transition: transform 0.15s, filter 0.15s, opacity 0.15s;
          flex-shrink: 0;
        }
        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .send-btn:not(:disabled):hover {
          filter: brightness(1.05);
          transform: scale(1.05);
        }
        .send-btn:not(:disabled):active {
          transform: scale(0.95);
        }
        .footer-hint {
          font-size: 0.7rem;
          color: #9ca3af;
          text-align: center;
          margin-top: 10px;
          letter-spacing: 0.2px;
        }

        /* ── Error banner ── */
        .error-banner {
          color: #ef4444;
          font-size: 0.85rem;
          text-align: center;
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 40px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          margin: 0 4px;
          backdrop-filter: blur(4px);
        }

        /* ── Character counter ── */
        .char-counter {
          font-size: 0.7rem;
          color: #d1d5db;
          flex-shrink: 0;
          padding-right: 4px;
        }
        .char-counter.near-limit {
          color: #f59e0b;
        }
        .char-counter.at-limit {
          color: #ef4444;
        }

        /* ── Responsive ── */
        @media (max-height: 700px) {
          .chat-panel {
            max-height: calc(100vh - 100px);
            bottom: 80px;
          }
        }
        @media (max-width: 480px) {
          .chat-panel {
            width: calc(100vw - 32px);
            right: 16px;
            bottom: 96px;
            max-height: calc(100vh - 120px);
          }
          .chat-trigger {
            right: 20px;
            bottom: 20px;
          }
        }

        /* ── Keyframes ── */
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.9);
          }
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-6px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        className="chat-trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen ? (
          <X size={24} strokeWidth={2.5} color="#1a0800" />
        ) : (
          <img src="/chatbotlogo.png" alt="Xpool" />
        )}
        {hasUnread && !isOpen && <span className="unread-badge" aria-label="New message" />}
      </button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            className="chat-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Xpool ride assistant chat"
            tabIndex={-1}
            onKeyDown={handlePanelKeyDown}
          >
            {/* Header */}
            <div className="panel-header">
              <div className="header-left">
                <div className="logo-wrapper">
                  <img src="/chatbotlogo.png" alt="Xpool logo" />
                </div>
                <div>
                  <div className="header-title">
                    <span>X</span>pool
                  </div>
                  <div className="header-status">
                    <span className="online-dot" />
                    Online · Ride AI
                  </div>
                </div>
              </div>
              <div className="header-actions">
                {messages.length > 0 && (
                  <motion.button
                    className="icon-btn"
                    onClick={clearMessages}
                    title="Clear conversation"
                    whileTap={{ scale: 0.9 }}
                    aria-label="Clear chat"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                )}
                <motion.button
                  className="icon-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close chat"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container" ref={messagesContainerRef}>
              {messages.length === 0 && !isLoading ? (
                <div className="empty-state">
                  <img src="/chatbotlogo.png" className="empty-logo" alt="" aria-hidden="true" />
                  <div className="empty-title">Ready to ride?</div>
                  <div className="empty-sub">
                    Ask anything about bookings, pricing, driver safety, or coverage.
                  </div>
                  <div className="suggestion-chips">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="chip" onClick={() => sendMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} onRetry={retryMessage} />
                  ))}
                </AnimatePresence>
              )}

              {isLoading && <TypingIndicator />}

              {error && (
                <div className="error-banner" role="alert">
                  ⚠️ {error}
                </div>
              )}

              <div ref={messagesEndRef} />

              {/* Scroll-to-bottom — inside the scrollable container so it stays visible */}
              <ScrollToBottomButton onClick={scrollToBottom} isVisible={showScrollBtn} />
            </div>

            {/* Footer */}
            <div className="footer">
              <div className="input-row">
                <input
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Ask about your ride…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  maxLength={2000}
                  aria-label="Message input"
                />
                {input.length > 1800 && (
                  <span
                    className={`char-counter ${input.length > 1950 ? "at-limit" : "near-limit"}`}
                    aria-live="polite"
                  >
                    {2000 - input.length}
                  </span>
                )}
                <motion.button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  whileTap={!input.trim() || isLoading ? {} : { scale: 0.92 }}
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </motion.button>
              </div>
              <div className="footer-hint">Press Enter to send · Powered by Xpool AI</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}