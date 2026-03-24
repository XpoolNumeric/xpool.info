import { useState, useRef, useEffect, memo } from "react";
import { 
  motion, 
  AnimatePresence, 
  useReducedMotion 
} from "framer-motion";
import { 
  UploadCloud, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  FileText,
  ScanFace,
  ChevronRight,
  Shield,
  Zap,
  MapPin,
  Car,
  Copy,
  Check,
  Download,
  Info,
  RefreshCw,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/ui/navbar";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface VerificationResult {
  document_type: string;
  extracted_data: {
    name?: string | null;
    dl_number?: string | null;
    vehicle_number?: string | null;
    dob?: string | null;
    expiry_date?: string | null;
    issue_date?: string | null;
    chassis_number?: string | null;
    engine_number?: string | null;
    vehicle_class?: string | null;
    blood_group?: string | null;
  };
  validation: {
    number_format_valid: boolean;
    not_expired: boolean;
    data_consistency: boolean;
    no_digital_tampering: boolean;
  };
  issues: string[];
  verification_status: "VERIFIED" | "SUSPICIOUS" | "REJECTED";
  confidence_score: number;
}

type DocType = "DL" | "RC";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Logic & Animation Constants
// ─────────────────────────────────────────────────────────────────────────────
const PULSE_CONFIG = [
  { x: 10, y: 15, size: 240, delay: 0, dur: 3.4, opacity: 0.25 },
  { x: 80, y: 75, size: 200, delay: 0.8, dur: 4.1, opacity: 0.20 },
  { x: 50, y: 50, size: 320, delay: 1.5, dur: 3.8, opacity: 0.15 },
  { x: 85, y: 15, size: 180, delay: 0.3, dur: 5.0, opacity: 0.22 },
  { x: 15, y: 85, size: 220, delay: 2.1, dur: 3.5, opacity: 0.18 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const VerificationStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

    :root {
      --color-amber-50: #fffbeb; --color-amber-100: #fef3c7; --color-amber-200: #fde68a;
      --color-amber-300: #fcd34d; --color-amber-400: #fbbf24; --color-amber-500: #f59e0b;
      --color-amber-600: #d97706; --color-amber-700: #b45309; --color-amber-800: #92400e;
      --color-amber-900: #78350f; 
      --transition-base: 0.2s ease-in-out;
    }

    @keyframes pulse-fade {
      0%, 100% { opacity: 0; } 50% { opacity: 1; }
    }
    
    .pulse-blob {
      animation: pulse-fade ease-in-out infinite;
      will-change: opacity;
    }

    @keyframes shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    
    .cta-shimmer {
      background: linear-gradient(
        110deg,
        var(--color-amber-500) 0%, var(--color-amber-400) 30%,
        var(--color-amber-200) 50%, var(--color-amber-400) 70%,
        var(--color-amber-500) 100%
      );
      background-size: 200% auto;
      animation: shimmer 3s linear infinite;
      color: #1a0800 !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 24px rgba(245,158,11,0.4), 0 1px 0 rgba(255,255,255,0.35) inset;
      transition: filter var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
    }
    .cta-shimmer:hover:not(:disabled) {
      filter: brightness(1.07);
      box-shadow: 0 8px 36px rgba(245,158,11,0.55), 0 1px 0 rgba(255,255,255,0.35) inset;
      transform: translateY(-2px);
    }
    .cta-shimmer:active:not(:disabled) {
      transform: translateY(1px);
    }
    .cta-shimmer:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      animation: none;
      filter: grayscale(0.5);
      transform: none;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(251, 191, 36, 0.4);
      box-shadow: 0 8px 32px rgba(245, 158, 11, 0.08);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.90);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(251, 191, 36, 0.3);
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.05);
      transition: all 0.2s ease;
    }
    .glass-card:hover {
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.1);
      border-color: rgba(251, 191, 36, 0.5);
    }

    .upload-zone {
      border: 2px dashed rgba(245, 158, 11, 0.3);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .upload-zone:hover, .upload-zone.active {
      border-color: rgba(245, 158, 11, 0.8);
      background: rgba(251, 191, 36, 0.08);
      transform: scale(1.02);
    }

    @keyframes blink {
      0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
    }
    .blink-dot { animation: blink 1.6s ease-in-out infinite; }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(245, 158, 11, 0.3);
      border-radius: 999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(245, 158, 11, 0.5); }
    
    .confidence-gauge {
      transition: stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `}</style>
);

const PulseBackground = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {PULSE_CONFIG.map((p, i) => (
        <div
          key={i}
          className="pulse-blob"
          style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, rgba(251,191,36,${p.opacity}) 0%, rgba(245,158,11,${p.opacity * 0.5}) 42%, transparent 70%)`,
            filter: "blur(44px)",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
});
PulseBackground.displayName = "PulseBackground";

