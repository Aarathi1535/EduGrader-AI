
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationReport } from "../types";

// Initialize with the API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts the MIME type and base64 data from a Data URL
 */
const parseDataUrl = (dataUrl: string) => {
  try {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) throw new Error("Invalid Data URL format");
    
    const header = parts[0];
    const data = parts[1];
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    
    return { mimeType, data };
  } catch (err) {
    console.error("Error parsing data URL:", err);
    return null;
  }
};

export const evaluateAnswerSheet = async (
  qpImages: string[],
  keyImages: string[],
  studentImages: string[]
): Promise<EvaluationReport> => {
  const model = "gemini-3-flash-preview";

  const parts: any[] = [
    {
      text: `You are an expert academic examiner. Your grading must be OBJECTIVE and based on standard educational syllabi.

CORE REQUIREMENTS:
1. IDENTIFY student info (Name, Roll, Subject) from the sheets.
2. EVALUATE every question against the syllabus or provided key.
3. STRICT SYLLABUS ADHERENCE: The "correctAnswer" field must contain the standard, textbook-correct solution. It must NOT change based on what the student wrote. It is an absolute reference.
4. DETAILED GRADING: For each question, provide:
   - studentAnswer: Exact text extracted from student's sheet.
   - correctAnswer: The STRICT syllabus-compliant ideal answer.
   - feedback: Professional critique on why marks were awarded or deducted.
5. PERFORMANCE: Calculate accurate raw scores and percentages.

OUTPUT: Return ONLY a valid JSON object matching the schema. No markdown, no pre-amble.`
    }
  ];

  const addFilesToParts = (urls: string[], label: string) => {
    urls.forEach((url, idx) => {
      const parsed = parseDataUrl(url);
      if (parsed && parsed.data) {
        parts.push({ text: `${label} - Page ${idx + 1}:` });
        parts.push({ 
          inlineData: { 
            mimeType: parsed.mimeType, 
            data: parsed.data 
          } 
        });
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
                subject: { type: Type.STRING },
                class: { type: Type.STRING },
                examName: { type: Type.STRING },
                date: { type: Type.STRING },
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
                  feedback: { type: Type.STRING },
                },
                required: ["questionNumber", "marksObtained", "totalMarks"]
              }
            },
            totalScore: { type: Type.NUMBER },
            maxScore: { type: Type.NUMBER },
            percentage: { type: Type.NUMBER },
            generalFeedback: { type: Type.STRING },
          },
          required: ["studentInfo", "grades", "totalScore", "maxScore", "percentage"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as EvaluationReport;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
