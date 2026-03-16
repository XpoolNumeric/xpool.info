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
  Mic,
  MicOff,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Zap,
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
  feedback?: "up" | "down" | null;
  copied?: boolean;
}

// ─── Language Config ───────────────────────────────────────────────────────

interface LangConfig {
  label: string;
  flag: string;
  greeting: string;
  sub: string;
  placeholder: string;
  suggestions: string[];
  quickReplies: string[];
  promptInstruction: string;
}

const LANGUAGES: Record<string, LangConfig> = {
  en: {
    label: "EN", flag: "🇬🇧",
    greeting: "Hey there! I'm Xpool",
    sub: "Your personal guide to rides, safety, pricing & more. What's up?",
    placeholder: "Ask about rides, pricing, safety…",
    suggestions: ["🚀 How do I book a ride?", "🛡️ How are drivers verified?", "📞 Customer Support?", "📱 When does the app launch?"],
    quickReplies: ["⚡ Safety features", "📍 Where are you?", "📞 Contact support", "💰 Pricing?", "🎁 Any offers?", "🏍️ Become a Captain"],
    promptInstruction: "Always reply in English. Keep it short, catchy, friendly and fun!",
  },
  hi: {
    label: "हिं", flag: "🇮🇳",
    greeting: "नमस्ते! मैं Xpool हूँ 👋",
    sub: "राइड, सेफ्टी, प्राइसिंग – सब कुछ पूछो! मैं यहाँ हूँ 😊",
    placeholder: "राइड, प्राइस, सेफ्टी के बारे में पूछें…",
    suggestions: ["🚀 राइड कैसे बुक करें?", "🛡️ ड्राइवर कैसे वेरीफाई होते हैं?", "📞 कस्टमर सपोर्ट?", "📱 ऐप कब लॉन्च होगा?"],
    quickReplies: ["⚡ सेफ्टी फीचर", "📍 आप कहाँ हैं?", "📞 सपोर्ट", "💰 प्राइसिंग?", "🎁 ऑफर?", "🏍️ कैप्टन बनें"],
    promptInstruction: "हमेशा हिंदी में जवाब दो। छोटा, मज़ेदार, दोस्ताना और कैची जवाब दो!",
  },
  ta: {
    label: "தமி", flag: "🇮🇳",
    greeting: "வணக்கம்! நான் Xpool 👋",
    sub: "ரைடு, பாதுகாப்பு, விலை – எல்லாவற்றையும் கேளுங்கள்! 😊",
    placeholder: "ரைடு, விலை, பாதுகாப்பு பற்றி கேளுங்கள்…",
    suggestions: ["🚀 ரைடு எப்படி பேசுவது?", "🛡️ டிரைவர் எப்படி சரிபார்க்கப்படுகிறார்?", "📞 சப்போர்ட்?", "📱 ஆப் எப்போது?"],
    quickReplies: ["⚡ பாதுகாப்பு", "📍 இருப்பிடம்?", "📞 தொடர்பு", "💰 விலை?", "🎁 ஆஃபர்?", "🏍️ கேப்டன் ஆகுங்கள்"],
    promptInstruction: "எப்போதும் தமிழில் பதில் கொடு. குறுகியதாக, நட்பாக, கவர்ச்சியாக பதில் கொடு!",
  },
  te: {
    label: "తె", flag: "🇮🇳",
    greeting: "నమస్కారం! నేను Xpool 👋",
    sub: "రైడ్, భద్రత, ధర – అన్నీ అడగండి! 😊",
    placeholder: "రైడ్, ధర, భద్రత గురించి అడగండి…",
    suggestions: ["🚀 రైడ్ బుక్ చేయడం ఎలా?", "🛡️ డ్రైవర్లు ఎలా వేరిఫై అవుతారు?", "📞 సపోర్ట్?", "📱 యాప్ ఎప్పుడు?"],
    quickReplies: ["⚡ భద్రత", "📍 మీరు ఎక్కడ?", "📞 సంప్రదించండి", "💰 ధర?", "🎁 ఆఫర్లు?", "🏍️ క్యాప్టెన్ అవ్వండి"],
    promptInstruction: "ఎల్లప్పుడూ తెలుగులో జవాబివ్వు. చిన్నగా, స్నేహపూర్వకంగా, ఆకర్షణీయంగా జవాబివ్వు!",
  },
  fr: {
    label: "FR", flag: "🇫🇷",
    greeting: "Salut ! Je suis Xpool 👋",
    sub: "Votre guide pour les trajets, la sécurité et les tarifs. Je suis là ! 😊",
    placeholder: "Posez une question sur les trajets…",
    suggestions: ["🚀 Comment réserver?", "🛡️ Comment les conducteurs sont-ils vérifiés?", "📞 Support client?", "📱 Lancement de l'app?"],
    quickReplies: ["⚡ Sécurité", "📍 Où êtes-vous?", "📞 Support", "💰 Tarifs?", "🎁 Offres?", "🏍️ Devenir Capitaine"],
    promptInstruction: "Réponds toujours en français. Sois court, sympa, accrocheur et fun!",
  },
  es: {
    label: "ES", flag: "🇪🇸",
    greeting: "¡Hola! Soy Xpool 👋",
    sub: "Tu guía de viajes, seguridad y precios. ¡Pregúntame! 😊",
    placeholder: "Pregunta sobre viajes, precios, seguridad…",
    suggestions: ["🚀 ¿Cómo reservar?", "🛡️ ¿Cómo se verifican los conductores?", "📞 ¿Soporte?", "📱 ¿Cuándo lanza la app?"],
    quickReplies: ["⚡ Seguridad", "📍 ¿Dónde están?", "📞 Soporte", "💰 ¿Precios?", "🎁 ¿Ofertas?", "🏍️ Sé Capitán"],
    promptInstruction: "Responde siempre en español. ¡Sé corto, amigable, pegadizo y divertido!",
  },
  ar: {
    label: "AR", flag: "🇸🇦",
    greeting: "أهلاً! أنا Xpool 👋",
    sub: "دليلك للرحلات والأمان والأسعار. اسألني! 😊",
    placeholder: "اسأل عن الرحلات، الأسعار، الأمان…",
    suggestions: ["🚀 كيف أحجز رحلة؟", "🛡️ كيف يتم التحقق من السائقين؟", "📞 الدعم?", "📱 متى يتم الإطلاق؟"],
    quickReplies: ["⚡ الأمان", "📍 أين أنتم?", "📞 الدعم", "💰 الأسعار?", "🎁 العروض?", "🏍️ كن قائداً"],
    promptInstruction: "رد دائماً بالعربية. كن قصيراً وودوداً وجذاباً وممتعاً!",
  },
  ja: {
    label: "JP", flag: "🇯🇵",
    greeting: "こんにちは！Xpoolです 👋",
    sub: "乗車・安全・料金について何でも聞いてください！😊",
    placeholder: "乗車、料金、安全について質問してください…",
    suggestions: ["🚀 乗車のブック方法?", "🛡️ ドライバーの確認方法?", "📞 サポート?", "📱 アプリのリリース日はいつ?"],
    quickReplies: ["⚡ 安全機能", "📍 どこにいますか?", "📞 サポート", "💰 料金?", "🎁 特典?", "🏍️ キャプテンになる"],
    promptInstruction: "常に日本語で答えてください。短く、親切で、キャッチーで楽しい返答をしてください！",
  },
};

const DEFAULT_LANG = "en";

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API Call
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function fetchGeminiReply(messages: Message[], languageInstruction: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env.local file. Please add your Gemini API key.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const formattedMessages = messages.reduce((acc, m) => {
    const role = m.role === "assistant" ? "model" : "user";
    if (acc.length > 0 && acc[acc.length - 1].role === role) {
      acc[acc.length - 1].parts[0].text += `\n${m.content}`;
    } else {
      acc.push({ role, parts: [{ text: m.content }] });
    }
    return acc;
  }, [] as { role: string; parts: { text: string }[] }[]);

  const systemInstruction = `You are **Xpool** — India's coolest, friendliest, and smartest AI ride assistant! 🚀 You are warm, energetic, witty, and always helpful. You celebrate every question and make the user feel amazing. Use 1-2 friendly emojis per response.

KEY LANGUAGE RULE: ${languageInstruction} Adapt your entire personality, tone, and vocabulary to that language naturally — don't just translate, THINK in that language!

XPOOL FACTS:
- India's #1 ride-pooling & bike taxi app — 30+ cities, Chennai HQ.
- **50K+ happy riders**, **12K+ KYC-verified Captains**, **4.8★ rating**, **99% safety score**, avg pickup in just **5 minutes**!
- Fares up to **50% cheaper** than cabs & autos. App launching on Android & iOS in ~14 days!
- Book → Match with a Captain (see photo, bike no., live location) → Safe verified ride → Pay via UPI/Card/Cash/Wallet → Rate & repeat.
- Features: Quick Booking, Real-Time GPS, Secure In-App Chat/Call, OTP Verification, Transparent Fares, SOS Button, Referral Rewards.
- 24/7 Support: **+91 7904790007** | **xpool.help@gmail.com** — avg response under 2 minutes!

RESPONSE RULES:
- **1-3 sentences MAX** — short, punchy, memorable. No bullet points or lists.
- Use **bold** for key words. Sound like a cool, knowledgeable friend — NOT a corporate bot.
- Always share phone/email when users ask about support or contact.
- Be catchy, upbeat, empathetic, and always end on a positive note!`;

  const payload = {
    systemInstruction: {
      role: "model",
      parts: [{ text: systemInstruction }],
    },
    contents: formattedMessages,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 400,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let replyText = data.candidates[0].content.parts[0].text;

    // Strip any residual markdown formatting EXCEPT bolding (**)
    replyText = replyText.replace(/\*(?!\*)(.*?)\*(?!\*)/g, "$1"); // Strip single asterisks but NOT double
    replyText = replyText.replace(/__(.*?)__/g, "$1");
    replyText = replyText.replace(/^[\*\-]\s+/gm, "");
    replyText = replyText.replace(/#{1,6}\s+/g, "");

    return replyText.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to communicate with AI.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Hook: useChat
// ─────────────────────────────────────────────────────────────────────────────

function useChat(languageInstruction: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, retryId?: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

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
        const previousMsgs = messagesRef.current.filter(
          (m) => m.id !== userMsg.id && m.status !== "error"
        );
        const apiMessages: Message[] = [...previousMsgs, userMsg];
        const reply = await fetchGeminiReply(apiMessages, languageInstruction);

        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? { ...m, status: "sent" } : m))
        );

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
          feedback: null,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? { ...m, status: "error" } : m))
        );
        setError("Failed to send message. Please try again.");
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
      if (failedMsg?.role === "user") sendMessage(failedMsg.content, messageId);
    },
    [sendMessage]
  );

  const setFeedback = useCallback((messageId: string, feedback: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
      )
    );
  }, []);

  const setCopied = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, copied: true } : m))
    );
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, copied: false } : m))
      );
    }, 2000);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryMessage,
    setFeedback,
    setCopied,
  };
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
      <div className="typing-avatar">
        <Sparkles size={10} />
      </div>
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
      <span className="typing-label">Xpool is thinking…</span>
    </div>
  </div>
);

const renderTextWithBold = (text: string) => {
  if (!text) return text;
  // Split on **double star** first, then *single star* — both render as bold
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    return part;
  });
};

const MessageBubble = ({
  message,
  onRetry,
  onFeedback,
  onCopy,
}: {
  message: Message;
  onRetry: (id: string) => void;
  onFeedback: (id: string, f: "up" | "down") => void;
  onCopy: (id: string) => void;
}) => {
  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => onCopy(message.id));
  };

  return (
    <motion.div
      className={`message-group ${message.role}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      {message.role === "assistant" && (
        <div className="assistant-avatar">
          <Sparkles size={12} />
        </div>
      )}

      <div
        className={`bubble ${message.role} ${message.status === "error" ? "bubble-error" : ""
          }`}
      >
        {renderTextWithBold(message.content)}
        {message.status === "error" && (
          <button
            className="retry-btn"
            onClick={() => onRetry(message.id)}
            aria-label="Retry"
            title="Retry"
          >
            <RotateCw size={12} />
          </button>
        )}
      </div>

      <div className="timestamp">
        {timeStr}
        {message.status === "sending" && (
          <span className="msg-status">· Sending…</span>
        )}
        {message.status === "sent" && (
          <span className="msg-status sent" aria-label="Sent">
            <Check size={10} />
          </span>
        )}
        {message.status === "error" && (
          <span className="msg-status error">· Failed</span>
        )}

        {message.role === "assistant" && (
          <span className="msg-actions">
            <button
              className={`msg-action-btn ${message.copied ? "active-green" : ""}`}
              onClick={handleCopy}
              title="Copy"
              aria-label="Copy message"
            >
              {message.copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
            <button
              className={`msg-action-btn ${message.feedback === "up" ? "active-green" : ""}`}
              onClick={() => onFeedback(message.id, "up")}
              title="Helpful"
              aria-label="Mark helpful"
            >
              <ThumbsUp size={11} />
            </button>
            <button
              className={`msg-action-btn ${message.feedback === "down" ? "active-red" : ""}`}
              onClick={() => onFeedback(message.id, "down")}
              title="Not helpful"
              aria-label="Mark not helpful"
            >
              <ThumbsDown size={11} />
            </button>
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Contact info quick bar
const ContactBar = () => (
  <div className="contact-bar">
    <a href="tel:+917904790007" className="contact-pill" title="Call us">
      <Phone size={11} />
      <span>+91 7904790007</span>
    </a>
    <a href="mailto:xpool.help@gmail.com" className="contact-pill" title="Email us">
      <Mail size={12} />
      <span>xpool.help@gmail.com</span>
    </a>
    <span className="contact-pill location" title="Our base">
      <MapPin size={11} />
      <span>Chennai, India</span>
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Chatbot() {
  const [activeLang, setActiveLang] = useState(DEFAULT_LANG);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langConfig = LANGUAGES[activeLang];

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryMessage,
    setFeedback,
    setCopied,
  } = useChat(langConfig.promptInstruction);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showContactBar, setShowContactBar] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const recognitionRef = useRef<any>(null);

  // ── Greeting timeout ─────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setShowGreeting(true), 1000);
    const t2 = setTimeout(() => setShowGreeting(false), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  // ── Unread badge ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant") setHasUnread(true);
    }
  }, [messages, isOpen]);

  // ── Focus management ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // ── Voice input ──────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
      inputRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);

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

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Animation variants ───────────────────────────────────────────────────
  const panelVariants: any = prefersReducedMotion
    ? { hidden: {}, visible: {}, exit: {} }
    : {
      hidden: { opacity: 0, y: 24, scale: 0.94 },
      visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      },
      exit: {
        opacity: 0, y: 12, scale: 0.95,
        transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
      },
    };

  const showQuickReplies = messages.length > 0 && !isLoading;
  const handleLangSelect = (code: string) => { setActiveLang(code); setShowLangMenu(false); };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        /* ── Language Selector ── */
        .lang-wrapper { position: relative; }
        .lang-btn {
          height: 34px; padding: 0 10px; border-radius: 12px;
          border: 1px solid rgba(245,158,11,0.2);
          background: rgba(255,255,255,0.6);
          color: #b45309; cursor: pointer; font-size: 0.78rem; font-weight: 700;
          display: flex; align-items: center; gap: 4px;
          transition: all 0.2s; backdrop-filter: blur(4px);
          font-family: var(--font);
        }
        .lang-btn:hover { background: rgba(251,191,36,0.15); border-color: var(--primary); transform: scale(1.04); }
        .lang-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: white; border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(245,158,11,0.12);
          overflow: hidden; min-width: 140px; z-index: 100;
          animation: lang-pop 0.18s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes lang-pop { from { opacity:0; transform: scale(0.9) translateY(-6px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .lang-option {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; font-size: 0.82rem; font-weight: 600;
          color: #374151; cursor: pointer; transition: background 0.15s;
          font-family: var(--font);
        }
        .lang-option:hover { background: rgba(245,158,11,0.08); color: #92400e; }
        .lang-option.active { background: rgba(245,158,11,0.12); color: #b45309; }
        .lang-flag { font-size: 1rem; }
        
        :root {
          --primary: #f59e0b;
          --primary-light: #fbbf24;
          --primary-lighter: #fde68a;
          --primary-dark: #d97706;
          --primary-glow: rgba(245,158,11,0.35);
          --bg-panel: rgba(255,255,255,0.92);
          --bg-header: rgba(255,251,235,0.95);
          --text: #1f2937;
          --text-soft: #6b7280;
          --border: rgba(245,158,11,0.18);
          --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
          --shadow-md: 0 8px 24px rgba(0,0,0,0.09);
          --shadow-lg: 0 20px 40px rgba(0,0,0,0.12);
          --shadow-xl: 0 28px 60px rgba(0,0,0,0.18);
          --shadow-amber: 0 12px 32px rgba(245,158,11,0.4);
          --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --radius: 28px;
        }

        /* ── Trigger ── */
        .chat-trigger {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          height: 64px;
          width: 64px;
          border-radius: 32px;
          padding: 0 12px;
          border: 0 !important;
          outline: none !important;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%);
          box-shadow: var(--shadow-amber), 0 0 0 3px rgba(255,255,255,0.5) inset;
          transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
          -webkit-tap-highlight-color: transparent;
          overflow: hidden;
        }
        .chat-trigger::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%);
          border-radius: inherit;
        }
        .chat-trigger:not(.chat-open):hover, .chat-trigger.expanded {
          width: 260px;
          padding: 0 20px 0 12px;
          transform: scale(1.04) translateY(-5px);
          box-shadow: 0 18px 40px -5px rgba(245,158,11,0.65), 0 0 0 3px rgba(255,255,255,0.6) inset;
        }
        .chat-trigger.chat-open { width: 64px !important; padding: 0 !important; justify-content: center; }
        .chat-trigger.chat-open:hover {
          transform: scale(1.08) translateY(-4px);
          box-shadow: 0 18px 40px -5px rgba(245,158,11,0.65), 0 0 0 3px rgba(255,255,255,0.6) inset;
        }
        .chat-trigger:active { transform: scale(0.96) translateY(0) !important; }
        .chat-trigger img { width: 40px; height: 40px; border-radius: 16px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0; position: relative; z-index: 1; }
        .chat-greeting-text {
          white-space: nowrap;
          font-family: var(--font);
          font-weight: 700;
          font-size: 0.9rem;
          color: #1a0800;
          margin-left: 14px;
          opacity: 0;
          transform: translateX(12px);
          transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 1px;
        }
        .chat-greeting-text small {
          font-size: 0.7rem; font-weight: 500; opacity: 0.7;
        }
        .chat-trigger:not(.chat-open):hover .chat-greeting-text,
        .chat-trigger.expanded .chat-greeting-text { opacity: 1; transform: translateX(0); }
        .unread-badge {
          position: absolute;
          top: -4px; right: -4px;
          width: 18px; height: 18px;
          background: #ef4444;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(239,68,68,0.4);
          animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes badge-pop { from { transform: scale(0); } to { transform: scale(1); } }

        /* ── Panel ── */
        .chat-panel {
          position: fixed;
          bottom: 108px;
          right: 28px;
          z-index: 9998;
          width: 390px;
          max-height: min(580px, calc(100vh - 124px));
          display: flex;
          flex-direction: column;
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--bg-panel);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          box-shadow: var(--shadow-xl), 0 0 0 1.5px rgba(245,158,11,0.15);
          font-family: var(--font);
          color: var(--text);
          border: 1px solid rgba(255,255,255,0.5);
        }

        /* ── Header ── */
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg-header);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          position: relative;
        }
        .panel-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent);
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .logo-wrapper {
          width: 44px; height: 44px; border-radius: 14px; overflow: hidden;
          box-shadow: 0 4px 14px rgba(245,158,11,0.25);
          flex-shrink: 0; position: relative;
        }
        .logo-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .header-name { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; color: #1f2937; line-height: 1.1; display: flex; align-items: center; }
        .header-name > span:first-child { color: var(--primary); }
        .header-sub { font-size: 0.72rem; color: var(--text-soft); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
        .online-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.25); animation: pulse-dot 2s infinite; }
        .ai-badge {
          font-family: var(--font);
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.05em;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white !important; padding: 2px 6px; border-radius: 6px; margin-left: 6px;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
        }
        .header-actions { display: flex; gap: 6px; }
        .icon-btn {
          width: 34px; height: 34px; border-radius: 12px;
          border: 1px solid rgba(245,158,11,0.2);
          background: rgba(255,255,255,0.6);
          color: #b45309; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; backdrop-filter: blur(4px);
        }
        .icon-btn:hover { background: rgba(251,191,36,0.15); border-color: var(--primary); transform: scale(1.06); box-shadow: var(--shadow-sm); }
        .icon-btn:active { transform: scale(0.94); }

        /* ── Contact bar ── */
        .contact-bar {
          display: flex; gap: 6px; flex-wrap: wrap;
          padding: 8px 16px 6px; flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          background: rgba(255,251,235,0.6);
        }
        .contact-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.7rem; font-weight: 600; color: #92400e;
          background: rgba(251,191,36,0.12); border: 1px solid rgba(245,158,11,0.2);
          padding: 3px 8px; border-radius: 20px; text-decoration: none;
          transition: all 0.18s; cursor: pointer; white-space: nowrap;
        }
        .contact-pill:hover { background: rgba(245,158,11,0.18); border-color: var(--primary); color: #78350f; }
        .contact-pill.location { cursor: default; }

        /* ── Messages area ── */
        .messages-container {
          flex: 1; overflow-y: auto;
          padding: 18px 16px;
          display: flex; flex-direction: column; gap: 14px;
          min-height: 0; position: relative;
          scrollbar-width: thin;
          scrollbar-color: rgba(245,158,11,0.25) transparent;
          background: linear-gradient(180deg, rgba(255,251,235,0.15) 0%, rgba(255,255,255,0.05) 100%);
        }
        .messages-container::-webkit-scrollbar { width: 4px; }
        .messages-container::-webkit-scrollbar-track { background: transparent; }
        .messages-container::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.25); border-radius: 20px; }

        /* ── Empty state ── */
        .empty-state {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 14px;
          padding: 20px; text-align: center;
        }
        .empty-hero {
          width: 76px; height: 76px; border-radius: 24px;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-amber); position: relative;
        }
        .empty-hero img { width: 56px; height: 56px; border-radius: 16px; object-fit: cover; }
        .empty-hero-ring {
          position: absolute; inset: -6px; border-radius: 30px;
          border: 2px dashed rgba(245,158,11,0.3);
          animation: spin-slow 10s linear infinite;
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .empty-greeting {
          font-family: var(--font-display); font-weight: 800;
          font-size: 1.15rem; color: #1f2937;
          line-height: 1.3;
        }
        .empty-greeting span { color: var(--primary); }
        .empty-sub { font-size: 0.85rem; color: var(--text-soft); line-height: 1.6; max-width: 260px; }
        .suggestion-chips { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-top: 4px; }
        .chip {
          padding: 7px 14px; border-radius: 40px;
          border: 1.5px solid rgba(245,158,11,0.25);
          background: rgba(255,255,255,0.7); color: #b45309;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s; backdrop-filter: blur(4px);
        }
        .chip:hover { background: white; border-color: var(--primary); box-shadow: var(--shadow-sm); transform: translateY(-1px); }

        /* ── Quick replies bar ── */
        .quick-replies {
          padding: 10px 14px 0;
          display: flex; gap: 7px; overflow-x: auto;
          scrollbar-width: none; flex-shrink: 0;
        }
        .quick-replies::-webkit-scrollbar { display: none; }
        .quick-reply-chip {
          white-space: nowrap; padding: 6px 13px; border-radius: 40px;
          border: 1.5px solid rgba(245,158,11,0.22);
          background: rgba(255,255,255,0.75); color: #92400e;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s; flex-shrink: 0;
        }
        .quick-reply-chip:hover { background: white; border-color: var(--primary); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

        /* ── Bubbles ── */
        .message-group { display: flex; flex-direction: column; gap: 3px; }
        .message-group.user { align-items: flex-end; }
        .message-group.assistant { align-items: flex-start; }
        .assistant-avatar {
          width: 26px; height: 26px; border-radius: 10px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 4px; flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(245,158,11,0.3);
        }
        .bubble {
          max-width: 85%; padding: 11px 16px;
          font-size: 0.92rem; line-height: 1.55;
          word-break: break-word; border-radius: 22px;
          position: relative; white-space: pre-wrap;
        }
        .bubble.user {
          background: linear-gradient(145deg, #f59e0b, #fbbf24);
          color: #1a0800; font-weight: 500;
          border-bottom-right-radius: 6px;
          box-shadow: 0 6px 18px rgba(245,158,11,0.3);
        }
        .bubble.assistant {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(8px); color: #1f2937;
          border: 1.5px solid rgba(245,158,11,0.12);
          border-bottom-left-radius: 6px;
          box-shadow: var(--shadow-sm);
        }
        .bubble.bubble-error { border: 1.5px solid rgba(239,68,68,0.3) !important; background: rgba(255,245,245,0.97) !important; }
        .retry-btn {
          margin-left: 8px; background: none; border: none; color: #b45309; cursor: pointer;
          display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 30px;
          transition: background 0.2s; vertical-align: middle;
        }
        .retry-btn:hover { background: rgba(245,158,11,0.15); }

        /* ── Timestamp & actions ── */
        .timestamp {
          font-size: 0.68rem; color: #9ca3af; padding: 2px 6px 0;
          font-weight: 500; display: flex; align-items: center; gap: 4px;
          flex-wrap: wrap;
        }
        .msg-status { display: flex; align-items: center; gap: 2px; }
        .msg-status.sent { color: #22c55e; }
        .msg-status.error { color: #ef4444; }
        .msg-actions { display: flex; align-items: center; gap: 3px; margin-left: 4px; }
        .msg-action-btn {
          background: none; border: none; cursor: pointer;
          color: #d1d5db; padding: 3px 5px; border-radius: 7px;
          display: inline-flex; align-items: center;
          transition: all 0.15s;
        }
        .msg-action-btn:hover { color: #9ca3af; background: rgba(0,0,0,0.05); }
        .msg-action-btn.active-green { color: #22c55e; }
        .msg-action-btn.active-red { color: #ef4444; }

        /* ── Typing indicator ── */
        .typing-bubble {
          background: rgba(255,255,255,0.97); backdrop-filter: blur(8px);
          border: 1.5px solid rgba(245,158,11,0.12);
          border-radius: 22px; border-bottom-left-radius: 6px;
          padding: 12px 18px;
          display: flex; align-items: center; gap: 6px;
          box-shadow: var(--shadow-sm);
        }
        .typing-avatar {
          width: 20px; height: 20px; border-radius: 8px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .typing-label {
          font-size: 0.75rem; color: var(--text-soft); margin-left: 4px;
          font-style: italic;
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #f97316); animation: bounce 1.4s infinite ease-in-out; }
        .dot:nth-child(3) { animation-delay: 0.16s; }
        .dot:nth-child(4) { animation-delay: 0.32s; }

        /* ── Scroll-to-bottom ── */
        .scroll-bottom-btn {
          position: absolute; bottom: 14px; right: 14px;
          width: 36px; height: 36px; border-radius: 50%;
          background: white; backdrop-filter: blur(5px);
          border: 1.5px solid rgba(245,158,11,0.25);
          color: #f59e0b; display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: var(--shadow-md); transition: all 0.2s;
        }
        .scroll-bottom-btn:hover { border-color: #f59e0b; transform: scale(1.1); box-shadow: var(--shadow-lg); }

        /* ── Footer / Input ── */
        .footer {
          padding: 10px 14px 14px;
          border-top: 1px solid var(--border);
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px); flex-shrink: 0;
        }
        .input-row {
          display: flex; align-items: center; gap: 5px;
          background: white;
          border: 1.5px solid rgba(245,158,11,0.18);
          border-radius: 30px;
          padding: 4px 4px 4px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .input-row:focus-within { border-color: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,0.1), 0 2px 8px rgba(0,0,0,0.04); }
        .chat-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 0.93rem; font-family: inherit; color: #1f2937; padding: 9px 0;
        }
        .chat-input::placeholder { color: #9ca3af; font-weight: 400; }
        .voice-btn {
          width: 34px; height: 34px; border-radius: 50%;
          border: none; background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #d1d5db; transition: all 0.2s; flex-shrink: 0;
        }
        .voice-btn:hover { color: #f59e0b; background: rgba(245,158,11,0.08); }
        .voice-btn.listening { color: #ef4444; animation: pulse-mic 1.2s infinite; }
        .send-btn {
          width: 42px; height: 42px; border-radius: 28px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, #f97316, #f59e0b, #fbbf24);
          color: #1a0800; box-shadow: 0 6px 16px rgba(245,158,11,0.45);
          transition: transform 0.15s, filter 0.15s, opacity 0.15s; flex-shrink: 0;
        }
        .send-btn:disabled { opacity: 0.38; cursor: not-allowed; box-shadow: none; }
        .send-btn:not(:disabled):hover { filter: brightness(1.06); transform: scale(1.06); }
        .send-btn:not(:disabled):active { transform: scale(0.94); }
        .char-counter { font-size: 0.68rem; color: #d1d5db; flex-shrink: 0; padding-right: 4px; }
        .char-counter.near-limit { color: #f59e0b; }
        .char-counter.at-limit { color: #ef4444; }
        .footer-hint {
          font-size: 0.68rem; color: #9ca3af; text-align: center; margin-top: 7px;
          letter-spacing: 0.15px; display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .footer-hint-dot { width: 3px; height: 3px; border-radius: 50%; background: #d1d5db; }

        /* ── Error banner ── */
        .error-banner {
          color: #ef4444; font-size: 0.83rem; text-align: center;
          padding: 8px 12px;
          background: rgba(239,68,68,0.07); border-radius: 40px;
          border: 1px solid rgba(239,68,68,0.18); margin: 0 4px; backdrop-filter: blur(4px);
        }

        /* ── Responsive ── */
        @media (max-height: 700px) { .chat-panel { max-height: calc(100vh - 104px); bottom: 84px; } }
        @media (max-width: 480px) {
          .chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 100px; max-height: calc(100vh - 116px); }
          .chat-trigger { right: 18px; bottom: 18px; }
        }

        /* ── Keyframes ── */
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes pulse-mic { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        className={`chat-trigger border-0 outline-none ring-0 appearance-none ${isOpen ? "chat-open" : ""} ${!isOpen && showGreeting ? "expanded" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen ? (
          <X size={24} strokeWidth={2.5} color="#1a0800" />
        ) : (
          <>
            <img src="/chatbotlogo.png" alt="Xpool" />
            <span className="chat-greeting-text">
              Hi! I'm Xpool
              <small>Ask me anything about Xpool</small>
            </span>
          </>
        )}
        {hasUnread && !isOpen && <span className="unread-badge" aria-label="New message" />}
      </button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Xpool AI assistant chat"
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
                  <div className="header-name">
                    <span>X</span>pool <span className="ai-badge">AI</span>
                  </div>
                  <div className="header-sub">
                    <span className="online-dot" />
                    Online · Xpool Ride Assistant
                  </div>
                </div>
              </div>
              <div className="header-actions">
                {/* Language selector */}
                <div className="lang-wrapper">
                  <button
                    className="lang-btn"
                    onClick={() => setShowLangMenu(v => !v)}
                    aria-label="Select language"
                    title="Change language"
                  >
                    <span className="lang-flag">{langConfig.flag}</span>
                    {langConfig.label}
                    <ChevronDown size={11} />
                  </button>
                  {showLangMenu && (
                    <div className="lang-menu" role="menu">
                      {Object.entries(LANGUAGES).map(([code, cfg]) => (
                        <div
                          key={code}
                          className={`lang-option ${activeLang === code ? "active" : ""}`}
                          onClick={() => handleLangSelect(code)}
                          role="menuitem"
                        >
                          <span className="lang-flag">{cfg.flag}</span>
                          {cfg.label === code.toUpperCase() ? cfg.label : `${cfg.flag} ${cfg.label}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <motion.button
                  className="icon-btn"
                  onClick={() => setShowContactBar(v => !v)}
                  title="Contact info"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Show contact info"
                >
                  <Phone size={15} />
                </motion.button>
                {messages.length > 0 && (
                  <motion.button
                    className="icon-btn"
                    onClick={clearMessages}
                    title="Clear conversation"
                    whileTap={{ scale: 0.9 }}
                    aria-label="Clear chat"
                  >
                    <Trash2 size={15} />
                  </motion.button>
                )}
                <motion.button
                  className="icon-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close chat"
                >
                  <X size={15} />
                </motion.button>
              </div>
            </div>

            {/* Contact bar (toggled) */}
            <AnimatePresence>
              {showContactBar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ContactBar />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick replies */}
            {showQuickReplies && (
              <div className="quick-replies">
                {langConfig.quickReplies.map((r) => (
                  <button
                    key={r}
                    className="quick-reply-chip"
                    onClick={() => sendMessage(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="messages-container" ref={messagesContainerRef}>
              {messages.length === 0 && !isLoading ? (
                <div className="empty-state">
                  <div className="empty-hero">
                    <img src="/chatbotlogo.png" aria-hidden="true" alt="" />
                    <div className="empty-hero-ring" aria-hidden="true" />
                  </div>
                  <div className="empty-greeting">
                    {langConfig.greeting.split("Xpool")[0]}<span>Xpool</span>{langConfig.greeting.split("Xpool")[1]}
                  </div>
                  <div className="empty-sub">
                    {langConfig.sub}
                  </div>
                  <div className="suggestion-chips">
                    {langConfig.suggestions.map((s) => (
                      <button key={s} className="chip" onClick={() => sendMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onRetry={retryMessage}
                      onFeedback={setFeedback}
                      onCopy={setCopied}
                    />
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

              <ScrollToBottomButton onClick={scrollToBottom} isVisible={showScrollBtn} />
            </div>

            {/* Footer */}
            <div className="footer">
              <div className="input-row">
                <input
                  ref={inputRef}
                  className="chat-input"
                  placeholder={langConfig.placeholder}
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
                  className={`voice-btn ${isListening ? "listening" : ""}`}
                  onClick={toggleVoice}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  title={isListening ? "Stop listening" : "Voice input"}
                  type="button"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </motion.button>
                <motion.button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  whileTap={!input.trim() || isLoading ? {} : { scale: 0.92 }}
                >
                  <ArrowRight size={17} strokeWidth={2.5} />
                </motion.button>
              </div>
              <div className="footer-hint">
                <Zap size={10} color="#f59e0b" />
                Press Enter to send
                <span className="footer-hint-dot" />
                Powered by Xpool AI
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
