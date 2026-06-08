/**
 * Type declarations for the ANBK Computer-Based Test (CBT) Application.
 */

export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",       // Pilihan Ganda (Satu jawaban benar)
  COMPLEX_CHOICE = "COMPLEX_CHOICE",     // Pilihan Ganda Kompleks (Bisa >1 jawaban)
  MATCHING = "MATCHING",                 // Menjodohkan (Grid kecocokan baris & kolom)
  SHORT_ANSWER = "SHORT_ANSWER",         // Isian Singkat
  ESSAY = "ESSAY"                        // Uraian / Essay
}

export interface Choice {
  id: string;
  text: string;
}

export interface MatchingOption {
  id: string;
  text: string;
}

export interface MatchingPair {
  rowId: string;    // ID pernyataan sebelah kiri
  colId: string;    // ID kriteria/jawaban sebelah kanan
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  subject?: string; // Mata Pelajaran (e.g. Asesmen Literasi, Asesmen Numerasi, etc.)
  imageUrl?: string;
  audioUrl?: string; // Optional audio file
  choices?: Choice[]; // Used for SINGLE_CHOICE and COMPLEX_CHOICE
  matchingRows?: MatchingOption[]; // Statements on the left for MATCHING
  matchingCols?: MatchingOption[]; // Columns/answers on the right for MATCHING
  correctAnswer?: string | string[] | MatchingPair[] | string; // Correct answers
  points: number;
}

export interface Participant {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  gender: "L" | "P";
  examCardNumber: string;
  className: string;
}

export interface StudentProgress {
  participantId: string;
  name: string;
  username: string;
  examCardNumber: string;
  className?: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  answeredCount: number;
  status: "Belum Mulai" | "Mengerjakan" | "Pending/Ragu" | "Selesai";
  lastActive: string; // ISO DateTime
  score?: number;
}

export interface ExamSession {
  id: string;
  name: string;
  code: string; // e.g. "GANJIL_2026"
  token: string;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
}

export interface StudentResponse {
  questionId: string;
  answer: string | string[] | MatchingPair[]; // Can be single answer string, multiple choice array, match pairs array
  isDoubtful: boolean; // Ragu-ragu
  savedAt: string;
}

export interface ActiveSession {
  participant: Participant;
  token: string;
  sessionStartTime?: string;
  responses: Record<string, StudentResponse>; // questionId -> response
}
