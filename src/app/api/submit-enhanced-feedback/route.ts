/**
 * API Route: Submit Enhanced Feedback to Google Sheets
 * 
 * This enhanced API handles submission of dynamic feedback responses.
 * It supports both static ratings and dynamic question responses.
 * 
 * Features:
 * - Handles dynamic questions from admin configuration
 * - Stores responses in organized format
 * - Creates sheets with dynamic headers based on questions
 * - Backward compatible with static rating system
 * 
 * Route: POST /api/submit-enhanced-feedback
 * Body: Array of EnhancedFeedbackData objects
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { EnhancedFeedbackData } from '@/lib/enhanced-data';

/**
 * POST handler for enhanced feedback submission
 * 
 * @param request - NextRequest containing enhanced feedback data
 * @returns NextResponse with success/error status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the enhanced feedback data
    const feedbackData: EnhancedFeedbackData[] = await request.json();

    if (!feedbackData || feedbackData.length === 0) {
      return NextResponse.json({ error: 'No feedback data provided' }, { status: 400 });
    }

    // Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Google Spreadsheet ID not configured' }, { status: 500 });
    }

    // Group feedback by branch/year/section for sheet organization
    const groupedFeedback = groupFeedbackBySheet(feedbackData);

    // Process each group
    for (const [sheetKey, feedbackGroup] of Object.entries(groupedFeedback)) {
      await processSheetFeedback(sheets, spreadsheetId, sheetKey, feedbackGroup);
    }

    return NextResponse.json({ 
      message: 'Enhanced feedback submitted successfully',
      sheetsProcessed: Object.keys(groupedFeedback).length 
    }, { status: 200 });

  } catch (error) {
    console.error('Error submitting enhanced feedback:', error);
    
    // Development mode fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Simulating successful submission');
      return NextResponse.json({ 
        message: 'Enhanced feedback submitted successfully (development mode)' 
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Failed to submit enhanced feedback' }, { status: 500 });
  }
}

/**
 * Groups feedback data by sheet (branch_year_section)
 */
function groupFeedbackBySheet(feedbackData: EnhancedFeedbackData[]): { [key: string]: EnhancedFeedbackData[] } {
  return feedbackData.reduce((groups, feedback) => {
    const sheetKey = `${feedback.branch}_${feedback.year}_${feedback.section}`;
    if (!groups[sheetKey]) {
      groups[sheetKey] = [];
    }
    groups[sheetKey].push(feedback);
    return groups;
  }, {} as { [key: string]: EnhancedFeedbackData[] });
}

/**
 * Processes feedback for a specific sheet
 */
async function processSheetFeedback(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetKey: string,
  feedbackGroup: EnhancedFeedbackData[]
) {
  const sheetName = `Responses_${sheetKey}`;
  
  // Get all unique question IDs from the feedback
  const allQuestionIds = new Set<string>();
  feedbackGroup.forEach(feedback => {
    Object.keys(feedback.responses).forEach(questionId => {
      allQuestionIds.add(questionId);
    });
  });

  const questionIds = Array.from(allQuestionIds).sort();

  // Create dynamic headers
  const headers = [
    'Timestamp',
    'Branch',
    'Year', 
    'Section',
    'Subject',
    'Teacher',
    ...questionIds
  ];

  try {
    // Try to create the sheet if it doesn't exist
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add headers to the new sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });
  } catch (error) {
    // Sheet might already exist
    console.log('Sheet might already exist:', error);
  }

  // Prepare data rows
  const rows = feedbackGroup.map(feedback => {
    const row = [
      feedback.timestamp || new Date().toISOString(),
      feedback.branch,
      feedback.year,
      feedback.section,
      feedback.subject,
      feedback.teacher
    ];

    // Add responses in the same order as headers
    questionIds.forEach(questionId => {
      const response = feedback.responses[questionId];
      row.push(response ? String(response) : '');
    });

    return row;
  });

  // Append the feedback data
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:${String.fromCharCode(65 + headers.length - 1)}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: rows,
    },
  });
}
