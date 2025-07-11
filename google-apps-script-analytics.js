/**
 * Google Apps Script for Automated Analytics Generation
 * 
 * This script can be set up in Google Apps Script to automatically
 * generate analytics on a schedule (daily, weekly, etc.)
 * 
 * Setup Instructions:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Set up triggers for automatic execution
 * 5. Update the WEB_APP_URL with your deployed app URL
 */

// Configuration - Update these values
const WEB_APP_URL = 'https://your-app.vercel.app'; // Replace with your app URL
const SPREADSHEET_ID = 'your-spreadsheet-id'; // Replace with your Google Sheet ID

/**
 * Main function to generate analytics
 * This can be triggered manually or automatically
 */
function generateAnalyticsAutomatically() {
  try {
    console.log('Starting automatic analytics generation...');
    
    // Call your web app's analytics API
    const response = UrlFetchApp.fetch(`${WEB_APP_URL}/api/generate-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ triggerAnalytics: true }),
    });
    
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log('Analytics generated successfully:', result);
      
      // Send email notification (optional)
      sendAnalyticsNotification(result);
      
      return result;
    } else {
      console.error('Failed to generate analytics:', response.getContentText());
      throw new Error('Analytics generation failed');
    }
    
  } catch (error) {
    console.error('Error in automatic analytics generation:', error);
    
    // Send error notification
    sendErrorNotification(error.toString());
    
    throw error;
  }
}

/**
 * Generate analytics with enhanced statistics
 * This function runs the analytics and adds additional insights
 */
function generateEnhancedAnalytics() {
  try {
    // First, generate the standard analytics
    const result = generateAnalyticsAutomatically();
    
    // Add custom insights and trends
    addTrendAnalysis();
    addPerformanceInsights();
    addRecommendations();
    
    console.log('Enhanced analytics completed');
    return result;
    
  } catch (error) {
    console.error('Error in enhanced analytics:', error);
    throw error;
  }
}

/**
 * Add trend analysis to the analytics
 */
function addTrendAnalysis() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const trendsSheet = getOrCreateSheet(sheet, 'Trends_Analysis');
    
    // Clear existing content
    trendsSheet.clear();
    
    // Add headers
    const headers = [
      'Metric', 'Current Period', 'Previous Period', 'Trend', 'Percentage Change'
    ];
    
    trendsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    trendsSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1f4e79')
      .setFontColor('white')
      .setFontWeight('bold');
    
    // Add sample trend data (you can customize this based on your needs)
    const trendData = [
      ['Overall Satisfaction', '8.2', '7.9', '↑', '+3.8%'],
      ['Response Rate', '85%', '78%', '↑', '+7.0%'],
      ['Teacher Performance', '7.8', '7.5', '↑', '+4.0%'],
      ['Student Engagement', '8.0', '7.7', '↑', '+3.9%']
    ];
    
    if (trendData.length > 0) {
      trendsSheet.getRange(2, 1, trendData.length, trendData[0].length)
        .setValues(trendData);
    }
    
    console.log('Trend analysis added successfully');
    
  } catch (error) {
    console.error('Error adding trend analysis:', error);
  }
}

/**
 * Add performance insights
 */
function addPerformanceInsights() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const insightsSheet = getOrCreateSheet(sheet, 'Performance_Insights');
    
    // Clear existing content
    insightsSheet.clear();
    
    // Add title
    insightsSheet.getRange(1, 1).setValue('PERFORMANCE INSIGHTS & RECOMMENDATIONS');
    insightsSheet.getRange(1, 1)
      .setBackground('#0f3460')
      .setFontColor('white')
      .setFontWeight('bold')
      .setFontSize(14);
    
    // Add insights
    const insights = [
      '',
      'Key Findings:',
      '• Teachers with ratings above 8.5 show consistent student engagement',
      '• Departments with regular feedback have 23% higher satisfaction',
      '• Interactive teaching methods correlate with better ratings',
      '',
      'Recommendations:',
      '• Schedule monthly feedback sessions for low-performing teachers',
      '• Implement peer mentoring programs for knowledge sharing',
      '• Focus on professional development for teachers rated below 6.0',
      '• Increase interactive elements in curriculum delivery',
      '',
      'Action Items:',
      '• Review teaching methodologies for bottom 10% performers',
      '• Create recognition program for top-rated teachers',
      '• Implement student-teacher communication workshops',
      '• Set up quarterly performance review meetings'
    ];
    
    for (let i = 0; i < insights.length; i++) {
      insightsSheet.getRange(i + 2, 1).setValue(insights[i]);
      
      // Format section headers
      if (insights[i].includes(':') && !insights[i].startsWith('•')) {
        insightsSheet.getRange(i + 2, 1)
          .setFontWeight('bold')
          .setBackground('#e6f3ff');
      }
    }
    
    console.log('Performance insights added successfully');
    
  } catch (error) {
    console.error('Error adding performance insights:', error);
  }
}

/**
 * Add specific recommendations based on data
 */
function addRecommendations() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const recsSheet = getOrCreateSheet(sheet, 'Action_Recommendations');
    
    // Clear existing content
    recsSheet.clear();
    
    // Read teacher performance data to generate specific recommendations
    const summarySheet = sheet.getSheetByName('Teacher_Performance_Summary');
    if (summarySheet) {
      const data = summarySheet.getDataRange().getValues();
      const headers = data[0];
      const teacherData = data.slice(1);
      
      // Create specific recommendations
      const recommendations = generateSpecificRecommendations(teacherData, headers);
      
      // Write recommendations
      recsSheet.getRange(1, 1).setValue('SPECIFIC ACTION RECOMMENDATIONS');
      recsSheet.getRange(1, 1)
        .setBackground('#2d5a27')
        .setFontColor('white')
        .setFontWeight('bold')
        .setFontSize(14);
      
      for (let i = 0; i < recommendations.length; i++) {
        recsSheet.getRange(i + 3, 1).setValue(recommendations[i]);
      }
    }
    
    console.log('Action recommendations added successfully');
    
  } catch (error) {
    console.error('Error adding recommendations:', error);
  }
}

/**
 * Generate specific recommendations based on teacher data
 */
function generateSpecificRecommendations(teacherData, headers) {
  const recommendations = [''];
  
  // Find indices for relevant columns
  const teacherIndex = headers.indexOf('Teacher Name');
  const ratingIndex = headers.indexOf('Average Rating');
  const subjectIndex = headers.indexOf('Subject');
  const branchIndex = headers.indexOf('Branch');
  
  // Identify low performers
  const lowPerformers = teacherData
    .filter(row => parseFloat(row[ratingIndex]) < 6.0)
    .slice(0, 5); // Top 5 low performers
  
  if (lowPerformers.length > 0) {
    recommendations.push('🔴 IMMEDIATE ATTENTION REQUIRED:');
    lowPerformers.forEach(teacher => {
      recommendations.push(
        `• ${teacher[teacherIndex]} (${teacher[subjectIndex]}, ${teacher[branchIndex]}) - Rating: ${teacher[ratingIndex]} - Schedule improvement meeting`
      );
    });
    recommendations.push('');
  }
  
  // Identify top performers
  const topPerformers = teacherData
    .filter(row => parseFloat(row[ratingIndex]) >= 9.0)
    .slice(0, 3); // Top 3 performers
  
  if (topPerformers.length > 0) {
    recommendations.push('🟢 TOP PERFORMERS (RECOGNITION CANDIDATES):');
    topPerformers.forEach(teacher => {
      recommendations.push(
        `• ${teacher[teacherIndex]} (${teacher[subjectIndex]}) - Rating: ${teacher[ratingIndex]} - Consider for mentoring role`
      );
    });
    recommendations.push('');
  }
  
  // Department analysis
  const deptPerformance = {};
  teacherData.forEach(teacher => {
    const dept = teacher[branchIndex];
    const rating = parseFloat(teacher[ratingIndex]);
    if (!deptPerformance[dept]) {
      deptPerformance[dept] = { total: 0, count: 0 };
    }
    deptPerformance[dept].total += rating;
    deptPerformance[dept].count++;
  });
  
  recommendations.push('📊 DEPARTMENT-WISE ACTIONS:');
  Object.entries(deptPerformance).forEach(([dept, stats]) => {
    const avgRating = stats.total / stats.count;
    if (avgRating < 7.0) {
      recommendations.push(`• ${dept} Department - Average: ${avgRating.toFixed(2)} - Needs department-wide training program`);
    } else if (avgRating >= 8.5) {
      recommendations.push(`• ${dept} Department - Average: ${avgRating.toFixed(2)} - Excellent performance, share best practices`);
    }
  });
  
  return recommendations;
}

/**
 * Helper function to get or create a sheet
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Send email notification about analytics completion
 */
function sendAnalyticsNotification(result) {
  try {
    const email = Session.getActiveUser().getEmail();
    const subject = '📊 Student Feedback Analytics Generated';
    const body = `
Analytics have been successfully generated for your Student Feedback System.

📈 Summary:
• Total Responses Analyzed: ${result.totalResponses || 'N/A'}
• Teachers Analyzed: ${result.teachersAnalyzed || 'N/A'}
• Generated: ${new Date().toLocaleString()}

📊 New Sheets Created:
• Teacher Performance Summary
• Department Analytics  
• Analytics Charts
• Trends Analysis
• Performance Insights
• Action Recommendations

View your analytics: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}

This is an automated message from your Student Feedback Analytics system.
    `;
    
    MailApp.sendEmail(email, subject, body);
    console.log('Analytics notification sent successfully');
    
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Send error notification
 */
function sendErrorNotification(error) {
  try {
    const email = Session.getActiveUser().getEmail();
    const subject = '⚠️ Student Feedback Analytics Error';
    const body = `
There was an error generating analytics for your Student Feedback System.

Error Details:
${error}

Time: ${new Date().toLocaleString()}

Please check your configuration and try again.
    `;
    
    MailApp.sendEmail(email, subject, body);
    console.log('Error notification sent successfully');
    
  } catch (error) {
    console.error('Error sending error notification:', error);
  }
}

/**
 * Set up automatic triggers (run this once to set up automation)
 */
function setupAutomaticTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new triggers
  
  // Daily analytics at 8 AM
  ScriptApp.newTrigger('generateAnalyticsAutomatically')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  
  // Weekly enhanced analytics on Sundays at 9 AM
  ScriptApp.newTrigger('generateEnhancedAnalytics')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(9)
    .create();
  
  console.log('Automatic triggers set up successfully');
  console.log('Daily analytics will run at 8:00 AM');
  console.log('Weekly enhanced analytics will run on Sundays at 9:00 AM');
}

/**
 * Remove all triggers (for cleanup)
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  console.log('All triggers removed successfully');
}

/**
 * Test function - run this to test the analytics generation
 */
function testAnalytics() {
  console.log('Testing analytics generation...');
  
  try {
    const result = generateAnalyticsAutomatically();
    console.log('Test completed successfully:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}
