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
    // Validate environment variables
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!clientEmail) {
      console.error('GOOGLE_CLIENT_EMAIL environment variable is not set');
      return NextResponse.json({ 
        error: 'Google Sheets configuration error: Client email not configured' 
      }, { status: 500 });
    }

    if (!privateKey) {
      console.error('GOOGLE_PRIVATE_KEY environment variable is not set');
      return NextResponse.json({ 
        error: 'Google Sheets configuration error: Private key not configured' 
      }, { status: 500 });
    }

    if (!spreadsheetId) {
      console.error('GOOGLE_SPREADSHEET_ID environment variable is not set');
      return NextResponse.json({ 
        error: 'Google Sheets configuration error: Spreadsheet ID not configured' 
      }, { status: 500 });
    }

    // Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // Fetch data from the Admin Config sheet
      console.log('Attempting to fetch data from Google Sheets...');
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Admin Config!A:C', // Only need first 3 columns: Branch, Year, Section
      });

      console.log('Google Sheets response received:', {
        hasValues: !!response.data.values,
        rowCount: response.data.values?.length || 0
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        console.error('No data found in Admin Config sheet');
        return NextResponse.json({
          error: 'No data found in Admin Config sheet. Please check the sheet name and data.'
        }, { status: 404 });
      }

      if (rows.length === 1) {
        console.error('Only header row found in Admin Config sheet');
        return NextResponse.json({
          error: 'No data rows found in Admin Config sheet. Please add data after the header row.'
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

      console.log('Processed data:', {
        branches: sortedBranches,
        years: sortedYears,
        sections: sortedSections
      });

      return NextResponse.json({
        branches: sortedBranches,
        years: sortedYears,
        sections: sortedSections
      });

    } catch (sheetError: unknown) {
      console.error('Error reading options from sheet:', sheetError);
      
      const errorMessage = sheetError instanceof Error ? sheetError.message : 'Unknown error';
      console.error('Detailed error:', errorMessage);
      
      // Check for common Google Sheets API errors
      if (errorMessage.includes('Unable to parse range')) {
        return NextResponse.json({
          error: 'Google Sheets range error. Please ensure the "Admin Config" sheet exists with data in columns A, B, and C.',
          details: errorMessage
        }, { status: 500 });
      }
      
      if (errorMessage.includes('not found')) {
        return NextResponse.json({
          error: 'Google Sheets not found. Please check the spreadsheet ID and ensure the sheet is accessible.',
          details: errorMessage
        }, { status: 500 });
      }
      
      if (errorMessage.includes('permission') || errorMessage.includes('access')) {
        return NextResponse.json({
          error: 'Google Sheets access denied. Please check the service account permissions.',
          details: errorMessage
        }, { status: 500 });
      }
      
      return NextResponse.json({
        error: 'Failed to read options from Google Sheets',
        details: errorMessage
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
