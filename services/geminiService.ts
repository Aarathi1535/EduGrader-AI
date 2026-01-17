import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationReport } from "../types";

// Standard way to access keys in Netlify/Modern environments
const API_KEY = process.env.API_KEY;

const parseDataUrl = (dataUrl: string) => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) throw new Error("Invalid Data URL format");
    const header = parts[0];
    const data = parts[1];
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    return { mimeType, data };
  } catch (err) {
    return null;
  }
};

export const evaluateAnswerSheet = async (
  qpImages: string[],
  keyImages: string[],
  studentImages: string[]
): Promise<EvaluationReport> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set API_KEY in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3-flash-preview";

  const parts: any[] = [
    {
      text: `You are an expert academic examiner. Grade the student sheets against the provided question paper and optional answer key.
      
      STRICT RULES:
      1. ABSOLUTE TRUTH: The 'correctAnswer' field MUST represent the objective textbook/syllabus answer. 
      2. OCR PRECISION: Transcribe handwritten student answers exactly as they appear.
      3. CRITIQUE: Provide actionable feedback for every single answer.
      
      Return ONLY a JSON object.`
    }
  ];

  const addFilesToParts = (urls: string[], label: string) => {
    urls.forEach((url, idx) => {
      const parsed = parseDataUrl(url);
      if (parsed?.data) {
        parts.push({ text: `${label} - Page ${idx + 1}:` });
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
      }
    });
  };

  addFilesToParts(qpImages, "Question Paper");
  addFilesToParts(keyImages, "Answer Key");
  addFilesToParts(studentImages, "Student Answer Sheet");

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rollNumber: { type: Type.STRING },
                subject: { type: Type.STRING }
              },
              required: ["name", "subject"]
            },
            grades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.STRING },
                  studentAnswer: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  marksObtained: { type: Type.NUMBER },
                  totalMarks: { type: Type.NUMBER },
                  feedback: { type: Type.STRING }
                },
                required: ["questionNumber", "marksObtained", "totalMarks"]
              }
            },
            totalScore: { type: Type.NUMBER },
            maxScore: { type: Type.NUMBER },
            percentage: { type: Type.NUMBER },
            generalFeedback: { type: Type.STRING }
          },
          required: ["studentInfo", "grades", "totalScore", "maxScore", "percentage"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Model returned empty response");
    
    return JSON.parse(resultText.trim()) as EvaluationReport;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Evaluation failed: " + (error.message || "Unknown error"));
  }
};