// ─────────────────────────────────────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────────────────────────────────────

interface FileUploadCardProps {
  title: string;
  requirement: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

const FileUploadCard = ({ title, requirement, file, onFileSelect, onClear, disabled }: FileUploadCardProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [file]);

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPEG, PNG).",
        variant: "destructive"
      });
      return;
    }
    onFileSelect(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-gray-800 font-sans flex items-center justify-between">
        <span>{title}</span>
        {file && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
            Ready
          </span>
        )}
      </h3>
      <div 
        className={`upload-zone glass-card relative rounded-2xl flex flex-col items-center justify-center p-6 h-56 cursor-pointer overflow-hidden ${isDragActive ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && !disabled && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/jpeg, image/png, image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSetFile(e.target.files[0]);
            }
          }}
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 w-full h-full group"
            >
              <img src={preview} alt={title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-black/60 opacity-0 ${!disabled && 'group-hover:opacity-100'} transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full shadow-lg border-white/40 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled && fileInputRef.current) fileInputRef.current.click();
                  }}
                  disabled={disabled}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Change Image
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-full shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) {
                      onClear();
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                  }}
                  disabled={disabled}
                >
                  <X className="mr-2 h-4 w-4" /> Remove
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="upload-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center gap-3 pointer-events-none"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-amber-200 blur-xl opacity-40 rounded-full scale-150 animate-pulse"></div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 text-amber-600 flex items-center justify-center shadow-inner relative z-10 border border-amber-200/50">
                  <UploadCloud strokeWidth={1.5} size={28} />
                </div>
              </div>
              
              <div>
                <p className="text-[14px] font-bold text-gray-800 leading-tight">Drop your image here</p>
                <p className="text-[12px] text-gray-500 mt-1">or <span className="text-amber-600 font-semibold underline decoration-amber-300 underline-offset-2">browse files</span></p>
              </div>
              
              <div className="mt-2 flex items-center gap-2 bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-100">
                <Info size={14} className="text-amber-600" />
                <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">{requirement}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Result Item Component (For Extracted Data with Copy feature)
// ─────────────────────────────────────────────────────────────────────────────
const DetailItem = ({ label, value }: { label: string, value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0 group">
      <span className="text-sm font-medium text-gray-500 capitalize">{label.replace(/_/g, ' ')}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900 px-2.5 py-1 bg-gray-50/80 rounded-md border border-gray-100">{value}</span>
        <button 
          onClick={handleCopy}
          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Copy"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Confidence Score Gauge
// ─────────────────────────────────────────────────────────────────────────────
const ConfidenceGauge = ({ score }: { score: number }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "#10b981"; // emerald-500
  if (score < 60) color = "#f43f5e"; // rose-500
  else if (score < 85) color = "#f59e0b"; // amber-500

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
        <circle
          className="text-gray-100"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
        <circle
          className="confidence-gauge drop-shadow-sm"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-gray-800 leading-none">{score}</span>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">%</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentVerification() {
  const [docType, setDocType] = useState<DocType>("DL");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  // Loading Steps texts
  const LOADING_STEPS = [
    "Uploading secure transmission...",
    "Enhancing image quality...",
    "Extracting OCR text data...",
    "Cross-referencing formatting...",
    "Checking security holograms...",
    "Finalizing authenticity score..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500); // Change text every 1.5s
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    setFrontFile(null);
    setBackFile(null);
    setResult(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadJSON = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `verification_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleVerify = async () => {
    if (!frontFile || !backFile) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
      }

      const frontBase64 = await fileToBase64(frontFile);
      const backBase64 = await fileToBase64(backFile);

      const baseInstruction = `You are a highly advanced AI anti-fraud and identity verification system specialized strictly in Indian Government Documents. You are trained to detect counterfeits, photoshopped details, and inconsistencies.`;

      const dlInstruction = `${baseInstruction}
Your task is to analyze uploaded images (front and back) of a Driving License (DL) and perform the following:
1. Extract all visible text using OCR.
2. Extract structured data ONLY for Driving License:
   - Name
   - DL Number
   - Date of Birth (dob)
   - Issue Date
   - Expiry Date
   - Blood Group (if visible)
3. Perform validation checks: 
   - Is the DL number standard format (e.g. state code like TN followed by numbers)?
   - Is it currently active (not expired)?
   - Ensure the front and back information match and belong to the same card.
   - Do you see any signs of digital tampering (fonts mismatch, blurry text around names, misaligned fields)?
4. Assign a verification status: VERIFIED, SUSPICIOUS, REJECTED.
5. Provide a confidence score from 0 to 100 based on clarity, contrast, and validity.
6. Check for issues: blurry text, cut-off document, missing fields, suspicious font usage.

Output ONLY strictly valid JSON matching exactly this layout:
{
  "document_type": "Driving License",
  "extracted_data": {
    "name": "", "dl_number": "", "dob": "", "issue_date": "", "expiry_date": "", "blood_group": ""
  },
  "validation": {
    "number_format_valid": true, "not_expired": true, "data_consistency": true, "no_digital_tampering": true
  },
  "issues": [],
  "verification_status": "VERIFIED",
  "confidence_score": 0
}
Rule: Output ONLY the JSON block. No markdown markers, no extra text.`;

      const rcInstruction = `${baseInstruction}
Your task is to analyze uploaded images (front and back) of a Vehicle Registration Certificate (RC) and perform the following:
1. Extract all visible text using OCR.
2. Extract structured data ONLY for Registration Certificate:
   - Name (Owner)
   - Vehicle Number
   - Chassis Number (last 4 digits / full if visible)
   - Engine Number (last 4 digits / full if visible)
   - Vehicle Class / Type
   - Expiry Date / Registration Validity
3. Perform validation checks: 
   - Is the Vehicle Number standard Indian format (e.g. TN-01-AB-1234)?
   - Is the registration currently active (not expired)?
   - Ensure the front and back information match.
   - Look for digital tampering or forged watermarks.
4. Assign a verification status: VERIFIED, SUSPICIOUS, REJECTED.
5. Provide a confidence score from 0 to 100 based on overall quality and valid data.
6. Check for issues: blurry text, missing engine/chassis info, tampering/photoshopped text.

Output ONLY strictly valid JSON matching exactly this layout:
{
  "document_type": "Registration Certificate",
  "extracted_data": {
    "name": "", "vehicle_number": "", "chassis_number": "", "engine_number": "", "vehicle_class": "", "expiry_date": ""
  },
  "validation": {
    "number_format_valid": true, "not_expired": true, "data_consistency": true, "no_digital_tampering": true
  },
  "issues": [],
  "verification_status": "VERIFIED",
  "confidence_score": 0
}
Rule: Output ONLY the JSON block. No markdown markers, no extra text.`;

      const systemInstruction = docType === "DL" ? dlInstruction : rcInstruction;

      const requestBody = {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            parts: [
              { text: `Please perform a deep analysis on the front and back images of this ${docType === "DL" ? "Driving License" : "Vehicle RC Card"} and output ONLY the JSON.` },
              { inline_data: { mime_type: frontFile.type || "image/jpeg", data: frontBase64 } },
              { inline_data: { mime_type: backFile.type || "image/jpeg", data: backBase64 } }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1, // Low temp for more deterministic parsing
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData?.error?.message || JSON.stringify(errData);
        } catch (e) {
          // fallback
        }
        throw new Error(`Gemini API Error: ${errorMsg}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) throw new Error("No response generated by AI");

      const rawJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonResult = JSON.parse(rawJson);
      
      setResult(jsonResult);
      
      if (jsonResult.verification_status === "VERIFIED") {
        toast({
          title: "Verification Successful 🎊",
          description: "Document passed all authenticity checks.",
          variant: "default",
          className: "bg-emerald-500 border-emerald-600 text-white",
        });
      } else if (jsonResult.verification_status === "SUSPICIOUS") {
        toast({
          title: "Review Required ⚠️",
          description: "Our system flagged some inconsistencies.",
          variant: "destructive",
          className: "bg-amber-500 border-amber-600 text-white",
        });
      } else {
        toast({
          title: "Verification Rejected 🚫",
          description: "Document could not be verified. Please try again with clear images.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during analysis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    VERIFIED: "text-emerald-700 bg-emerald-50 border-emerald-200 shadow-emerald-100",
    SUSPICIOUS: "text-amber-700 bg-amber-50 border-amber-300 shadow-amber-100",
    REJECTED: "text-rose-700 bg-rose-50 border-rose-200 shadow-rose-100",
  };

  const StatusIcon = result?.verification_status === "VERIFIED" 
    ? CheckCircle 
    : result?.verification_status === "SUSPICIOUS" 
      ? AlertTriangle 
      : XCircle;

  return (
    <div 
      className="min-h-screen pt-24 pb-16 px-4 relative flex flex-col items-center justify-center overflow-x-hidden"
      style={{
        background: "linear-gradient(160deg, #fffbeb 0%, #fef9e7 45%, #fffdf5 100%)",
        isolation: "isolate",
      }}
    >
      <Navbar />
      <VerificationStyles />
      <PulseBackground />

      {/* Decorative Grids */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: "radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,251,235,0) 0%, rgba(255,251,235,0.7) 100%)",
        }}
      />

      <motion.div 
        className="relative w-full max-w-6xl mx-auto flex flex-col items-center"
        style={{ zIndex: 10 }}
        variants={!prefersReducedMotion ? {
          hidden: {},
          visible: { transition: { staggerChildren: 0.12 } }
        } : {}}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={!prefersReducedMotion ? fadeUp : {}} className="text-center mb-10 w-full max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full border border-amber-300/60 bg-white/80 backdrop-blur-md text-amber-800 shadow-sm transition-all hover:shadow-md hover:bg-white/90 cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-[13px] font-bold tracking-widest uppercase">
              AI-Powered Validation Engine
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-6 font-sans">
            Secure Credential <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700" style={{ paddingBottom: '0.1em' }}>Verification</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Upload high-resolution images of your credentials. Our multi-layer AI will extract, cross-check, and authenticate in seconds.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 w-full items-start">
          
          {/* Left Column: Input Panel */}
          <motion.div 
            className={`flex flex-col gap-6 ${result ? 'lg:col-span-6' : 'lg:col-span-8 lg:col-start-3'} transition-all duration-500`}
            variants={!prefersReducedMotion ? fadeUp : {}}
            layout
          >
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-xl shadow-amber-900/5 border-white/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 shadow-inner border border-amber-100">
                    {docType === "DL" ? <ScanFace strokeWidth={1.5} className="w-6 h-6" /> : <Car strokeWidth={1.5} className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight">Document Type</h2>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">Select what you're submitting</p>
                  </div>
                </div>

                <div className="flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                  <button
                    onClick={() => handleDocTypeChange("DL")}
                    className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      docType === "DL"
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <ScanFace size={16} className={docType === "DL" ? "text-amber-500" : ""} /> License
                  </button>
                  <button
                    onClick={() => handleDocTypeChange("RC")}
                    className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      docType === "RC"
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Car size={16} className={docType === "RC" ? "text-amber-500" : ""} /> RC
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <FileUploadCard 
                  title="Front Side" 
                  requirement={docType === "DL" ? "Show Photo & ID No." : "Show Reg Details"}
                  file={frontFile} 
                  onFileSelect={setFrontFile} 
                  onClear={() => setFrontFile(null)} 
                  disabled={loading}
                />
                <FileUploadCard 
                  title="Back Side"
                  requirement={docType === "DL" ? "Show Barcode / QR" : "Show Engine Info"}
                  file={backFile} 
                  onFileSelect={setBackFile} 
                  onClear={() => setBackFile(null)} 
                  disabled={loading}
                />
              </div>

              {/* Guidelines Box */}
              <div className="mt-8 bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-sm">
                <div className="text-amber-600 mt-0.5"><Zap size={18} /></div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Tips for auto-approval</p>
                  <ul className="text-gray-600 font-medium space-y-1 ml-4 list-disc marker:text-amber-400">
                    <li>Ensure good lighting without harsh glare.</li>
                    <li>Place document on a dark, flat surface.</li>
                    <li>All 4 corners must be visible (no cut-offs).</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                {result ? (
                   <Button 
                    onClick={() => {
                      setFrontFile(null);
                      setBackFile(null);
                      setResult(null);
                    }} 
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 text-base rounded-2xl gap-2 font-bold border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw size={18} /> Validate Another
                  </Button>
                ) : (
                  <Button 
                    onClick={handleVerify} 
                    disabled={!frontFile || !backFile || loading}
                    size="lg"
                    className={`w-full sm:w-auto px-10 py-6 text-base rounded-2xl gap-3 font-bold min-w-[280px] shadow-xl ${(!frontFile || !backFile || loading) ? 'bg-amber-100 text-amber-400' : 'cta-shimmer'}`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={20} strokeWidth={2.5} />
                        Run AI Verification
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Output / Loading Panel */}
          <AnimatePresence mode="popLayout">
            {(result || loading) && (
              <motion.div 
                className="lg:col-span-6 relative flex flex-col h-full min-h-[500px]"
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                layout
              >
                <div className="glass-panel p-6 md:p-8 rounded-3xl h-full flex flex-col relative overflow-hidden shadow-xl shadow-amber-900/5 border-white/60">
                  
                  {loading ? (
                    <motion.div 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-lg z-20 p-8 text-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      <div className="relative mb-8">
                        {/* Scanning animation rings */}
                        <div className="absolute inset-0 rounded-full border-4 border-amber-100 scale-150 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-amber-200 scale-110 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
                        
                        <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center relative z-10 border border-gray-100">
                           <ScanFace size={40} className="text-amber-500 animate-pulse" />
                           <div className="absolute -inset-1 bg-gradient-to-b from-transparent via-amber-400/30 to-transparent top-0 h-full w-full animate-[shimmer_2s_infinite] rounded-full"></div>
                        </div>
                      </div>

                      <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">AI Analysis in Progress</h3>
                      
                      {/* Animated text step */}
                      <AnimatePresence mode="wait">
                        <motion.p 
                          key={loadingStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-base font-bold text-amber-600 h-6"
                        >
                          {LOADING_STEPS[loadingStep]}
                        </motion.p>
                      </AnimatePresence>

                      {/* Progress bar */}
                      <div className="w-full max-w-xs mt-8 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                          initial={{ width: "5%" }}
                          animate={{ width: `${Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 95)}%` }}
                          transition={{ ease: "easeInOut", duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  ) : result ? (
                    <div className="flex flex-col h-full flex-1">
                      {/* Header with Status and Gauge */}
                      <div className={`p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-center sm:justify-between gap-6 border shadow-md ${statusColor[result.verification_status]}`}>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm">
                            <StatusIcon className="w-10 h-10" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Final Status</p>
                            <p className="text-3xl font-black leading-none tracking-tight">{result.verification_status}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center bg-white/50 p-2.5 rounded-2xl shadow-sm backdrop-blur-sm">
                          <ConfidenceGauge score={result.confidence_score} />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
                        <div className="space-y-6">
                          
                          {/* Extracted Data Section */}
                          <section>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-500" /> 
                              {result.document_type || "Extracted Details"}
                            </h3>
                            <div className="glass-card rounded-2xl p-1 overflow-hidden shadow-sm">
                              <div className="bg-white/50 rounded-xl p-5 flex flex-col gap-1.5">
                                {Object.entries(result.extracted_data).reverse().map(([key, value]) => {
                                  if (!value) return null;
                                  return <DetailItem key={key} label={key} value={value} />;
                                })}
                              </div>
                            </div>
                          </section>

                          {/* Validations Section */}
                          <section>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-amber-500" /> 
                              Security Checks
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.entries(result.validation).map(([key, isValid]) => (
                                <div key={key} className="glass-card flex items-center p-4 rounded-xl shadow-sm bg-white/40">
                                  {isValid ? (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 flex-shrink-0">
                                      <CheckCircle className="w-5 h-5" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mr-3 flex-shrink-0">
                                      <XCircle className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 leading-tight capitalize">
                                      {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className={`text-[11px] font-bold uppercase mt-0.5 ${isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {isValid ? 'Passed ✓' : 'Failed ✕'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>

                          {/* Issues Flagged */}
                          {result.issues && result.issues.length > 0 && (
                            <section>
                              <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> 
                                Warning Flags
                              </h3>
                              <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200/60 rounded-xl p-5 shadow-sm">
                                <ul className="list-disc list-outside ml-4 text-sm font-semibold text-rose-700 space-y-2">
                                  {result.issues.map((issue, i) => (
                                    <li key={i} className="pl-1 leading-snug">{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            </section>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-xs font-medium text-gray-400">
                          Verified at {new Date().toLocaleTimeString()}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={downloadJSON}
                          className="text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-full font-bold text-xs gap-1.5"
                        >
                          <Download size={14} /> Download Log
                        </Button>
                      </div>

                    </div>
                  ) : null}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
