import os
file_path = r"c:\Users\ARULPRAKASH\Documents\xpool\xpool\xpool-ride-seamless\src\components\ui\chatbot.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Mic and Copy icons
content = content.replace('Check,', 'Check,\n  Mic,\n  Copy,')

# 2. Add copy to clipboard for assistant messages
bubble_replacement = """      <div className={`bubble ${message.role} ${message.status === "error" ? "bubble-error" : ""}`}>
        {message.content}
        {message.role === "assistant" && (
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(message.content)}
            aria-label="Copy to clipboard"
            title="Copy"
          >
            <Copy size={14} />
          </button>
        )}
        {message.status === "error" && ("""
content = content.replace('      <div className={`bubble ${message.role} ${message.status === "error" ? "bubble-error" : ""}`}>\n        {message.content}\n        {message.status === "error" && (', bubble_replacement)

# 3. Add Voice recognition state
state_replacement = """  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser doesn't support voice input.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const prefersReducedMotion = useReducedMotion();"""
content = content.replace('  const [showScrollBtn, setShowScrollBtn] = useState(false);\n  const prefersReducedMotion = useReducedMotion();', state_replacement)

# 4. Add mic button to footer input row
mic_btn_replacement = """                <motion.button
                  className={`mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? undefined : startListening}
                  title={isListening ? "Listening..." : "Voice Input"}
                  type="button"
                  whileTap={isListening ? {} : { scale: 0.92 }}
                >
                  <Mic size={18} strokeWidth={2.5} />
                </motion.button>
                <motion.button"""
if content.count('                <motion.button') > 0:
    content = content.replace('                <motion.button', mic_btn_replacement, 1)

# 5. Add float animation to trigger, mic button css, and copy btn css
css_replacement = """        .chat-trigger {
          animation: floatTrigger 3s ease-in-out infinite;"""
content = content.replace('        .chat-trigger {', css_replacement, 1)

css_copy_mic = """
        /* ── Voice & Copy Buttons ── */
        .copy-btn {
          position: absolute;
          bottom: -12px;
          right: 4px;
          background: white;
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #b45309;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          opacity: 0;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .bubble.assistant:hover .copy-btn {
          opacity: 1;
          transform: translateY(-4px);
        }
        .copy-btn:hover {
          background: #fffbeb;
          transform: translateY(-6px) scale(1.1) !important;
        }

        .mic-btn {
          width: 44px;
          height: 44px;
          border-radius: 30px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .mic-btn:hover {
          background: rgba(245, 158, 11, 0.2);
        }
        .mic-btn.listening {
          background: #ef4444;
          color: white;
          animation: pulse-mic 1.5s infinite;
        }

        @keyframes pulse-mic {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes floatTrigger {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
"""
content = content.replace('        /* ── Responsive ── */', css_copy_mic + '        /* ── Responsive ── */')

# 6. Smooth scroll logic enhancement in Message bubble
content = content.replace('.logo-wrapper img {', '.logo-wrapper img {\n          transition: transform 0.3s;\n        }\n        .panel-header:hover .logo-wrapper img {\n          transform: scale(1.1);\n        }')

# 7. Add quick replies for more items
content = content.replace(
  '"Average pickup time?",',
  '"Average pickup time?",\n  "Lost an item?",'
)

# Replace mock messages to handle the new quick reply
mock_add = """  if (userContent.includes("lost") || userContent.includes("item")) {
    return "If you've lost an item, please check the 'Ride History' section in your app. You can directly contact your driver for up to 24 hours after your ride.";
  }"""
content = content.replace('  if (userContent.includes("book")) {', mock_add + '\n  if (userContent.includes("book")) {')

# 8. Gradient message background tweak
tweak1 = """        .bubble.user {
          background: linear-gradient(145deg, #f97316, #f59e0b);"""
content = content.replace('        .bubble.user {\n          background: linear-gradient(145deg, #f59e0b, #fbbf24);', tweak1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Success!")
