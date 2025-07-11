/**
 * Course End Survey - Enhanced Main Page Component
 * 
 * This is the main page of the course end survey application where students can:
 * 1. Select their branch, year, and section (dynamically loaded from Google Sheets)
 * 2. Answer dynamic questions for each subject (loaded from admin Google Sheets)
 * 3. Submit feedback which gets stored in Google Sheets
 * 
 * Features:
 * - Mobile-first responsive design
 * - Dynamic question loading from admin sheets
 * - Real-time polling (every 10 minutes) for configuration updates
 * - Countdown timer showing time until next update
 * - Form validation (ensures all required questions are answered)
 * - Real-time Google Sheets integration
 * - Success confirmation screen
 * - Loading states and error handling
 */

'use client';

import { useState, useEffect } from 'react';
import { AdminSheetConfig, Question, EnhancedFeedbackData } from '@/lib/enhanced-data';

/**
 * Interface for dynamic options from Google Sheets
 */
interface DynamicOptions {
  branches: string[];
  years: string[];
  sections: string[];
}

/**
 * Interface for feedback data structure for each subject
 */
interface SubjectFeedback {
  branch: string;
  year: string;
  section: string;
  subject: string;
  teacher: string;
  responses: { [questionId: string]: string | number | boolean };
}

/**
 * Main component for the Course End Survey
 * Handles all state management and user interactions
 */
