/**
 * Error Handling Service for Pest Disease Identification
 * 
 * Provides comprehensive error handling, recovery suggestions,
 * and fallback mechanisms for the pest identification feature.
 */

export interface ErrorDetails {
  type: string;
  message: string;
  suggestions: string[];
  recoverable: boolean;
  retryable: boolean;
  fallbackAvailable: boolean;
  expertContactsRecommended: boolean;
}

export interface RecoveryAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Parse and categorize errors from API responses
   */
  public parseApiError(error: any): ErrorDetails {
    // Handle structured error responses from backend
    if (error.detail && typeof error.detail === 'object') {
      return {
        type: error.detail.error_type || 'api_error',
        message: error.detail.message || 'An error occurred',
        suggestions: error.detail.suggestions || [],
        recoverable: error.detail.fallback_available || false,
        retryable: this.isRetryableError(error.detail.error_type),
        fallbackAvailable: error.detail.fallback_available || false,
        expertContactsRecommended: error.detail.error_type === 'service_unavailable' || 
                                   error.detail.error_type === 'low_confidence'
      };
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network_error',
        message: 'Network connection failed. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Ensure you\'re not behind a restrictive firewall'
        ],
        recoverable: true,
        retryable: true,
        fallbackAvailable: true,
        expertContactsRecommended: false
      };
    }

    // Handle timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        type: 'timeout_error',
        message: 'Request timed out. The service may be experiencing high demand.',
        suggestions: [
          'Try uploading a smaller image',
          'Check your internet connection speed',
          'Try again in a few minutes',
          'Consider compressing the image before upload'
        ],
        recoverable: true,
        retryable: true,
        fallbackAvailable: true,
        expertContactsRecommended: false
      };
    }

    // Handle validation errors
    if (error.message && error.message.includes('validation')) {
      return {
        type: 'validation_error',
        message: 'Invalid file or input data.',
        suggestions: [
          'Ensure your image is in JPG or PNG format',
          'Check that file size is under 10MB',
          'Try a different image file',
          'Compress the image if it\'s too large'
        ],
        recoverable: true,
        retryable: false,
        fallbackAvailable: false,
        expertContactsRecommended: false
      };
    }

    // Default error handling
    return {
      type: 'unknown_error',
      message: error.message || 'An unexpected error occurred',
      suggestions: [
        'Try refreshing the page',
        'Try uploading a different image',
        'Contact support if the problem persists'
      ],
      recoverable: true,
      retryable: true,
      fallbackAvailable: true,
      expertContactsRecommended: true
    };
  }

  /**
   * Determine if an error type is retryable
   */
  private isRetryableError(errorType: string): boolean {
    const retryableErrors = [
      'network_error',
      'timeout_error',
      'service_unavailable',
      'rate_limit_exceeded',
      'temporary_error'
    ];
    return retryableErrors.includes(errorType);
  }

  /**
   * Generate recovery actions based on error details
   */
  public generateRecoveryActions(
    errorDetails: ErrorDetails,
    onRetry?: () => void,
    onFallback?: () => void,
    onContactExpert?: () => void
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    // Add retry action if error is retryable
    if (errorDetails.retryable && onRetry) {
      actions.push({
        label: 'Try Again',
        action: onRetry,
        primary: true
      });
    }

    // Add fallback action if available
    if (errorDetails.fallbackAvailable && onFallback) {
      actions.push({
        label: 'Use General Guidance',
        action: onFallback
      });
    }

    // Add expert contact action if recommended
    if (errorDetails.expertContactsRecommended && onContactExpert) {
      actions.push({
        label: 'Contact Expert',
        action: onContactExpert
      });
    }

    return actions;
  }

  /**
   * Get user-friendly error message with context
   */
  public getUserFriendlyMessage(errorDetails: ErrorDetails): string {
    const baseMessage = errorDetails.message;
    
    if (errorDetails.type === 'network_error') {
      return `${baseMessage} This usually happens when there are internet connectivity issues.`;
    }
    
    if (errorDetails.type === 'service_unavailable') {
      return `${baseMessage} Our identification service is temporarily experiencing issues, but we can still provide general guidance.`;
    }
    
    if (errorDetails.type === 'rate_limit_exceeded') {
      return `${baseMessage} Please wait a few minutes before trying again, or contact local experts for immediate assistance.`;
    }
    
    if (errorDetails.type === 'validation_error') {
      return `${baseMessage} Please check your image file and try again.`;
    }
    
    return baseMessage;
  }

  /**
   * Log error for debugging and monitoring
   */
  public logError(error: any, context: string): void {
    const errorDetails = this.parseApiError(error);
    
    console.error(`[PestIdentification] ${context}:`, {
      type: errorDetails.type,
      message: errorDetails.message,
      originalError: error,
      timestamp: new Date().toISOString()
    });

    // In production, this would send to monitoring service
    // Example: sendToMonitoringService(errorDetails, context);
  }

  /**
   * Check if service is likely available based on error patterns
   */
  public assessServiceAvailability(recentErrors: ErrorDetails[]): {
    available: boolean;
    confidence: number;
    recommendation: string;
  } {
    if (recentErrors.length === 0) {
      return {
        available: true,
        confidence: 1.0,
        recommendation: 'Service appears to be working normally.'
      };
    }

    const serviceErrors = recentErrors.filter(e => 
      e.type === 'service_unavailable' || 
      e.type === 'timeout_error' ||
      e.type === 'rate_limit_exceeded'
    );

    const networkErrors = recentErrors.filter(e => e.type === 'network_error');

    if (serviceErrors.length > recentErrors.length * 0.7) {
      return {
        available: false,
        confidence: 0.2,
        recommendation: 'Service appears to be experiencing issues. Consider using expert consultation.'
      };
    }

    if (networkErrors.length > recentErrors.length * 0.5) {
      return {
        available: true,
        confidence: 0.6,
        recommendation: 'Service is available but you may have connectivity issues.'
      };
    }

    return {
      available: true,
      confidence: 0.8,
      recommendation: 'Service appears to be working with occasional issues.'
    };
  }

  /**
   * Get expert contact information for fallback scenarios
   */
  public getExpertContacts(): Array<{
    name: string;
    contact: string;
    type: string;
    description: string;
  }> {
    return [
      {
        name: 'Local Agricultural Extension Service',
        contact: 'Search "agricultural extension" + your location',
        type: 'government',
        description: 'Free local expertise and in-person plant diagnosis'
      },
      {
        name: 'Master Gardener Program',
        contact: 'Search "master gardener" + your location',
        type: 'volunteer',
        description: 'Trained volunteers who can help with plant problems'
      },
      {
        name: 'Plant Disease Diagnostic Lab',
        contact: 'Contact your state university',
        type: 'academic',
        description: 'Professional laboratory diagnosis for complex cases'
      },
      {
        name: 'Certified Crop Advisor',
        contact: 'American Society of Agronomy website',
        type: 'professional',
        description: 'Professional agricultural consultants'
      }
    ];
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();