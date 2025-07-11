/**
 * Test API Route: Verify Google Sheets Connection
 * 
 * This endpoint tests the basic Google Sheets connection and authentication.
 * Use this to debug connection issues.
 * 
 * Route: GET /api/test-connection
 * Response: Connection status and basic spreadsheet info
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Validate environment variables
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log('Testing Google Sheets connection...');
    console.log('Environment variables check:', {
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      hasSpreadsheetId: !!spreadsheetId,
    });

    if (!clientEmail) {
      return NextResponse.json({ 
        success: false,
        error: 'GOOGLE_CLIENT_EMAIL environment variable is not set' 
      }, { status: 500 });
    }

    if (!privateKey) {
      return NextResponse.json({ 
        success: false,
        error: 'GOOGLE_PRIVATE_KEY environment variable is not set' 
      }, { status: 500 });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ 
        success: false,
        error: 'GOOGLE_SPREADSHEET_ID environment variable is not set' 
      }, { status: 500 });
    }

    // Test Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Test basic spreadsheet access
    console.log('Testing spreadsheet access...');
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    console.log('Spreadsheet accessed successfully');

    // Test reading from Admin Config sheet
    console.log('Testing Admin Config sheet access...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Admin Config!A1:C2', // Just test first few cells
    });

    return NextResponse.json({
      success: true,
      message: 'Google Sheets connection successful',
      spreadsheetTitle: spreadsheetInfo.data.properties?.title,
      sheetCount: spreadsheetInfo.data.sheets?.length || 0,
      adminConfigData: {
        hasData: !!response.data.values,
        rowCount: response.data.values?.length || 0,
        firstRow: response.data.values?.[0] || null
      }
    });

  } catch (error) {
    console.error('Google Sheets connection test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'Google Sheets connection failed',
      details: errorMessage
    }, { status: 500 });
  }
}