export default function Home() {
  // State for currently selected branch (dynamically loaded from Google Sheets)
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  // State for currently selected year (dynamically loaded from Google Sheets)
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // State for currently selected section (dynamically loaded from Google Sheets)
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  // State for student registration number
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  
  // State for admin configuration loaded from Google Sheets
  const [adminConfig, setAdminConfig] = useState<AdminSheetConfig | null>(null);
  
  // State for all feedback data (responses to questions for each subject)
  const [feedbackData, setFeedbackData] = useState<SubjectFeedback[]>([]);
  
  // State for tracking configuration loading
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  
  // State for tracking form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for showing success confirmation screen
  const [showConfirmation, setShowConfirmation] = useState(false);

  // State for countdown timer (in seconds)
  const [countdownSeconds, setCountdownSeconds] = useState(300); // 5 minutes in seconds
  
  // State for tracking last update time
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // State for dynamic options loaded from Google Sheets
  const [options, setOptions] = useState<DynamicOptions>({
    branches: [],
    years: [],
    sections: []
  });

  // State for loading options
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // State for page visibility to optimize performance
  const [isPageVisible, setIsPageVisible] = useState(true);
  
  // State for options loading error
  const [optionsError, setOptionsError] = useState<string | null>(null);
  
  // State for tracking last options update time
  const [lastOptionsUpdate, setLastOptionsUpdate] = useState<Date | null>(null);

  /**
   * Load dynamic options from Google Sheets
   */
  const loadOptions = async () => {
    setIsLoadingOptions(true);
    setOptionsError(null); // Clear any previous errors
    try {
      const response = await fetch('/api/get-options');
      if (response.ok) {
        const data = await response.json();
        setOptions(data);
        setLastOptionsUpdate(new Date());
      } else {
        const errorText = await response.text();
        console.error('Failed to load options:', response.status, errorText);
        setOptionsError(`Failed to load options from Google Sheets (${response.status})`);
      }
    } catch (error) {
      console.error('Error loading options:', error);
      setOptionsError('Error loading options from Google Sheets');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  /**
   * Load options on component mount and refresh periodically
   */
  useEffect(() => {
    loadOptions();
    
    // Performance optimization: Only poll when page is visible
    const optionsInterval = setInterval(() => {
      if (isPageVisible) {
        loadOptions();
      }
    }, 600000); // 10 minutes
    
    return () => clearInterval(optionsInterval);
  }, [isPageVisible]);

  /**
   * Page visibility optimization to reduce system load when tab is not active
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Load admin configuration from Google Sheets
   */
  const loadAdminConfig = async () => {
    if (!selectedBranch || !selectedYear || !selectedSection) return;
    
    setIsLoadingConfig(true);
    try {
      const response = await fetch(`/api/admin-config?branch=${selectedBranch}&year=${selectedYear}&section=${selectedSection}`);
      if (response.ok) {
        const config = await response.json();
        setAdminConfig(config);
        initializeFeedbackData(config);
        setLastUpdateTime(new Date());
        setCountdownSeconds(600); // Reset countdown to 10 minutes
      } else {
        console.error('Failed to load admin config');
        setAdminConfig(null);
      }
    } catch (error) {
      console.error('Error loading admin config:', error);
      setAdminConfig(null);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  /**
   * Initialize feedback data based on admin configuration
   */
  const initializeFeedbackData = (config: AdminSheetConfig) => {
    const initialFeedback = config.subjects.map(subject => ({
      branch: selectedBranch,
      year: selectedYear,
      section: selectedSection,
      subject: subject.subject,
      teacher: subject.teacher,
      responses: {}
    }));
    setFeedbackData(initialFeedback);
  };

  /**
   * Polling effect to update admin configuration every 10 minutes
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (selectedBranch && selectedYear && selectedSection) {
      // Load initial config
      loadAdminConfig();
      
      // Set up polling interval - reduced frequency to save system resources
      interval = setInterval(() => {
        if (isPageVisible) {
          loadAdminConfig();
        }
      }, 600000); // Poll every 10 minutes (600,000ms)
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedBranch, selectedYear, selectedSection, isPageVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Countdown timer effect - updates every second
   */
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    
    if (selectedBranch && selectedYear && selectedSection && adminConfig && isPageVisible) {
      timerInterval = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev <= 1) {
            return 600; // Reset to 10 minutes when countdown reaches 0
          }
          return prev - 1;
        });
      }, 1000); // Update every second
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [selectedBranch, selectedYear, selectedSection, adminConfig, isPageVisible]);

  /**
   * Format countdown seconds to MM:SS format
   */
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Handles branch selection change
   * Resets year, section, and feedback data when branch changes
   */
  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    setSelectedYear('');
    setSelectedSection('');
    setFeedbackData([]);
    setAdminConfig(null);
  };

  /**
   * Handles year selection change
   * Resets section and feedback data when year changes
   */
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedSection('');
    setFeedbackData([]);
    setAdminConfig(null);
  };

  /**
   * Handles section selection change
   * Triggers admin config loading
   */
  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    setFeedbackData([]);
    setAdminConfig(null);
  };

  /**
   * Handles response change for a specific question
   */
  const handleResponseChange = (subjectIndex: number, questionId: string, response: string | number | boolean) => {
    const updatedFeedback = [...feedbackData];
    updatedFeedback[subjectIndex].responses[questionId] = response;
    setFeedbackData(updatedFeedback);
  };

  /**
   * Validates that all required questions are answered
   */
  const validateForm = () => {
    // Check if basic information is filled
    if (!registrationNumber || !selectedBranch || !selectedYear || !selectedSection) {
      return false;
    }
    
    if (!adminConfig) return false;
    
    for (let i = 0; i < feedbackData.length; i++) {
      const subjectFeedback = feedbackData[i];
      const subjectConfig = adminConfig.subjects[i];
      
      for (const question of subjectConfig.questions) {
        if (question.required && !subjectFeedback.responses[question.id]) {
          return false;
        }
      }
    }
    return true;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Please answer all required questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare enhanced feedback data
      const enhancedFeedback: EnhancedFeedbackData[] = feedbackData.map(item => ({
        ...item,
        registrationNumber: registrationNumber,
        timestamp: new Date().toISOString()
      }));

      const response = await fetch('/api/submit-enhanced-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedFeedback),
      });

      if (response.ok) {
        setShowConfirmation(true);
        setRegistrationNumber('');
        setSelectedBranch('');
        setSelectedYear('');
        setSelectedSection('');
        setFeedbackData([]);
        setAdminConfig(null);
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Rating Component for rating questions
   */
  const RatingComponent = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              num <= rating
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Question Component - renders different types of questions
   */
  const QuestionComponent = ({ question, value, onChange }: { 
    question: Question; 
    value: string | number | boolean; 
    onChange: (value: string | number | boolean) => void; 
  }) => {
    switch (question.type) {
      case 'rating':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {question.text} {question.required && <span className="text-red-500">*</span>}
            </label>
            <RatingComponent rating={typeof value === 'number' ? value : 0} onRatingChange={onChange} />
          </div>
        );
      
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {question.text} {question.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={typeof value === 'string' ? value : String(value || '')}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter your response..."
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {question.text} {question.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value="yes"
                  checked={value === 'yes'}
                  onChange={(e) => onChange(e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value="no"
                  checked={value === 'no'}
                  onChange={(e) => onChange(e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Success confirmation screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your feedback has been submitted successfully.</p>
          <button
            onClick={() => setShowConfirmation(false)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  // Main feedback form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Course End Survey</h1>
          <p className="text-gray-600">Provide feedback to help improve education quality</p>
          <div className="flex justify-center items-center mt-4 space-x-4">
            <button
              onClick={loadOptions}
              disabled={isLoadingOptions}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <svg className={`w-4 h-4 ${isLoadingOptions ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoadingOptions ? 'Loading...' : 'Refresh Options'}
            </button>
          </div>
          
          {/* Options status */}
          <div className="text-sm text-gray-500 mt-2">
            <span>📊 Available: {options.branches.length} branches, {options.years.length} years, {options.sections.length} sections</span>
            {lastOptionsUpdate && (
              <>
                <span className="mx-2">•</span>
                <span>Last refreshed: {lastOptionsUpdate.toLocaleTimeString()}</span>
              </>
            )}
            <span className="mx-2">•</span>
            <span>Auto-refresh: every 10 minutes</span>
          </div>
          {adminConfig && (
            <div className="text-sm text-gray-500 mt-2">
              <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Auto-updating every 10 minutes</span>
              <span className="mx-2">•</span>
              <span>Next update in: {formatCountdown(countdownSeconds)}</span>
              {lastUpdateTime && (
                <>
                  <span className="mx-2">•</span>
                  <span>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error handling for options loading */}
        {optionsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Configuration Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{optionsError}</p>
                  <p className="mt-1">Please check your Google Sheets configuration and try refreshing the page.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branch, Year, and Section selection card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Your Details</h2>
          
          {/* Registration Number field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              placeholder="e.g., 23B81A4623"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Branch selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                disabled={isLoadingOptions}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">
                  {isLoadingOptions ? 'Loading branches...' : 'Select Branch'}
                </option>
                {options.branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* Year selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={!selectedBranch || isLoadingOptions}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Year</option>
                {options.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Section selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                disabled={!selectedYear || isLoadingOptions}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Section</option>
                {options.sections.map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading configuration */}
        {isLoadingConfig && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading questions...</span>
            </div>
          </div>
        )}

        {/* Dynamic questions section */}
        {adminConfig && feedbackData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Answer Questions for Each Subject</h2>
            
            <div className="space-y-8">
              {feedbackData.map((subjectFeedback, subjectIndex) => {
                const subjectConfig = adminConfig.subjects[subjectIndex];
                return (
                  <div key={subjectIndex} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{subjectFeedback.subject}</h3>
                      <p className="text-gray-600">Teacher: {subjectFeedback.teacher}</p>
                    </div>
                    
                    <div className="space-y-4">
                      {subjectConfig.questions.map((question) => (
                        <QuestionComponent
                          key={question.id}
                          question={question}
                          value={subjectFeedback.responses[question.id]}
                          onChange={(value) => handleResponseChange(subjectIndex, question.id, value)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateForm()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* No configuration found */}
        {selectedBranch && selectedYear && selectedSection && !isLoadingConfig && !adminConfig && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                No questions configured for <strong>{selectedBranch} {selectedYear} Section {selectedSection}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Admin Instructions:</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Create a Google Sheet named <code className="bg-blue-100 px-2 py-1 rounded">{selectedYear.replace(' ', '_')}_{selectedBranch}_{selectedSection}</code> with subjects and questions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
