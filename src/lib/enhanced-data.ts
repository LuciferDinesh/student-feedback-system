/**
 * Enhanced Data Types for Dynamic Question System
 * 
 * This file extends the original data structure to support:
 * - Dynamic questions loaded from Google Sheets
 * - Admin-configurable question sets
 * - Real-time question updates
 */

/**
 * Interface for a single question from admin sheet
 */
export interface Question {
  id: string;          // Unique identifier (question1, question2, etc.)
  text: string;        // Question text (e.g., "How would you rate teaching quality?")
  type: 'rating' | 'text' | 'boolean';  // Question type
  required: boolean;   // Whether this question is mandatory
}

/**
 * Interface for admin-configured subject data
 */
export interface AdminSubject {
  subject: string;     // Subject name
  teacher: string;     // Teacher name
  questions: Question[]; // Array of questions for this subject
}

/**
 * Interface for admin sheet configuration
 * Sheet name format: {Year}_{Branch}_{Section}
 */
export interface AdminSheetConfig {
  year: string;        // e.g., "1st Year"
  branch: string;      // e.g., "CSE"
  section: string;     // e.g., "A", "B", "C"
  subjects: AdminSubject[]; // Array of subjects with questions
  lastUpdated: string; // Timestamp of last update
}

/**
 * Enhanced feedback data structure with dynamic responses
 */
export interface EnhancedFeedbackData {
  branch: string;
  year: string;
  section: string;
  registrationNumber: string;
  subject: string;
  teacher: string;
  responses: { [questionId: string]: string | number | boolean }; // Dynamic responses to questions
  timestamp: string;
}


