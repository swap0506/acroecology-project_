import React, { useState } from 'react';
import { ArrowLeft, Bug, Leaf, AlertTriangle, Home, Sprout, ExternalLink, Phone } from 'lucide-react';
import ImageUpload from './ImageUpload';
import PestDiseaseResults from './PestDiseaseResults';
import { errorHandlingService, ErrorDetails } from '../services/errorHandlingService';

interface PestIdentificationProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  user?: { name: string; email: string } | null;
}

// Types matching the backend API response and PestDiseaseResults component
interface PestDiseaseMatch {
  name: string;
  scientific_name?: string;
  confidence: number;
  category: 'pest' | 'disease' | 'deficiency' | 'health_issue' | 'unknown';
  description: string;
  symptoms: string[];
  images: string[];
}

interface TreatmentOption {
  method: 'organic' | 'chemical' | 'cultural';
  treatment: string;
  application: string;
  timing: string;
  safety_notes: string;
}

interface ExpertResource {
  name: string;
  contact: string;
  type: string;
  location?: string;
}

interface IdentificationResult {
  matches: PestDiseaseMatch[];
  treatments: TreatmentOption[];
  prevention_tips: string[];
  expert_resources: ExpertResource[];
  confidence_level: 'high' | 'medium' | 'low';
  api_source: string;
  fallback_mode?: boolean;
  message?: string;
}

