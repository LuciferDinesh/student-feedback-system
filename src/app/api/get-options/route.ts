/**
 * API Route: Get Available Options from Google Sheets
 * 
 * This endpoint dynamically fetches all available branches, years, and sections
 * from the Google Sheet to populate dropdown options.
 * 
 * Route: GET /api/get-options
 * Response: { branches: string[], years: string[], sections: string[] }
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json({ 
        error: 'Spreadsheet ID not configured' 
      }, { status: 500 });
    }

    try {
      // Fetch data from the Admin Config sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Admin Config!A:C', // Only need first 3 columns: Branch, Year, Section
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return NextResponse.json({
          error: 'No data found in Admin Config sheet'
        }, { status: 404 });
      }

      // Skip header row and extract unique values
      const dataRows = rows.slice(1);
      
      const branches = new Set<string>();
      const years = new Set<string>();
      const sections = new Set<string>();

      for (const row of dataRows) {
        if (row[0]) branches.add(row[0].trim()); // Branch column
        if (row[1]) years.add(row[1].trim());   // Year column
        if (row[2]) sections.add(row[2].trim()); // Section column
      }

      // Convert sets to sorted arrays
      const sortedBranches = Array.from(branches).sort();
      const sortedYears = Array.from(years).sort();
      const sortedSections = Array.from(sections).sort();

      return NextResponse.json({
        branches: sortedBranches,
        years: sortedYears,
        sections: sortedSections
      });

    } catch (sheetError: unknown) {
      console.error('Error reading options from sheet:', sheetError);
      
      return NextResponse.json({
        error: 'Failed to read options from Google Sheets',
        details: sheetError instanceof Error ? sheetError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in get-options API:', error);
    
    return NextResponse.json({
      error: 'Internal server error loading options',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
