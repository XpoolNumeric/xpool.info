import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up Multer for handling file uploads (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");

// Convert multer file buffer to GenerativePart format
function fileToGenerativePart(file) {
  return {
    inlineData: {
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype
    },
  };
}

const systemInstruction = `You are an AI document verification system specialized in Indian Driving Licenses (DL) and Vehicle Registration Certificates (RC).

Your task is to analyze uploaded images (front and back) of documents and perform the following:
1. Extract all visible text using OCR understanding.
2. Identify document type: Driving License, RC Card, or Face recognition/others.
3. Extract structured data:
   For Driving License: Full Name, Date of Birth, DL Number, Issue Date, Expiry Date, Address (if available).
   For RC Card: Owner Name, Vehicle Number, Chassis Number (last 4 digits), Engine Number (last 4 digits), Registration Date, Validity Date, Vehicle Class / Type.
4. Perform validation checks: Format validity, expiry date check, detect missing/blurred fields, fake/tampered content.
5. Cross-check front and back to ensure matching info.
6. Assign a verification status: VERIFIED, SUSPICIOUS, REJECTED.
7. Provide a confidence score from 0 to 100.
8. Output ONLY in JSON format:
{
  "document_type": "",
  "extracted_data": {
    "name": "",
    "dl_number": "",
    "vehicle_number": "",
    "dob": "",
    "expiry_date": ""
  },
  "validation": {
    "number_format_valid": true,
    "not_expired": true,
    "data_consistency": true
  },
  "issues": [],
  "verification_status": "",
  "confidence_score": 0
}

Important Rules:
- Do NOT guess missing values.
- If unclear, mark field as null.
- Be strict in validation.
- Prefer rejection over false verification.
- Output must be clean JSON only (no markdown formatting, no explanation).`;

app.post('/api/verify', upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files.frontImage || !files.backImage) {
      return res.status(400).json({ error: 'Both front and back images are required.' });
    }

    const frontPart = fileToGenerativePart(files.frontImage[0]);
    const backPart = fileToGenerativePart(files.backImage[0]);

    // Use Gemini 1.5 Pro or Flash for multimodal input
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });

    const prompt = "Please analyze these front and back images of a document according to your system instructions and output strictly the requested JSON format.";

    const result = await model.generateContent([prompt, frontPart, backPart]);
    const responseText = result.response.text();

    // Clean up potential markdown formatting (e.g., ```json ... ```)
    let jsonString = responseText.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const jsonResult = JSON.parse(jsonString);

    res.json(jsonResult);
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ 
      error: 'Failed to verify document.',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Verification Backend Server running on http://localhost:${port}`);
});
