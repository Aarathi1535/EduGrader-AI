import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationReport } from "../types";

const getApiKey = () => {
  const key = (window as any).process?.env?.API_KEY || (process as any).env?.API_KEY;
  if (!key) {
    console.warn("EduGrade: API_KEY not found in window.process.env or process.env.");
  }
  return key;
};

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
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("Missing API Key. Go to Site Settings > Environment Variables in Netlify and add 'API_KEY'.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const parts: any[] = [
    {
      text: `You are an expert academic examiner. Grade the student sheets against the provided question paper and optional answer key.
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
    if (!resultText) throw new Error("Empty AI response");
    return JSON.parse(resultText.trim()) as EvaluationReport;
  } catch (error: any) {
    throw new Error("Evaluation failed: " + (error.message || "Unknown error"));
  }
};