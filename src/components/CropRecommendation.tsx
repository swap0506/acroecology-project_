import React, { useEffect, useState, useMemo, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface CropData {
  rainfall: string;
  temperature: string;
  humidity: string;
  phosphorous: string;
  potassium: string;
  nitrogen: string;
  ph: string;
  soilType: string;
}

interface CropRecommendationProps {
  cropData: CropData;
}

interface ApiTop3 {
  crop: string;
  prob: number;
}

interface Amendment {
  name: string;
  purpose: string;
  application_rate: string;
  timing: string;
}

interface IrrigationTips {
  frequency: string;
  duration: string;
  method: string;
  special_notes: string;
}

interface SoilAdvice {
  compatibility_score: number;
  amendments: Amendment[];
  irrigation_tips: IrrigationTips;
  warnings: string[];
  variety_recommendations: string[];
}

interface ApiResponse {
  crop: string;
  top3: ApiTop3[];
  probs?: Record<string, number>;
  soil_specific_advice?: SoilAdvice;
}

const CropRecommendation: React.FC<CropRecommendationProps> = ({ cropData }) => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);
  const [soilAdviceError, setSoilAdviceError] = useState<string | null>(null);

  // Memoize API URL to prevent unnecessary re-renders
  const apiUrl = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/predict`
      : "http://localhost:8000/predict";
  }, []);

  // Memoize payload to prevent unnecessary API calls
  const payload = useMemo(() => ({
    N: Number(cropData.nitrogen),
    P: Number(cropData.phosphorous),
    K: Number(cropData.potassium),
    temperature: Number(cropData.temperature),
    humidity: Number(cropData.humidity),
    ph: Number(cropData.ph),
    rainfall: Number(cropData.rainfall),
    soil_type: cropData.soilType || null,
  }), [cropData]);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setApiError(null);
      setSoilAdviceError(null);
      
      try {
        // Validate input data before sending
        const numericFields = ['nitrogen', 'phosphorous', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall'];
        for (const field of numericFields) {
          const value = Number(cropData[field as keyof CropData]);
          if (isNaN(value) || value < 0) {
            throw new Error(`Invalid ${field} value. Please ensure all values are positive numbers.`);
          }
        }

        const payload = {
          N: Number(cropData.nitrogen),
          P: Number(cropData.phosphorous),
          K: Number(cropData.potassium),
          temperature: Number(cropData.temperature),
          humidity: Number(cropData.humidity),
          ph: Number(cropData.ph),
          rainfall: Number(cropData.rainfall),
          soil_type: cropData.soilType || null,
        };

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Prediction service not found. Please check if the backend is running.");
          } else if (res.status === 500) {
            throw new Error("Server error occurred. Please try again later.");
          } else if (res.status >= 400 && res.status < 500) {
            throw new Error("Invalid request data. Please check your inputs.");
          } else {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
          }
        }

        const data: ApiResponse = await res.json();
        
        // Validate response data
        if (!data || !data.crop || !data.top3) {
          throw new Error("Invalid response from prediction service.");
        }

        // Check for soil advice errors
        if (cropData.soilType && !data.soil_specific_advice) {
          setSoilAdviceError("Soil-specific advice could not be generated. General recommendations are still available.");
        }

        setApiResult(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === 'TypeError' && err.message.includes('fetch')) {
            setApiError("Unable to connect to the prediction service. Please check your internet connection and try again.");
          } else {
            setApiError(err.message);
          }
        } else {
          setApiError("An unexpected error occurred while fetching predictions.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [payload, apiUrl]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        🔄 Predicting best crop...
      </div>
    );
  }

  if (apiError || !apiResult) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Prediction Error
              </h3>
              <p className="text-red-700 mb-3">
                {apiError || "Could not fetch crop prediction."}
              </p>
              <div className="text-sm text-red-600">
                <p className="mb-2">Possible solutions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your internet connection</li>
                  <li>Verify all input values are valid numbers</li>
                  <li>Try refreshing the page</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fallback general advice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">
            General Agricultural Advice
          </h4>
          <div className="text-blue-700 space-y-2">
            <p>While we couldn't provide specific crop recommendations, here are some general tips:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Ensure proper soil preparation and drainage</li>
              <li>Test your soil pH and adjust if necessary</li>
              <li>Consider local climate conditions and seasonal patterns</li>
              <li>Consult with local agricultural extension services</li>
              <li>Choose crops suited to your region's growing conditions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Recommendation Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">
            {apiResult.crop}
          </h3>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {Math.round(apiResult.top3[0].prob * 100)}% Match
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            This crop is the top recommendation from our ML model based on your
            soil and climate data.
          </p>
        </div>

        {/* Top 3 predictions */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold mb-2">Top 3 Predictions</h4>
          <ul className="space-y-1">
            {apiResult.top3.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.crop}</span>
                <span>{Math.round(item.prob * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Soil Advice Error Display */}
      {soilAdviceError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-yellow-800 text-sm font-medium">Soil Advice Notice</p>
              <p className="text-yellow-700 text-sm mt-1">{soilAdviceError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Soil-Specific Advice */}
      {apiResult.soil_specific_advice && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            🌱 Soil-Specific Recommendations
          </h4>
          
          {/* Compatibility Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">Soil Compatibility</span>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                apiResult.soil_specific_advice.compatibility_score >= 0.8 
                  ? 'bg-green-100 text-green-800'
                  : apiResult.soil_specific_advice.compatibility_score >= 0.6
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {Math.round(apiResult.soil_specific_advice.compatibility_score * 100)}% Compatible
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  apiResult.soil_specific_advice.compatibility_score >= 0.8 
                    ? 'bg-green-500'
                    : apiResult.soil_specific_advice.compatibility_score >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${apiResult.soil_specific_advice.compatibility_score * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Warnings */}
          {apiResult.soil_specific_advice.warnings.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <AlertTriangle className="mr-2" size={16} />
                Important Considerations
              </h5>
              <ul className="text-yellow-700 text-sm space-y-1">
                {apiResult.soil_specific_advice.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variety Recommendations */}
          {apiResult.soil_specific_advice.variety_recommendations.length > 0 && (
            <div className="mb-6">
              <h5 className="font-semibold text-gray-800 mb-3">🌾 Recommended Varieties</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {apiResult.soil_specific_advice.variety_recommendations.map((variety, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-sm">{variety}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Irrigation Tips */}
          <div className="mb-6">
            <h5 className="font-semibold text-gray-800 mb-3">💧 Irrigation Guidance</h5>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Frequency:</span>
                  <p className="text-gray-800">{apiResult.soil_specific_advice.irrigation_tips.frequency}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Duration:</span>
                  <p className="text-gray-800">{apiResult.soil_specific_advice.irrigation_tips.duration}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Method:</span>
                  <p className="text-gray-800">{apiResult.soil_specific_advice.irrigation_tips.method}</p>
                </div>
              </div>
              {apiResult.soil_specific_advice.irrigation_tips.special_notes && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Special Notes:</span>
                  <p className="text-gray-700 text-sm mt-1">{apiResult.soil_specific_advice.irrigation_tips.special_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Soil Amendments */}
          {apiResult.soil_specific_advice.amendments.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-800 mb-3">🌿 Recommended Soil Amendments</h5>
              <div className="space-y-3">
                {apiResult.soil_specific_advice.amendments.map((amendment, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <h6 className="font-medium text-gray-800">{amendment.name}</h6>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {amendment.timing}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{amendment.purpose}</p>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Application Rate:</span> {amendment.application_rate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* General Growing Tips */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <AlertTriangle className="text-orange-500 mr-2" size={24} />
          General Growing Tips
        </h4>
        <p className="text-gray-700">
          Ensure proper irrigation, pest control, and nutrient management for
          optimal yields. {!apiResult.soil_specific_advice && cropData.soilType && 
          "For more detailed advice, ensure your soil type data is properly configured."}
        </p>
      </div>
    </div>
  );
};

export default CropRecommendation;
