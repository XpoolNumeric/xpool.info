"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ArrowRight, X, Trash2, ChevronDown } from "lucide-react"

// ─── Replace with your actual logo import ───────────────────────────────────
// import xpoolLogo from "@/assets/xpool-logo.png"
// For demo purposes, using the generated PNG path:
const xpoolLogo = "/chatbotlogo.png"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant"

interface Message {
    id: string
    role: Role
    content: string
    timestamp: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Xpool's friendly ride assistant. Help users book rides, 
answer questions about pricing, drivers, safety, and coverage areas. 
Be concise, warm, and on-brand. Xpool operates in 30+ cities with 100% verified drivers and ~4 min avg pickup.`

const SUGGESTIONS = [
    "How do I book a ride?",
    "What cities are covered?",
    "How are drivers verified?",
    "Average pickup time?",
]

// ─────────────────────────────────────────────────────────────────────────────
// API – DeepSeek Integration
// ─────────────────────────────────────────────────────────────────────────────
async function fetchReply(messages: Message[]): Promise<string> {
    // In production, move this call to a serverless function (e.g., /api/chat)
    // and keep your API key on the server. Do not expose it in the client.
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Use an environment variable; ensure it's set on the server if calling from client.
            // For client-side usage, you must proxy through your own backend.
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "sk-39930d3fc8824f529927994a9c4a67f2"}`,
        },
        body: JSON.stringify({
            model: "deepseek-chat", // or "deepseek-coder" if more appropriate
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            max_tokens: 1000,
        }),
    })

    const data = await res.json()
    // Handle possible errors or missing content
    return data.choices?.[0]?.message?.content ?? "Sorry, something went wrong. Please try again."
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const ChatbotStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    /* ── Trigger button ────────────────────────────────────────────── */
    .xp-trigger {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      width: 60px;
      height: 60px;
      border-radius: 18px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        110deg,
        #f59e0b 0%, #fbbf24 30%,
        #fde68a 50%, #fbbf24 70%,
        #f59e0b 100%
      );
      background-size: 200% auto;
      animation: xp-shimmer 3s linear infinite, xp-ring-pulse 2.8s ease-in-out infinite;
      box-shadow: 0 8px 32px rgba(245,158,11,0.45), 0 1px 0 rgba(255,255,255,0.4) inset;
      transition: transform 0.2s ease, box-shadow 0.2s ease, animation 0s;
    }
    .xp-trigger:hover {
      transform: scale(1.07);
      box-shadow: 0 12px 40px rgba(245,158,11,0.6), 0 1px 0 rgba(255,255,255,0.4) inset;
    }
    .xp-trigger img {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      object-fit: cover;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
    }
    .xp-trigger-unread {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      background: #ef4444;
      border-radius: 50%;
      border: 2.5px solid #fffbeb;
    }

    /* ── Chat panel ────────────────────────────────────────────────── */
    .xp-panel {
      position: fixed;
      bottom: 104px;
      right: 28px;
      z-index: 9998;
      width: 370px;
      max-height: 600px;
      display: flex;
      flex-direction: column;
      border-radius: 24px;
      overflow: hidden;
      background: linear-gradient(160deg, #fffbeb 0%, #fef9e7 60%, #fffdf5 100%);
      box-shadow:
        0 24px 80px rgba(0,0,0,0.14),
        0 0 0 1.5px rgba(245,158,11,0.25),
        0 2px 0 rgba(255,255,255,0.9) inset;
      font-family: 'DM Sans', sans-serif;
    }

    /* dot grid overlay */
    .xp-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: radial-gradient(rgba(245,158,11,0.07) 1px, transparent 1px);
      background-size: 24px 24px;
      z-index: 0;
    }

    /* ── Header ────────────────────────────────────────────────────── */
    .xp-header {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
      border-bottom: 1.5px solid rgba(245,158,11,0.2);
    }
    .xp-header-left { display: flex; align-items: center; gap: 10px; }
    .xp-logo-wrap {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      overflow: visible;
    }
    .xp-logo-wrap img {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      object-fit: cover;
      animation: xp-ring-pulse 2.8s ease-in-out infinite;
      box-shadow: 0 2px 8px rgba(245,158,11,0.3);
    }
    .xp-header-title {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 16px;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .xp-header-title span { color: #f59e0b; }
    .xp-header-sub {
      font-size: 11px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 500;
    }
    .xp-blink {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #22c55e;
      animation: xp-blink 1.6s ease-in-out infinite;
    }
    .xp-header-actions { display: flex; align-items: center; gap: 4px; }
    .xp-icon-btn {
      width: 32px; height: 32px;
      border-radius: 9px;
      border: 1.5px solid rgba(245,158,11,0.18);
      background: rgba(251,191,36,0.07);
      color: #b45309;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }
    .xp-icon-btn:hover {
      background: rgba(251,191,36,0.16);
      border-color: rgba(245,158,11,0.4);
      transform: scale(1.05);
    }

    /* ── Messages area ─────────────────────────────────────────────── */
    .xp-messages {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 280px;
      max-height: 380px;
      scrollbar-width: thin;
      scrollbar-color: rgba(245,158,11,0.2) transparent;
    }
    .xp-messages::-webkit-scrollbar { width: 4px; }
    .xp-messages::-webkit-scrollbar-track { background: transparent; }
    .xp-messages::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.25); border-radius: 4px; }

    /* ── Empty state ───────────────────────────────────────────────── */
    .xp-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 24px 16px;
      text-align: center;
    }
    .xp-empty-logo {
      width: 52px; height: 52px;
      border-radius: 16px;
      object-fit: cover;
      opacity: 0.8;
      box-shadow: 0 4px 16px rgba(245,158,11,0.25);
    }
    .xp-empty-title {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 15px;
      color: #111827;
    }
    .xp-empty-sub {
      font-size: 12.5px;
      color: #6b7280;
      line-height: 1.5;
      max-width: 240px;
    }
    .xp-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      margin-top: 4px;
    }
    .xp-chip {
      padding: 5px 11px;
      border-radius: 20px;
      border: 1.5px solid rgba(245,158,11,0.3);
      background: rgba(251,191,36,0.08);
      color: #b45309;
      font-size: 11.5px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }
    .xp-chip:hover {
      background: rgba(251,191,36,0.2);
      border-color: rgba(245,158,11,0.55);
      color: #92400e;
    }

    /* ── Bubbles ───────────────────────────────────────────────────── */
    .xp-msg-group { display: flex; flex-direction: column; gap: 2px; }
    .xp-msg-group.user { align-items: flex-end; }
    .xp-msg-group.assistant { align-items: flex-start; }

    .xp-bubble {
      max-width: 82%;
      padding: 10px 14px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
      border-radius: 18px;
    }
    .xp-bubble.user {
      background: linear-gradient(
        110deg,
        #f59e0b 0%, #fbbf24 30%,
        #fde68a 50%, #fbbf24 70%,
        #f59e0b 100%
      );
      background-size: 200% auto;
      animation: xp-shimmer 3s linear infinite;
      color: #1a0800;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(245,158,11,0.3), 0 1px 0 rgba(255,255,255,0.4) inset;
      border-bottom-right-radius: 5px;
    }
    .xp-bubble.assistant {
      background: rgba(255,255,255,0.9);
      color: #374151;
      border: 1.5px solid rgba(245,158,11,0.18);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-bottom-left-radius: 5px;
    }
    .xp-timestamp {
      font-size: 10px;
      color: #9ca3af;
      padding: 0 4px;
      font-weight: 500;
    }

    /* ── Typing indicator ──────────────────────────────────────────── */
    .xp-typing-bubble {
      background: rgba(255,255,255,0.9);
      border: 1.5px solid rgba(245,158,11,0.18);
      border-radius: 18px;
      border-bottom-left-radius: 5px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .xp-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #f59e0b;
      animation: xp-bounce 1.2s ease-in-out infinite;
    }
    .xp-dot:nth-child(2) { animation-delay: 0.2s; }
    .xp-dot:nth-child(3) { animation-delay: 0.4s; }

    /* ── Footer / input ────────────────────────────────────────────── */
    .xp-footer {
      position: relative;
      z-index: 1;
      padding: 12px 14px 16px;
      border-top: 1.5px solid rgba(245,158,11,0.15);
      background: rgba(255,253,245,0.95);
    }
    .xp-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.9);
      border: 1.5px solid rgba(245,158,11,0.22);
      border-radius: 16px;
      padding: 4px 4px 4px 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .xp-input-row:focus-within {
      border-color: rgba(245,158,11,0.55);
      box-shadow: 0 0 0 3px rgba(245,158,11,0.1), 0 2px 8px rgba(0,0,0,0.05);
    }
    .xp-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 13.5px;
      font-family: 'DM Sans', sans-serif;
      color: #111827;
      padding: 8px 0;
      font-weight: 500;
    }
    .xp-input::placeholder { color: #9ca3af; font-weight: 400; }
    .xp-send-btn {
      width: 38px; height: 38px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
      background: linear-gradient(
        110deg,
        #f59e0b 0%, #fbbf24 30%,
        #fde68a 50%, #fbbf24 70%,
        #f59e0b 100%
      );
      background-size: 200% auto;
      animation: xp-shimmer 3s linear infinite;
      color: #1a0800;
      box-shadow: 0 4px 14px rgba(245,158,11,0.35), 0 1px 0 rgba(255,255,255,0.4) inset;
    }
    .xp-send-btn:disabled {
      opacity: 0.38;
      cursor: not-allowed;
      animation: none;
      background: #fde68a;
      box-shadow: none;
    }
    .xp-send-btn:not(:disabled):hover {
      filter: brightness(1.07);
      transform: scale(1.06);
      box-shadow: 0 6px 20px rgba(245,158,11,0.5), 0 1px 0 rgba(255,255,255,0.4) inset;
    }
    .xp-footer-hint {
      font-size: 10.5px;
      color: #9ca3af;
      text-align: center;
      margin-top: 7px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    /* ── Eyebrow pill (matches Hero) ────────────────────────────────── */
    .xp-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 8px;
      border-radius: 20px;
      border: 1px solid rgba(245,158,11,0.3);
      background: rgba(251,191,36,0.1);
      color: #b45309;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-family: 'DM Sans', sans-serif;
    }

    /* ── Keyframes ──────────────────────────────────────────────────── */
    @keyframes xp-shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes xp-ring-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
      50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
    }
    @keyframes xp-blink {
      0%, 100% { opacity: 1; } 50% { opacity: 0.25; }
    }
    @keyframes xp-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
      40%           { transform: translateY(-5px); opacity: 1; }
    }
    @keyframes xp-fade-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 420px) {
      .xp-panel { width: calc(100vw - 24px); right: 12px; bottom: 96px; }
      .xp-trigger { right: 16px; bottom: 20px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .xp-trigger, .xp-send-btn, .xp-bubble.user,
      .xp-logo-wrap img, .xp-blink, .xp-dot { animation: none !important; }
    }
  `}</style>
)

// ─────────────────────────────────────────────────────────────────────────────
// Typing Indicator
// ─────────────────────────────────────────────────────────────────────────────
const TypingIndicator = () => (
    <div className="xp-msg-group assistant">
        <div className="xp-typing-bubble">
            <span className="xp-dot" />
            <span className="xp-dot" />
            <span className="xp-dot" />
        </div>
    </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [hasUnread, setHasUnread] = useState(false)
    const prefersReducedMotion = useReducedMotion()
    const endRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    useEffect(() => {
        if (isOpen) {
            setHasUnread(false)
            setTimeout(() => inputRef.current?.focus(), 150)
        }
    }, [isOpen])

    const sendMessage = useCallback(async (text?: string) => {
        const content = (text ?? input).trim()
        if (!content || isLoading) return

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content,
            timestamp: new Date(),
        }
        const updated = [...messages, userMsg]
        setMessages(updated)
        setInput("")
        setIsLoading(true)

        try {
            const reply = await fetchReply(updated)
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: reply, timestamp: new Date() },
            ])
            if (!isOpen) setHasUnread(true)
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: "Couldn't reach the server. Please try again.", timestamp: new Date() },
            ])
        } finally {
            setIsLoading(false)
        }
    }, [input, messages, isLoading, isOpen])

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const panelVariants = prefersReducedMotion ? {} : {
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
    }

    const msgVariants = prefersReducedMotion ? {} : {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
    }

    return (
        <>
            <ChatbotStyles />

            {/* ── Trigger ─────────────────────────────────────────────────── */}
            <button
                className="xp-trigger"
                onClick={() => setIsOpen((v) => !v)}
                aria-label={isOpen ? "Close Xpool chat" : "Open Xpool chat"}
                aria-expanded={isOpen}
            >
                {isOpen ? (
                    <X size={22} color="#1a0800" strokeWidth={2.5} />
                ) : (
                    <img src={xpoolLogo} alt="Xpool" />
                )}
                {hasUnread && !isOpen && <span className="xp-trigger-unread" aria-label="Unread message" />}
            </button>

            {/* ── Panel ───────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="xp-panel"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-label="Xpool ride assistant"
                    >
                        {/* Header */}
                        <div className="xp-header">
                            <div className="xp-header-left">
                                <div className="xp-logo-wrap">
                                    <img src={xpoolLogo} alt="Xpool logo" />
                                </div>
                                <div>
                                    <div className="xp-header-title">
                                        <span>X</span>pool Assistant
                                    </div>
                                    <div className="xp-header-sub">
                                        <span className="xp-blink" />
                                        Online · Ride AI
                                    </div>
                                </div>
                            </div>
                            <div className="xp-header-actions">
                                <div className="xp-pill">
                                    <span className="xp-blink" style={{ width: 5, height: 5 }} />
                                    30+ cities
                                </div>
                                {messages.length > 0 && (
                                    <motion.button
                                        className="xp-icon-btn"
                                        onClick={() => setMessages([])}
                                        title="Clear chat"
                                        whileTap={{ scale: 0.92 }}
                                    >
                                        <Trash2 size={14} strokeWidth={2} />
                                    </motion.button>
                                )}
                                <motion.button
                                    className="xp-icon-btn"
                                    onClick={() => setIsOpen(false)}
                                    title="Close"
                                    whileTap={{ scale: 0.92 }}
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="xp-messages">
                            {messages.length === 0 && !isLoading ? (
                                <div className="xp-empty">
                                    <img src={xpoolLogo} className="xp-empty-logo" alt="Xpool" />
                                    <div className="xp-empty-title">How can I help you ride?</div>
                                    <div className="xp-empty-sub">Ask about bookings, pricing, driver safety, or city coverage.</div>
                                    <div className="xp-chips">
                                        {SUGGESTIONS.map((s) => (
                                            <button key={s} className="xp-chip" onClick={() => sendMessage(s)}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            className={`xp-msg-group ${msg.role}`}
                                            variants={msgVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <div className={`xp-bubble ${msg.role}`}>{msg.content}</div>
                                            <div className="xp-timestamp">{fmt(msg.timestamp)}</div>
                                        </motion.div>
                                    ))}
                                    {isLoading && <TypingIndicator />}
                                </>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Footer */}
                        <div className="xp-footer">
                            <div className="xp-input-row">
                                <input
                                    ref={inputRef}
                                    className="xp-input"
                                    placeholder="Ask about your ride…"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    disabled={isLoading}
                                    maxLength={2000}
                                    aria-label="Message input"
                                />
                                <motion.button
                                    className="xp-send-btn"
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    aria-label="Send message"
                                    whileTap={!input.trim() || isLoading ? {} : { scale: 0.93 }}
                                >
                                    <ArrowRight size={17} strokeWidth={2.5} />
                                </motion.button>
                            </div>
                            <div className="xp-footer-hint">Enter to send · Powered by Xpool AI</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}