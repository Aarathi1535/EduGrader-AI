import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationReport } from "../types.ts";

const getApiKey = () => {
  // Priority: Netlify Environment Variable > Window Shim > Process Env
  const key = (window as any).process?.env?.API_KEY || (process as any).env?.API_KEY;
  return key || null;
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
  
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "API Key Missing: To fix this, log in to your Netlify dashboard, go to 'Site configuration' > 'Environment variables', add a variable named 'API_KEY' with your Gemini API key, and re-deploy your site."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const parts: any[] = [
    {
      text: `You are an expert academic examiner. Grade the student sheets against the provided question paper and optional answer key.
      Instructions:
      1. Identify the student's name and roll number if present.
      2. Evaluate each question response accurately.
      3. Provide constructive feedback for each answer.
      4. If the student answer is missing but a question exists, mark as 0.
      
      Return ONLY a JSON object strictly following the schema.`
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
    if (!resultText) throw new Error("Empty AI response received.");
    return JSON.parse(resultText.trim()) as EvaluationReport;
  } catch (error: any) {
    if (error.message?.includes("403") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid API Key: Please check that your Gemini API key is correct in your Netlify Environment Variables.");
    }
    throw new Error("Evaluation Error: " + (error.message || "An unexpected error occurred during processing."));
  }
};