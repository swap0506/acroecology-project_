import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Phone, 
  Shield, 
  Leaf, 
  Bug,
  Beaker,
  Clock,
  AlertCircle,
  Info,
  Star,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import ProgressiveImage from './ProgressiveImage';

// Types based on the backend API structure
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

interface PestDiseaseResultsProps {
  result: IdentificationResult;
  onNewUpload: () => void;
}

const PestDiseaseResults: React.FC<PestDiseaseResultsProps> = ({ result, onNewUpload }) => {
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<{
    symptoms: boolean;
    images: boolean;
    treatments: boolean;
    prevention: boolean;
    experts: boolean;
  }>({
    symptoms: true,
    images: false,
    treatments: true,
    prevention: false,
    experts: false
  });

  const { isMobile, hasTouchScreen } = useMobile();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'low':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Star className="mr-1" size={14} />;
      case 'medium':
        return <Star className="mr-1" size={14} />;
      case 'low':
        return <Star className="mr-1" size={14} />;
      default:
        return <Star className="mr-1" size={14} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pest':
        return <Bug className="text-red-600" size={20} />;
      case 'disease':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'deficiency':
        return <Leaf className="text-yellow-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'organic':
        return <Leaf className="text-green-600" size={16} />;
      case 'chemical':
        return <Beaker className="text-blue-600" size={16} />;
      case 'cultural':
        return <Shield className="text-purple-600" size={16} />;
      default:
        return <Info className="text-gray-600" size={16} />;
    }
  };

  const filteredTreatments = result.treatments.filter(treatment => 
    treatmentFilter === 'all' || treatment.method === treatmentFilter
  );

  const primaryMatch = result.matches[0];
  const hasMultipleMatches = result.matches.length > 1;

  return (
    <div className={`space-y-${isMobile ? '4' : '6'} ${isMobile ? 'px-2' : ''}`}>
      {/* Header with confidence indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-green-100 rounded-full mb-4`}>
          {result.confidence_level === 'high' ? (
            <CheckCircle className="text-green-600" size={isMobile ? 24 : 32} />
          ) : (
            <Bug className="text-red-600" size={isMobile ? 16 : 20} />
          )}
        </div>
        <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-800 mb-2`}>
          {result.fallback_mode ? 'Analysis Complete' : 'Identification Complete'}
        </h2>
        {result.message && (
          <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm px-4' : ''}`}>{result.message}</p>
        )}
        
        {/* Confidence Level Indicator */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${getConfidenceColor(result.confidence_level)}`}>
          {getConfidenceIcon(result.confidence_level)}
          {result.confidence_level.charAt(0).toUpperCase() + result.confidence_level.slice(1)} Confidence
        </div>

        {/* Low confidence warning and fallback mode handling */}
        {(result.confidence_level === 'low' || result.fallback_mode) && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-600 mr-3 mt-0.5" size={20} />
              <div>
                <h4 className="text-yellow-800 font-semibold mb-1">
                  {result.fallback_mode ? 'Service Unavailable - Fallback Mode' : 'Low Confidence Detection'}
                </h4>
                <p className="text-yellow-700 text-sm mb-3">
                  {result.fallback_mode 
                    ? 'The primary identification service is temporarily unavailable. We\'re providing general guidance based on common plant issues.'
                    : 'The identification confidence is low. Consider consulting with local experts for accurate diagnosis.'
                  }
                </p>
                
                {result.fallback_mode && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3">
                    <h5 className="text-yellow-800 font-semibold mb-2">Recommended Actions:</h5>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Try uploading the image again in a few minutes</li>
                      <li>• Take additional photos from different angles</li>
                      <li>• Contact local agricultural experts for in-person diagnosis</li>
                      <li>• Use the general treatment guidance provided below</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Match Card */}
      {primaryMatch && (
        <div className={`bg-white rounded-2xl shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`flex items-start justify-between mb-4 ${isMobile ? 'flex-col space-y-2' : ''}`}>
            <div className="flex items-center space-x-3">
              {getCategoryIcon(primaryMatch.category)}
              <div className="flex-1">
                <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-800`}>
                  {primaryMatch.name}
                </h3>
                {primaryMatch.scientific_name && (
                  <p className={`text-gray-600 italic ${isMobile ? 'text-sm' : ''}`}>
                    {primaryMatch.scientific_name}
                  </p>
                )}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${isMobile ? 'text-xs self-start' : 'text-sm'} font-semibold text-green-600 bg-green-100`}>
              {Math.round(primaryMatch.confidence * 100)}%
            </div>
          </div>

          <div className="space-y-4">
            {/* Description */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">{primaryMatch.description}</p>
            </div>

            {/* Symptoms */}
            {primaryMatch.symptoms.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('symptoms')}
                  className={`flex items-center justify-between w-full text-left ${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-2 ${hasTouchScreen ? 'active:bg-gray-50 rounded p-1' : ''}`}
                >
                  <span>Common Symptoms</span>
                  {isMobile && (
                    expandedSections.symptoms ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                  )}
                </button>
                {(expandedSections.symptoms || !isMobile) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className={`text-blue-800 space-y-1 ${isMobile ? 'text-sm' : ''}`}>
                      {primaryMatch.symptoms.map((symptom, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Reference Images */}
            {primaryMatch.images.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('images')}
                  className={`flex items-center justify-between w-full text-left ${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-2 ${hasTouchScreen ? 'active:bg-gray-50 rounded p-1' : ''}`}
                >
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Reference Images
                  </span>
                  {isMobile && (
                    expandedSections.images ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                  )}
                </button>
                {(expandedSections.images || !isMobile) && (
                  <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-${isMobile ? '2' : '4'}`}>
                    {primaryMatch.images.slice(0, isMobile ? 4 : 6).map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <ProgressiveImage
                          src={image}
                          alt={`${primaryMatch.name} reference ${index + 1}`}
                          className={`w-full h-full object-cover transition-transform cursor-pointer ${hasTouchScreen ? 'active:scale-95' : 'hover:scale-105'}`}
                          quality={isMobile ? 'medium' : 'high'}
                          lazy={true}
                          threshold={200}
                          showLoadingIndicator={true}
                          fallbackComponent={
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Image unavailable</span>
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Matches */}
      {hasMultipleMatches && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Other Possible Matches</h3>
          <div className="space-y-4">
            {result.matches.slice(1, 3).map((match, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getCategoryIcon(match.category)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{match.name}</h4>
                    {match.scientific_name && (
                      <p className="text-gray-500 italic text-sm">{match.scientific_name}</p>
                    )}
                    <p className="text-gray-600 text-sm mt-1">{match.description}</p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        {Math.round(match.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Options */}
      {result.treatments.length > 0 && (
        <div className={`bg-white rounded-2xl shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <button
            onClick={() => toggleSection('treatments')}
            className={`flex items-center justify-between w-full text-left ${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-4 ${hasTouchScreen ? 'active:bg-gray-50 rounded p-1' : ''}`}
          >
            <span>Treatment Options</span>
            {isMobile && (
              expandedSections.treatments ? <ChevronUp size={24} /> : <ChevronDown size={24} />
            )}
          </button>
          
          {(expandedSections.treatments || !isMobile) && (
            <>
              {/* Treatment Filter */}
              <div className={`mb-4 flex ${isMobile ? 'flex-col' : 'items-center'} gap-2`}>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Filter by method:</span>
                <select 
                  value={treatmentFilter} 
                  onChange={(e) => setTreatmentFilter(e.target.value)}
                  className={`px-3 py-2 border border-gray-300 rounded-lg ${isMobile ? 'text-sm w-full' : 'text-sm'} ${hasTouchScreen ? 'text-base' : ''}`}
                >
                  <option value="all">All Methods</option>
                  <option value="organic">Organic Only</option>
                  <option value="chemical">Chemical</option>
                  <option value="cultural">Cultural</option>
                </select>
              </div>
            </>
          )}

          {(expandedSections.treatments || !isMobile) && (
            <div className="space-y-4">
              {filteredTreatments.map((treatment, index) => (
                <div
                  key={index}
                  className={`w-full p-4 border border-gray-200 rounded-lg ${hasTouchScreen ? 'active:bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getMethodIcon(treatment.method)}
                      <h4 className={`font-semibold text-gray-800 capitalize ${isMobile ? 'text-sm' : ''}`}>
                        {treatment.treatment} ({treatment.method} method)
                      </h4>
                    </div>
                    
                    <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <div>
                        <h5 className="font-semibold text-gray-700 mb-1 flex items-center">
                          <Beaker size={isMobile ? 12 : 14} className="mr-1" />
                          Application
                        </h5>
                        <p className="text-gray-600">{treatment.application}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-gray-700 mb-1 flex items-center">
                          <Clock size={isMobile ? 12 : 14} className="mr-1" />
                          Timing
                        </h5>
                        <p className="text-gray-600">{treatment.timing}</p>
                      </div>
                      
                      {treatment.safety_notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <h5 className="font-semibold text-yellow-800 mb-1 flex items-center">
                            <Shield size={isMobile ? 12 : 14} className="mr-1" />
                            Safety Notes
                          </h5>
                          <p className={`text-yellow-700 ${isMobile ? 'text-xs' : 'text-xs'}`}>{treatment.safety_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prevention Tips */}
      {result.prevention_tips.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Shield className="text-green-600 mr-2" size={24} />
            Prevention Tips
          </h3>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="text-green-800 space-y-2">
              {result.prevention_tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Expert Resources */}
      {result.expert_resources.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Phone className="text-blue-600 mr-2" size={24} />
            Expert Resources
          </h3>
          
          <div className="space-y-4">
            {result.expert_resources.map((resource, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{resource.name}</h4>
                    <p className="text-gray-600 text-sm mt-1">{resource.contact}</p>
                    {resource.location && (
                      <p className="text-gray-500 text-xs mt-1">📍 {resource.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                      {resource.type.replace('_', ' ')}
                    </span>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {(result.confidence_level === 'low' || result.fallback_mode) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm mb-2">
                <strong>Strong Recommendation:</strong> {result.fallback_mode 
                  ? 'Since our primary identification service is unavailable, we strongly recommend consulting with local experts for accurate diagnosis.'
                  : 'Given the low confidence level, we strongly recommend consulting with local experts for accurate diagnosis and treatment advice.'
                }
              </p>
              
              {result.fallback_mode && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
                  <h6 className="text-blue-800 font-semibold mb-2">Why Expert Consultation is Important:</h6>
                  <ul className="text-blue-700 text-xs space-y-1">
                    <li>• Automated identification services may miss subtle symptoms</li>
                    <li>• Local experts understand regional pest and disease patterns</li>
                    <li>• Professional diagnosis ensures appropriate treatment selection</li>
                    <li>• Early intervention can prevent spread to other plants</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 justify-center ${isMobile ? 'px-4' : ''}`}>
        <button
          onClick={onNewUpload}
          className={`
            bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg
            ${hasTouchScreen ? 'active:bg-green-800 active:scale-95' : ''}
            ${isMobile ? 'w-full text-base' : ''}
          `}
        >
          Analyze Another Image
        </button>
        
        {/* Mobile-specific quick actions */}
        {isMobile && (
          <div className="flex gap-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors active:bg-gray-300 active:scale-95"
            >
              Back to Top
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Plant Analysis Results',
                    text: `Identified: ${primaryMatch?.name || 'Plant issue'}`,
                    url: window.location.href
                  });
                }
              }}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors active:bg-blue-300 active:scale-95"
            >
              Share Results
            </button>
          </div>
        )}
      </div>

      {/* API Source Attribution */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Analysis powered by {result.api_source.replace('_', ' ')}
          {result.fallback_mode && ' (Fallback Mode)'}
        </p>
      </div>
    </div>
  );
};

export default PestDiseaseResults;