const PestIdentification: React.FC<PestIdentificationProps> = ({ onBack, onNavigate, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [showExpertContacts, setShowExpertContacts] = useState(false);

  const handleImageUpload = async (file: File, isRetry: boolean = false) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setNetworkError(false);
    setServiceUnavailable(false);
    
    if (!isRetry) {
      setLastUploadedFile(file);
      setRetryCount(0);
    }

    try {
      // Create FormData for the API request
      const formData = new FormData();
      formData.append('image', file);
      formData.append('crop_type', 'general'); // Could be made configurable
      formData.append('location', 'user_location'); // Could be made configurable
      formData.append('additional_info', 'User uploaded image for pest/disease identification');

      // Call the backend API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Failed to analyze image';
        let errorType = 'api_error';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail?.message || errorData.message || errorMessage;
          errorType = errorData.detail?.error_type || errorType;
        } catch (parseError) {
          // If we can't parse the error response, use status-based messages
          if (response.status === 429) {
            errorMessage = 'Service is currently busy. Please try again in a few moments.';
            errorType = 'rate_limit';
          } else if (response.status >= 500) {
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            errorType = 'service_unavailable';
            setServiceUnavailable(true);
          } else if (response.status === 422) {
            errorMessage = 'Invalid image file. Please check the file format and size.';
            errorType = 'validation_error';
          }
        }
        
        throw new Error(errorMessage);
      }

      const apiResult = await response.json();
      
      // Reset retry count on success
      setRetryCount(0);
      setResult(apiResult);
      
      // If we got a fallback result, show appropriate messaging
      if (apiResult.fallback_mode) {
        setServiceUnavailable(true);
      }
      
    } catch (err) {
      // Use error handling service to parse and categorize the error
      const parsedError = errorHandlingService.parseApiError(err);
      setErrorDetails(parsedError);
      
      // Log error for debugging
      errorHandlingService.logError(err, 'Image Upload');
      
      let errorMessage = errorHandlingService.getUserFriendlyMessage(parsedError);
      let shouldShowFallback = false;
      
      // Update state based on error type
      if (parsedError.type === 'network_error') {
        setNetworkError(true);
      } else if (parsedError.type === 'service_unavailable' || parsedError.type === 'timeout_error') {
        setServiceUnavailable(true);
      }
      
      // Determine if we should show fallback result
      if (parsedError.fallbackAvailable && (networkError || serviceUnavailable || retryCount >= 2)) {
        shouldShowFallback = true;
      }
      
      if (shouldShowFallback) {
        // Provide comprehensive fallback result
        const fallbackResult: IdentificationResult = {
          matches: [{
            name: 'Service Temporarily Unavailable',
            confidence: 0.0,
            category: 'unknown',
            description: 'The pest and disease identification service is temporarily unavailable. This could be due to network issues, service maintenance, or high demand.',
            symptoms: ['Service unavailable', 'Network connectivity issues'],
            images: []
          }],
          treatments: [
            {
              method: 'cultural',
              treatment: 'Expert consultation recommended',
              application: 'Contact local agricultural extension or plant pathologist for accurate diagnosis',
              timing: 'As soon as possible',
              safety_notes: 'Professional diagnosis is recommended for proper treatment'
            },
            {
              method: 'organic',
              treatment: 'General plant health maintenance',
              application: 'Ensure proper watering, lighting, and nutrition while seeking expert advice',
              timing: 'Ongoing',
              safety_notes: 'Monitor plant condition and remove severely affected parts'
            }
          ],
          prevention_tips: [
            'Monitor plants regularly for early detection of issues',
            'Maintain good plant hygiene and proper spacing',
            'Ensure adequate but not excessive watering',
            'Provide appropriate lighting and nutrition',
            'Remove affected plant material promptly',
            'Practice crop rotation when possible'
          ],
          expert_resources: [
            {
              name: 'Local Agricultural Extension Service',
              contact: 'Contact your local county extension office for in-person diagnosis',
              type: 'extension_service',
              location: 'Local'
            },
            {
              name: 'Plant Disease Diagnostic Lab',
              contact: 'Submit physical samples to your state\'s plant diagnostic laboratory',
              type: 'university',
              location: 'State University'
            },
            {
              name: 'Certified Crop Advisor',
              contact: 'Find a CCA through the American Society of Agronomy website',
              type: 'consultant',
              location: 'Regional'
            },
            {
              name: 'Master Gardener Program',
              contact: 'Contact your local Master Gardener volunteers for assistance',
              type: 'volunteer',
              location: 'Local'
            }
          ],
          confidence_level: 'low',
          api_source: 'fallback_service',
          fallback_mode: true,
          message: 'Primary identification service unavailable. We recommend consulting local experts for accurate diagnosis.'
        };
        
        setResult(fallbackResult);
      }
      
      setError(errorMessage);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastUploadedFile && retryCount < 3) {
      handleImageUpload(lastUploadedFile, true);
    }
  };

  const handleNewUpload = () => {
    setResult(null);
    setError(null);
    setRetryCount(0);
    setLastUploadedFile(null);
    setNetworkError(false);
    setServiceUnavailable(false);
    setErrorDetails(null);
    setShowExpertContacts(false);
  };

  const handleShowExpertContacts = () => {
    setShowExpertContacts(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header with Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500">
                <button
                  onClick={onBack}
                  className="hover:text-gray-700 transition-colors"
                >
                  Home
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">Pest & Disease Identification</span>
              </nav>
            </div>
            
            {/* User Info and Navigation */}
            <div className="flex items-center space-x-4">
              {onNavigate && (
                <nav className="hidden md:flex items-center space-x-4">
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('analytics')}
                    className="text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => onNavigate('settings')}
                    className="text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Settings
                  </button>
                </nav>
              )}
              
              {user && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <span>Welcome, {user.name}</span>
                </div>
              )}
              
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
          </div>
          
          {/* Page Title */}
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Bug className="text-green-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pest & Disease Identification</h1>
                <p className="text-gray-600">Upload plant photos for AI-powered diagnosis and treatment recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <div className="space-y-8">
            {/* Introduction */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Leaf className="text-green-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Identify Plant Problems
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload a photo of your affected plant to get instant identification and treatment recommendations for pests and diseases.
              </p>
            </div>

            {/* Image Upload Component */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <ImageUpload
                onImageUpload={(file) => handleImageUpload(file, false)}
                loading={loading}
                error={error}
                maxSizeBytes={10 * 1024 * 1024} // 10MB
                compressionQuality={0.8}
                onRetry={handleRetry}
                showRecoveryOptions={true}
              />
              
              {/* Additional Error Information */}
              {(networkError || serviceUnavailable) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="text-yellow-800 font-semibold mb-1">
                        {networkError ? 'Connection Issue' : 'Service Temporarily Unavailable'}
                      </h4>
                      <p className="text-yellow-700 text-sm mb-3">
                        {networkError 
                          ? 'We\'re having trouble connecting to our identification service. This could be due to network issues.'
                          : 'Our plant identification service is currently experiencing high demand or undergoing maintenance.'
                        }
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {retryCount < 3 && lastUploadedFile && (
                            <button
                              onClick={handleRetry}
                              disabled={loading}
                              className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {loading ? 'Retrying...' : `Retry Upload (${retryCount + 1}/3)`}
                            </button>
                          )}
                          
                          {!showExpertContacts && (
                            <button
                              onClick={handleShowExpertContacts}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Find Local Experts
                            </button>
                          )}
                        </div>
                        
                        <div className="text-yellow-700 text-xs">
                          <p className="font-medium mb-1">Alternative options:</p>
                          <ul className="space-y-1">
                            <li>• Try again in a few minutes</li>
                            <li>• Check your internet connection</li>
                            <li>• Contact local agricultural experts</li>
                            <li>• Use the fallback guidance provided below</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expert Contacts Section */}
            {(showExpertContacts || (errorDetails?.expertContactsRecommended && retryCount >= 2)) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Phone className="text-blue-600 mr-2" size={24} />
                  Expert Consultation Resources
                </h3>
                <p className="text-gray-600 mb-6">
                  When automated identification isn't available or confidence is low, these local experts can provide accurate diagnosis and treatment recommendations.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {errorHandlingService.getExpertContacts().map((contact, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{contact.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{contact.description}</p>
                          <p className="text-gray-500 text-xs">{contact.contact}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                            {contact.type}
                          </span>
                          <ExternalLink size={16} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-blue-800 font-semibold mb-2">Tips for Expert Consultation:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Take multiple photos from different angles</li>
                    <li>• Note when symptoms first appeared</li>
                    <li>• Document recent changes in care or environment</li>
                    <li>• Bring a sample if visiting in person</li>
                    <li>• Ask about prevention strategies for the future</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Tips for Best Results
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Take photos in good natural lighting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Focus on the affected area of the plant</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Include some healthy parts for comparison</span>
                  </li>
                </ul>
                <ul className="text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Avoid blurry or dark images</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Take photos from 6-12 inches away</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Show clear symptoms and damage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Results Display using the new PestDiseaseResults component */
          <PestDiseaseResults
            result={result}
            onNewUpload={handleNewUpload}
          />
        )}
      </div>

      {/* Floating Navigation for Mobile */}
      {onNavigate && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
              title="Dashboard"
            >
              <Home size={20} />
            </button>
            <button
              onClick={() => onNavigate('prediction')}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
              title="New Prediction"
            >
              <Sprout size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestIdentification;