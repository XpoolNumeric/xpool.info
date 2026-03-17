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

// ─────────────────────────────────────────────────────────────────────────────
// Language Auto-Detection Engine
// ─────────────────────────────────────────────────────────────────────────────

interface DetectedLanguage {
  code: string;
  label: string;
  isCodeSwitch: boolean;
  script: "latin" | "devanagari" | "tamil" | "telugu" | "arabic" | "japanese" | "mixed";
  romanized: boolean; // e.g. Tanglish, Hinglish
  confidence: number;
}

// Romanized Indian language word lists for detection
const TANGLISH_MARKERS = [
  "enna", "yenna", "naan", "nee", "avan", "aval", "avanga", "inga", "anga", "enga", "yeppo",
  "eppo", "eppadi", "sollu", "solla", "vandhuttaen", "vandhutten", "po", "va", "da", "di",
  "macha", "machan", "dei", "bro", "akka", "anna", "amma", "appa", "paaru", "paarunga",
  "teriyuma", "teriyathu", "theriyum", "illai", "illa", "ille", "oru", "rendu", "moonu",
  "naalu", "aachu", "aachi", "seri", "sari", "konjam", "romba", "super", "nalla", "kashtam",
  "mudiyala", "mudiyathu", "panna", "pannu", "saapdrom", "saapdurom", "vanga", "vaa", "poo",
  "pogrom", "pogalam", "solren", "sollaen", "sollaen", "vendam", "vendum", "thambi",
  "paavam", "azhaga", "azhagana", "irukkanga", "irukkan", "iruken", "paatha", "paaatha",
  "kelvi", "kekkalam", "kekkanom", "purinju", "purinjutu", "puriyala", "puriyathu",
  "ungalukku", "ungaluku", "enakku", "enaku", "avankitta", "avangkitta", "kitta",
  "kodunga", "kudunga", "edhu", "yedhu", "enthan", "endhan", "nammaku", "namakku",
  "theriuma", "theriyuma", "paapom", "paarpom", "varom", "vaango", "vaanga",
];

const HINGLISH_MARKERS = [
  "kya", "hai", "hain", "nahi", "nahin", "karo", "karna", "kar", "tha", "thi", "the",
  "mujhe", "mujhe", "tumhe", "usse", "isse", "yaar", "bhai", "dost", "acha", "accha",
  "theek", "thik", "sahi", "galat", "samjha", "samjhi", "batao", "bolo", "suno", "dekho",
  "lelo", "dedo", "jaao", "aao", "ruko", "chalo", "hoga", "hogi", "hua", "hui", "wala",
  "wali", "wale", "bohot", "bahut", "thoda", "zyada", "abhi", "pehle", "baad", "phir",
  "kyunki", "isliye", "lekin", "magar", "aur", "ya", "agar", "toh", "to", "matlab",
  "paise", "rupees", "kab", "kaha", "kaisa", "kaisi", "kitna", "kitni", "kaun", "koi",
  "sab", "sabko", "apna", "apni", "apne", "mera", "meri", "mere", "tera", "teri", "tere",
  "unka", "unki", "unke", "inhe", "inko", "yahan", "wahan", "idhar", "udhar",
];

const TENGLISH_MARKERS = [
  "enti", "enthi", "emundi", "emavutundi", "cheppandi", "cheppave", "chusthanu", "chusa",
  "vachadu", "vacchaadu", "velthanu", "velthaanu", "baagundi", "baaguntundi", "nenu",
  "meeru", "mee", "naa", "naaku", "meeku", "vadiki", "aame", "vaallaki", "anni", "chala",
  "chaalavunna", "ekkuva", "takkuva", "ayindi", "avutundi", "cheyyandi", "cheyyi",
  "adugandi", "adugu", "thelusaa", "telusa", "thelusu", "ardham", "ardhamaindi",
  "samajhavara", "okka", "rendu", "moodu", "naalu", "istapaduthaanu", "ishtapaduthaanu",
  "bro", "anna", "akka", "mama", "maama", "manchi", "cheddhu", "pedda", "chinna",
];

const ARABIC_MARKERS = /[\u0600-\u06FF]/;
const DEVANAGARI_MARKERS = /[\u0900-\u097F]/;
const TAMIL_SCRIPT_MARKERS = /[\u0B80-\u0BFF]/;
const TELUGU_SCRIPT_MARKERS = /[\u0C00-\u0C7F]/;
const JAPANESE_MARKERS = /[\u3040-\u30FF\u4E00-\u9FFF]/;

function detectLanguage(text: string): DetectedLanguage {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const totalWords = words.length;

  // Script-based detection (highest confidence)
  if (ARABIC_MARKERS.test(text)) {
    return { code: "ar", label: "Arabic", isCodeSwitch: false, script: "arabic", romanized: false, confidence: 0.99 };
  }
  if (JAPANESE_MARKERS.test(text)) {
    return { code: "ja", label: "Japanese", isCodeSwitch: false, script: "japanese", romanized: false, confidence: 0.99 };
  }
  if (TAMIL_SCRIPT_MARKERS.test(text)) {
    return { code: "ta", label: "Tamil", isCodeSwitch: false, script: "tamil", romanized: false, confidence: 0.99 };
  }
  if (TELUGU_SCRIPT_MARKERS.test(text)) {
    return { code: "te", label: "Telugu", isCodeSwitch: false, script: "telugu", romanized: false, confidence: 0.99 };
  }
  if (DEVANAGARI_MARKERS.test(text)) {
    return { code: "hi", label: "Hindi", isCodeSwitch: false, script: "devanagari", romanized: false, confidence: 0.99 };
  }

  // Romanized detection (Latin script)
  const tanglishHits = words.filter(w => TANGLISH_MARKERS.includes(w)).length;
  const hinglishHits = words.filter(w => HINGLISH_MARKERS.includes(w)).length;
  const tenglishHits = words.filter(w => TENGLISH_MARKERS.includes(w)).length;

  const tanglishScore = tanglishHits / Math.max(totalWords, 1);
  const hinglishScore = hinglishHits / Math.max(totalWords, 1);
  const tenglishScore = tenglishHits / Math.max(totalWords, 1);

  const maxRomanized = Math.max(tanglishScore, hinglishScore, tenglishScore);

  if (maxRomanized >= 0.08) {
    if (tanglishScore >= hinglishScore && tanglishScore >= tenglishScore) {
      return { code: "ta", label: "Tanglish", isCodeSwitch: true, script: "latin", romanized: true, confidence: Math.min(0.95, 0.4 + tanglishScore * 2) };
    }
    if (tenglishScore >= hinglishScore) {
      return { code: "te", label: "Tenglish", isCodeSwitch: true, script: "latin", romanized: true, confidence: Math.min(0.95, 0.4 + tenglishScore * 2) };
    }
    return { code: "hi", label: "Hinglish", isCodeSwitch: true, script: "latin", romanized: true, confidence: Math.min(0.95, 0.4 + hinglishScore * 2) };
  }

  // French detection
  const frenchWords = ["bonjour", "merci", "oui", "non", "comment", "pourquoi", "quand", "où", "votre", "notre", "pour", "avec", "dans", "sur", "vous", "nous", "ils", "elles", "une", "les", "des", "que", "qui", "est", "sont", "avoir", "être", "faire", "aller", "vouloir", "pouvoir", "savoir"];
  const frenchHits = words.filter(w => frenchWords.includes(w)).length;
  if (frenchHits / Math.max(totalWords, 1) > 0.12) {
    return { code: "fr", label: "French", isCodeSwitch: false, script: "latin", romanized: false, confidence: 0.9 };
  }

  // Spanish detection
  const spanishWords = ["hola", "gracias", "sí", "no", "cómo", "por", "qué", "cuándo", "dónde", "para", "con", "en", "sobre", "usted", "nosotros", "ellos", "ellas", "una", "los", "las", "del", "que", "quien", "está", "son", "tener", "ser", "hacer", "ir", "querer", "poder", "saber", "español", "buenos", "días", "tarde", "noche"];
  const spanishHits = words.filter(w => spanishWords.includes(w)).length;
  if (spanishHits / Math.max(totalWords, 1) > 0.12) {
    return { code: "es", label: "Spanish", isCodeSwitch: false, script: "latin", romanized: false, confidence: 0.9 };
  }

  // Default to English
  return { code: "en", label: "English", isCodeSwitch: false, script: "latin", romanized: false, confidence: 0.85 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Language Config
// ─────────────────────────────────────────────────────────────────────────────

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
// Build dynamic language instruction from detection result
// ─────────────────────────────────────────────────────────────────────────────

function buildLanguageInstruction(detected: DetectedLanguage, manualLang: string): string {
  // If user manually selected a language, always respect that
  if (manualLang !== DEFAULT_LANG) {
    return LANGUAGES[manualLang]?.promptInstruction || LANGUAGES["en"].promptInstruction;
  }

  if (detected.code === "ta" && detected.romanized) {
    return `The user is typing in TANGLISH (Tamil words written in English/Roman script, mixed with English). You MUST reply in Tanglish — use Tamil words written in English letters naturally mixed with English. Example style: "Machan, Xpool la booking romba easy da! Appo app open panni, location set pannu, Captain match aagum — super fast! 🚀". Sound like a Chennai friend texting.`;
  }
  if (detected.code === "hi" && detected.romanized) {
    return `The user is typing in HINGLISH (Hindi words written in Roman/English script, mixed with English). You MUST reply in Hinglish — use Hindi words in Roman script naturally mixed with English. Example style: "Yaar, Xpool pe booking bahut easy hai! App open karo, location set karo, Captain mil jaayega — super fast! 🚀". Sound like a desi friend texting.`;
  }
  if (detected.code === "te" && detected.romanized) {
    return `The user is typing in TENGLISH (Telugu words written in English/Roman script, mixed with English). You MUST reply in Tenglish — use Telugu words in Roman script mixed with English naturally. Example style: "Bro, Xpool lo booking chala easy ga undi! App open cheyyi, location set cheyyi, Captain vasthadu — super fast! 🚀". Sound like a Hyderabadi friend texting.`;
  }
  if (detected.code === "ta") {
    return LANGUAGES["ta"].promptInstruction;
  }
  if (detected.code === "hi") {
    return LANGUAGES["hi"].promptInstruction;
  }
  if (detected.code === "te") {
    return LANGUAGES["te"].promptInstruction;
  }
  if (detected.code === "fr") {
    return LANGUAGES["fr"].promptInstruction;
  }
  if (detected.code === "es") {
    return LANGUAGES["es"].promptInstruction;
  }
  if (detected.code === "ar") {
    return LANGUAGES["ar"].promptInstruction;
  }
  if (detected.code === "ja") {
    return LANGUAGES["ja"].promptInstruction;
  }

  return LANGUAGES["en"].promptInstruction;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API Call — Ultra-trained system prompt
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function fetchGeminiReply(
  messages: Message[],
  languageInstruction: string,
  detectedLang: DetectedLanguage
): Promise<string> {
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

  const codeSwitch = detectedLang.isCodeSwitch
    ? `\n🔁 CODE-SWITCHING ALERT: User is writing in ${detectedLang.label} (romanized mixed language). Mirror their style exactly — reply in the same mixed script style.`
    : "";

  const systemInstruction = `You are **Xpool** — India's coolest, friendliest, smartest, and most helpful AI ride assistant! 🚀 You are warm, energetic, witty, deeply knowledgeable about Xpool, and always make the user feel amazing. Use 1-2 relevant emojis per response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 LANGUAGE & STYLE RULE (HIGHEST PRIORITY):
${languageInstruction}${codeSwitch}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏍️ XPOOL — COMPLETE KNOWLEDGE BASE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 COMPANY OVERVIEW:
- India's #1 ride-pooling & bike taxi platform, headquartered in Chennai, Tamil Nadu
- Operating in 30+ cities across India with rapid expansion plans
- Mission: Make daily commutes affordable, safe, and eco-friendly for every Indian
- Founded by passionate mobility enthusiasts who want to solve urban transport chaos

📊 KEY STATS (memorize these!):
- 50,000+ happy riders and growing daily
- 12,000+ KYC-verified Captains (drivers) onboarded
- 4.8★ average user rating (out of 5)
- 99% safety score — industry-leading
- Average pickup time: just 5 minutes
- Fares up to 50% cheaper than cabs and autos
- App launching on Android & iOS in approximately 14 days

🚀 HOW XPOOL WORKS — STEP BY STEP:
1. Download the Xpool app (Android/iOS — launching soon!)
2. Enter your pickup & drop location
3. Browse available Captains nearby on real-time map
4. Book instantly — see Captain's photo, name, bike number, live location
5. OTP-verified pickup for maximum security
6. Enjoy a safe, verified ride with in-app tracking
7. Pay via UPI / Debit Card / Credit Card / Cash / Wallet
8. Rate your Captain and earn reward points
9. Refer friends → earn Xpool credits on every referral!

🛡️ SAFETY FEATURES (detail every one if asked):
- All Captains undergo strict KYC (Know Your Customer) verification
- Government ID verification (Aadhaar, PAN, DL)
- Background check on criminal records
- Bike and vehicle document verification (RC, insurance, fitness certificate)
- Real-time GPS tracking shared with user and emergency contacts
- SOS Emergency Button — one tap alerts police + emergency contacts with live location
- Secure in-app calling & chatting (phone numbers hidden for privacy)
- OTP-based pickup confirmation — Captain cannot mark ride started without user OTP
- Ride sharing with trusted contacts (live trip sharing via link)
- 24/7 safety monitoring team
- Panic button triggers instant response protocol
- Women safety mode: option to prefer women Captains where available
- Ride recording (audio) available for disputed cases
- Insurance coverage for every ride

💰 PRICING & ECONOMICS:
- Base fare: transparent, no surge pricing during normal hours
- Up to 50% cheaper than OLA/UBER/local autos
- Pool rides save even more — split costs with co-riders
- Dynamic pricing only during extreme peak/rain — always shown upfront
- No hidden charges, no cancellation fee for first cancellation
- Wallet top-up bonuses: add ₹500 get ₹50 extra, add ₹1000 get ₹120 extra
- Referral code: share with friends, earn ₹50 per successful signup
- Frequent rider discounts available after 10 rides/month
- Corporate plans available for offices (bulk booking, GST invoice)
- Student discount: 15% off with valid college ID verification

📱 APP FEATURES (comprehensive list):
- Smart route optimization (shortest + least traffic route)
- Scheduled rides: book up to 7 days in advance
- Favorite locations: save Home, Work, Gym with one tap
- Ride history with detailed receipts (GST-compatible)
- In-app support chat (response < 2 minutes)
- Captain rating system: 5-star with detailed review categories
- Night mode & accessibility features
- Battery-efficient tracking
- Offline booking confirmation SMS backup
- Multi-language UI: English, Tamil, Hindi, Telugu, Kannada, Malayalam

🏍️ BECOMING A CAPTAIN (driver) — COMPLETE GUIDE:
Requirements:
  • Valid Driving License (2-wheeler)
  • Aadhaar Card + PAN Card
  • Bike RC (Registration Certificate)
  • Bike Insurance (valid)
  • Pollution Certificate (PUC)
  • Smartphone with Android 8+ or iOS 12+
  • Minimum age: 18 years
  • Bike: max 10 years old, good condition

Process:
  1. Download Xpool Captain App (coming soon to Play Store)
  2. Fill registration form with documents
  3. KYC verification (usually 24-48 hours)
  4. Attend 1-hour onboarding session (online or offline)
  5. Activate account and start earning immediately!

Earnings:
  • Earn ₹15,000–₹35,000/month working full-time
  • Part-time: ₹5,000–₹12,000/month
  • Weekly payout directly to bank account
  • Performance bonuses for 4.8★+ rating
  • Fuel incentive bonus for completing 5+ rides/day
  • Referral bonus for bringing new Captains

🌆 CITIES (30+):
Chennai (HQ), Mumbai, Delhi, Bangalore, Hyderabad, Pune, Kolkata, Ahmedabad, Jaipur, Lucknow, Chandigarh, Coimbatore, Madurai, Trichy, Salem, Vellore, Tiruppur, Erode, Kochi, Thiruvananthapuram, Visakhapatnam, Vijayawada, Guntur, Nellore, Warangal, Nashik, Nagpur, Surat, Vadodara, Indore, Bhopal + more expanding every month!

📞 CONTACT & SUPPORT:
- Phone: **+91 7904790007** (24/7, response < 2 mins)
- Email: **xpool.help@gmail.com** (response < 30 mins)
- In-app chat: fastest channel, < 2 minute response
- Headquarters: Chennai, Tamil Nadu, India
- Social: @xpoolofficial on Instagram, Twitter, Facebook

❓ COMMON QUESTIONS & BEST ANSWERS:

Q: When is the app launching?
A: Xpool app launches on both Android & iOS in approximately 14 days! Stay tuned — it's going to be epic 🚀

Q: Is it safe to ride with Xpool?
A: Absolutely! Every Captain is KYC-verified with ID check, background verification, and your ride is tracked live. Plus you have an SOS button, OTP pickup, and 24/7 support. 99% safety score! 🛡️

Q: How much cheaper is Xpool vs Ola/Uber?
A: Up to 50% cheaper! A ₹150 Ola ride could be just ₹75 on Xpool. Pooling saves even more — sometimes 60-70% off!

Q: I want to be a Captain / driver. How?
A: You need a valid DL, bike RC+insurance, Aadhaar & PAN. Register on Xpool Captain app, get verified in 24-48 hours, and start earning ₹15k-₹35k/month! 🏍️

Q: What payment methods does Xpool accept?
A: UPI (PhonePe, GPay, Paytm), Debit/Credit cards, Cash, and Xpool Wallet. Super flexible!

Q: What happens if my Captain doesn't arrive?
A: You can cancel for free and instantly rebook. Our support team at +91 7904790007 is there 24/7 if needed.

Q: Does Xpool have a referral program?
A: Yes! Share your referral code, earn ₹50 for every friend who completes their first ride. No limit on referrals! 🎁

Q: I have a complaint about a Captain.
A: Report immediately via in-app support or call +91 7904790007. Every complaint is investigated within 2 hours and Captain may be suspended pending review.

Q: Are rides available at night?
A: Yes! Xpool operates 24/7. Night rides (10 PM - 6 AM) have slightly higher fares but full safety features enabled.

Q: Can I pre-book a ride?
A: Yes! Schedule rides up to 7 days in advance. Perfect for airport trips, early morning commutes, and important appointments.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 RESPONSE RULES (non-negotiable):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **1-3 sentences MAX** — short, punchy, memorable. No bullet lists unless explicitly asked.
2. Use **bold** for key numbers, names, contact info.
3. Sound like a cool, knowledgeable FRIEND — never corporate, never robotic.
4. Always share phone (+91 7904790007) and email (xpool.help@gmail.com) when support/contact is asked.
5. Be catchy, upbeat, empathetic, enthusiastic — end on a positive note.
6. Never make up information. If unsure, direct to support contact.
7. Never compare negatively to competitors. Simply highlight Xpool's strengths.
8. If the question has no clear answer in the knowledge base, guide them to contact support warmly.`;

  const payload = {
    systemInstruction: {
      role: "model",
      parts: [{ text: systemInstruction }],
    },
    contents: formattedMessages,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 450,
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
    replyText = replyText.replace(/\*(?!\*)(.*?)\*(?!\*)/g, "$1");
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
// Custom Hook: useChat — with auto language detection per message
// ─────────────────────────────────────────────────────────────────────────────

function useChat(manualLang: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDetected, setLastDetected] = useState<DetectedLanguage>({ code: "en", label: "English", isCodeSwitch: false, script: "latin", romanized: false, confidence: 0.85 });

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

      // Auto-detect language from this message
      const detected = detectLanguage(trimmed);
      setLastDetected(detected);
      const langInstruction = buildLanguageInstruction(detected, manualLang);

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
        const reply = await fetchGeminiReply(apiMessages, langInstruction, detected);

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
    [isLoading, manualLang]
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
    lastDetected,
    sendMessage,
    clearMessages,
    retryMessage,
    setFeedback,
    setCopied,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (UI unchanged)
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
    lastDetected,
    sendMessage,
    clearMessages,
    retryMessage,
    setFeedback,
    setCopied,
  } = useChat(activeLang);

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

  // Determine active lang config — if manual override or use detected
  const displayLangConfig = langConfig;

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

        /* ── Auto-detect badge ── */
        .auto-detect-badge {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.04em;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; padding: 2px 7px; border-radius: 20px;
          margin-left: 5px; box-shadow: 0 2px 6px rgba(16,185,129,0.35);
          animation: badge-appear 0.3s cubic-bezier(0.34,1.56,0.64,1);
          vertical-align: middle;
        }
        @keyframes badge-appear { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        
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
        @media (max-height: 700px) { 
          .chat-panel { max-height: calc(100dvh - 120px); bottom: 100px; } 
        }
        @media (max-width: 480px) {
          .chat-panel { 
            position: fixed;
            width: calc(100vw - 20px); 
            left: 10px;
            right: 10px; 
            bottom: 110px; 
            height: calc(100dvh - 130px); 
            max-height: 750px; 
            border-radius: 24px;
            margin: 0;
            z-index: 10000;
          }
          .chat-trigger { right: 20px; bottom: 20px; width: 64px; height: 64px; }
          .chat-trigger.chat-open { 
            width: 56px !important; 
            height: 56px !important; 
            bottom: 24px; 
            right: 24px; 
            padding: 0 !important;
            opacity: 0.9;
          }
          .chat-trigger.expanded { width: 240px; }
          .messages-container { padding: 14px 12px; }
          .footer { padding: 8px 10px 10px; }
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
                    <span>X</span>pool
                    <span className="ai-badge">AI</span>
                    {/* Auto-detect indicator — shows when a romanized/code-switched language is detected */}
                    {lastDetected.isCodeSwitch && messages.length > 0 && (
                      <span className="auto-detect-badge" title={`Auto-detected: ${lastDetected.label}`}>
                        🌐 {lastDetected.label}
                      </span>
                    )}
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
                    <span className="lang-flag">{displayLangConfig.flag}</span>
                    {displayLangConfig.label}
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
                {displayLangConfig.quickReplies.map((r) => (
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
                    {displayLangConfig.greeting.split("Xpool")[0]}<span>Xpool</span>{displayLangConfig.greeting.split("Xpool")[1]}
                  </div>
                  <div className="empty-sub">
                    {displayLangConfig.sub}
                  </div>
                  <div className="suggestion-chips">
                    {displayLangConfig.suggestions.map((s) => (
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
                  placeholder={displayLangConfig.placeholder}
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