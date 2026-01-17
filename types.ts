
export interface StudentInfo {
  name: string;
  rollNumber: string;
  subject: string;
  class: string;
  examName: string;
  date: string;
}

export interface QuestionGrade {
  questionNumber: string;
  studentAnswer: string;
  correctAnswer: string;
  marksObtained: number;
  totalMarks: number;
  feedback: string;
}

export interface EvaluationReport {
  id: string;
  timestamp: number;
  studentInfo: StudentInfo;
  grades: QuestionGrade[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  generalFeedback: string;
}

export interface UploadedFile {
  file: File;
  preview: string;
}
