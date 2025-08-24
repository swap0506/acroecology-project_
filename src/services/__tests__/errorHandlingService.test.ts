/**
 * Tests for Error Handling Service
 */

import { describe, it, expect, vi } from 'vitest';
import { errorHandlingService, ErrorDetails } from '../errorHandlingService';

describe('ErrorHandlingService', () => {
  describe('parseApiError', () => {
    it('should parse structured API errors correctly', () => {
      const apiError = {
        detail: {
          error_type: 'validation_error',
          message: 'Invalid image file',
          suggestions: ['Upload JPG or PNG', 'Check file size'],
          fallback_available: true
        }
      };

      const result = errorHandlingService.parseApiError(apiError);

      expect(result.type).toBe('validation_error');
      expect(result.message).toBe('Invalid image file');
      expect(result.suggestions).toEqual(['Upload JPG or PNG', 'Check file size']);
      expect(result.fallbackAvailable).toBe(true);
      expect(result.retryable).toBe(false);
    });

    it('should handle network errors correctly', () => {
      const networkError = new TypeError('Failed to fetch');

      const result = errorHandlingService.parseApiError(networkError);

      expect(result.type).toBe('network_error');
      expect(result.retryable).toBe(true);
      expect(result.fallbackAvailable).toBe(true);
    });

    it('should handle timeout errors correctly', () => {
      const timeoutError = { name: 'AbortError', message: 'Request timeout' };

      const result = errorHandlingService.parseApiError(timeoutError);

      expect(result.type).toBe('timeout_error');
      expect(result.retryable).toBe(true);
      expect(result.suggestions).toContain('Try uploading a smaller image');
    });

    it('should handle unknown errors with defaults', () => {
      const unknownError = new Error('Something went wrong');

      const result = errorHandlingService.parseApiError(unknownError);

      expect(result.type).toBe('unknown_error');
      expect(result.message).toBe('Something went wrong');
      expect(result.recoverable).toBe(true);
      expect(result.retryable).toBe(true);
    });
  });

  describe('generateRecoveryActions', () => {
    it('should generate retry action for retryable errors', () => {
      const errorDetails: ErrorDetails = {
        type: 'network_error',
        message: 'Network failed',
        suggestions: [],
        recoverable: true,
        retryable: true,
        fallbackAvailable: false,
        expertContactsRecommended: false
      };

      const onRetry = vi.fn();
      const actions = errorHandlingService.generateRecoveryActions(errorDetails, onRetry);

      expect(actions).toHaveLength(1);
      expect(actions[0].label).toBe('Try Again');
      expect(actions[0].primary).toBe(true);
    });

    it('should generate fallback action when available', () => {
      const errorDetails: ErrorDetails = {
        type: 'service_unavailable',
        message: 'Service down',
        suggestions: [],
        recoverable: true,
        retryable: false,
        fallbackAvailable: true,
        expertContactsRecommended: false
      };

      const onFallback = vi.fn();
      const actions = errorHandlingService.generateRecoveryActions(errorDetails, undefined, onFallback);

      expect(actions.some(action => action.label === 'Use General Guidance')).toBe(true);
    });

    it('should generate expert contact action when recommended', () => {
      const errorDetails: ErrorDetails = {
        type: 'low_confidence',
        message: 'Low confidence',
        suggestions: [],
        recoverable: true,
        retryable: false,
        fallbackAvailable: false,
        expertContactsRecommended: true
      };

      const onContactExpert = vi.fn();
      const actions = errorHandlingService.generateRecoveryActions(errorDetails, undefined, undefined, onContactExpert);

      expect(actions.some(action => action.label === 'Contact Expert')).toBe(true);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should enhance network error messages', () => {
      const errorDetails: ErrorDetails = {
        type: 'network_error',
        message: 'Connection failed',
        suggestions: [],
        recoverable: true,
        retryable: true,
        fallbackAvailable: true,
        expertContactsRecommended: false
      };

      const message = errorHandlingService.getUserFriendlyMessage(errorDetails);

      expect(message).toContain('Connection failed');
      expect(message).toContain('internet connectivity issues');
    });

    it('should enhance service unavailable messages', () => {
      const errorDetails: ErrorDetails = {
        type: 'service_unavailable',
        message: 'Service down',
        suggestions: [],
        recoverable: true,
        retryable: true,
        fallbackAvailable: true,
        expertContactsRecommended: false
      };

      const message = errorHandlingService.getUserFriendlyMessage(errorDetails);

      expect(message).toContain('Service down');
      expect(message).toContain('general guidance');
    });
  });

  describe('assessServiceAvailability', () => {
    it('should assess service as available with no errors', () => {
      const assessment = errorHandlingService.assessServiceAvailability([]);

      expect(assessment.available).toBe(true);
      expect(assessment.confidence).toBe(1.0);
    });

    it('should assess service as unavailable with many service errors', () => {
      const errors: ErrorDetails[] = [
        {
          type: 'service_unavailable',
          message: 'Service down',
          suggestions: [],
          recoverable: true,
          retryable: true,
          fallbackAvailable: true,
          expertContactsRecommended: false
        },
        {
          type: 'timeout_error',
          message: 'Timeout',
          suggestions: [],
          recoverable: true,
          retryable: true,
          fallbackAvailable: true,
          expertContactsRecommended: false
        }
      ];

      const assessment = errorHandlingService.assessServiceAvailability(errors);

      expect(assessment.available).toBe(false);
      expect(assessment.confidence).toBe(0.2);
      expect(assessment.recommendation).toContain('expert consultation');
    });
  });

  describe('getExpertContacts', () => {
    it('should return expert contact information', () => {
      const contacts = errorHandlingService.getExpertContacts();

      expect(contacts).toHaveLength(4);
      expect(contacts[0].name).toBe('Local Agricultural Extension Service');
      expect(contacts[0].type).toBe('government');
      expect(contacts[0].description).toContain('Free local expertise');
    });
  });

  describe('logError', () => {
    it('should log error details', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      errorHandlingService.logError(error, 'Test context');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PestIdentification] Test context:',
        expect.objectContaining({
          type: 'unknown_error',
          message: 'Test error',
          originalError: error,
          timestamp: expect.any(String)
        })
      );

      consoleSpy.mockRestore();
    });
  });
});