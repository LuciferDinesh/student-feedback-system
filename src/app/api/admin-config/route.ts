/**
 * API Route: Get Admin Configuration from Google Sheets
 * 
 * This endpoint fetches the admin configuration from Google Sheets every 10 minutes.
 * It reads from a single "Admin Config" sheet to get dynamic questions and subjects.
 * 
 * Admin Sheet Format:
 * Sheet Name: "Admin Config"
 * Columns: Branch | Year | Section | Subject | Teacher | Question1 | Question2 | ... | QuestionN
 * 
 * Route: GET /api/admin-config
 * Query Params: branch, year, section
 * Response: AdminSheetConfig object with subjects and questions filtered by branch/year/section
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { AdminSheetConfig, AdminSubject, Question } from '@/lib/enhanced-data';

/**
 * GET handler for fetching admin configuration
 * 
 * @param request - NextRequest with query parameters for branch, year, section
 * @returns NextResponse with admin configuration data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const year = searchParams.get('year');
    const section = searchParams.get('section');

    // Validate required parameters
    if (!branch || !year || !section) {
      return NextResponse.json({ 
        error: 'Missing required parameters: branch, year, section' 
      }, { status: 400 });
    }

    // Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_ADMIN_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_ADMIN_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const adminSpreadsheetId = process.env.GOOGLE_ADMIN_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;

    if (!adminSpreadsheetId) {
      return NextResponse.json({ 
        error: 'Admin spreadsheet ID not configured' 
      }, { status: 500 });
    }

    // Use single master admin sheet called "Admin Config"
    const sheetName = "Admin Config";

    try {
      // Fetch data from the master admin sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: adminSpreadsheetId,
        range: `${sheetName}!A:ZZ`, // Read all columns
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return NextResponse.json({
          error: `No data found in ${sheetName} sheet`,
          useStaticData: true
        }, { status: 404 });
      }

      // Parse the data
      const headers = rows[0]; // First row contains headers
      const dataRows = rows.slice(1); // Remaining rows contain data

      // Find required columns
      const branchIndex = headers.findIndex(h => h.toLowerCase().includes('branch'));
      const yearIndex = headers.findIndex(h => h.toLowerCase().includes('year'));
      const sectionIndex = headers.findIndex(h => h.toLowerCase().includes('section'));
      const subjectIndex = headers.findIndex(h => h.toLowerCase().includes('subject'));
      const teacherIndex = headers.findIndex(h => h.toLowerCase().includes('teacher'));

      if (branchIndex === -1 || yearIndex === -1 || sectionIndex === -1 || subjectIndex === -1 || teacherIndex === -1) {
        return NextResponse.json({
          error: 'Required columns not found in sheet (Branch, Year, Section, Subject, Teacher)',
          useStaticData: true
        }, { status: 400 });
      }

      // Extract question columns (any column after teacher column)
      const questionColumns: { index: number; id: string; text: string }[] = [];
      headers.forEach((header, index) => {
        if (index > teacherIndex && header && header.trim() !== '') {
          // Generate question ID and use header as question text
          const questionId = `question${questionColumns.length + 1}`;
          questionColumns.push({
            index,
            id: questionId,
            text: header.trim()
          });
        }
      });

      // Parse subjects and questions - filter by branch, year, and section
      const subjects: AdminSubject[] = [];
      
      for (const row of dataRows) {
        // Check if this row matches the requested branch, year, and section
        const rowBranch = row[branchIndex]?.trim();
        const rowYear = row[yearIndex]?.trim();
        const rowSection = row[sectionIndex]?.trim();
        const rowSubject = row[subjectIndex]?.trim();
        const rowTeacher = row[teacherIndex]?.trim();
        
        // Filter by exact match for branch, year, section
        if (rowBranch === branch && rowYear === year && rowSection === section && rowSubject && rowTeacher) {
          const questions: Question[] = questionColumns.map(col => ({
            id: col.id,
            text: col.text,
            type: 'rating' as const, // Default to rating type
            required: true
          }));

          subjects.push({
            subject: rowSubject,
            teacher: rowTeacher,
            questions
          });
        }
      }

      // If no subjects found for this branch/year/section combination
      if (subjects.length === 0) {
        return NextResponse.json({
          error: `No subjects found for ${branch} ${year} Section ${section}`,
          useStaticData: true
        }, { status: 404 });
      }

      // Construct admin configuration
      const adminConfig: AdminSheetConfig = {
        year,
        branch,
        section,
        subjects,
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json(adminConfig, { status: 200 });

    } catch (sheetError: unknown) {
      console.error('Error reading admin sheet:', sheetError);
      
      // If sheet doesn't exist or can't be read, return flag to use static data
      return NextResponse.json({
        error: `Sheet ${sheetName} not found or cannot be accessed`,
        useStaticData: true,
        details: sheetError instanceof Error ? sheetError.message : 'Unknown error'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error in admin-config API:', error);
    
    // Development mode fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using static data');
      return NextResponse.json({
        error: 'Development mode: Using static data',
        useStaticData: true
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch admin configuration',
      useStaticData: true 
    }, { status: 500 });
  }
}
