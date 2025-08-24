import React, { useEffect, useState, useMemo } from "react";
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

  const apiUrl = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/predict`
      : "http://localhost:8000/predict";
  }, []);

  const payload = useMemo(
    () => ({
      N: Number(cropData.nitrogen),
      P: Number(cropData.phosphorous),
      K: Number(cropData.potassium),
      temperature: Number(cropData.temperature),
      humidity: Number(cropData.humidity),
      ph: Number(cropData.ph),
      rainfall: Number(cropData.rainfall),
      soil_type: cropData.soilType || null,
    }),
    [cropData]
  );

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setApiError(null);
      setSoilAdviceError(null);

      try {
        const numericFields = [
          "nitrogen",
          "phosphorous",
          "potassium",
          "temperature",
          "humidity",
          "ph",
          "rainfall",
        ];
        for (const field of numericFields) {
          const value = Number(cropData[field as keyof CropData]);
          if (isNaN(value) || value < 0) {
            throw new Error(
              `Invalid ${field} value. Please ensure all values are positive numbers.`
            );
          }
        }

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(
              "Prediction service not found. Please check if the backend is running."
            );
          } else if (res.status === 500) {
            throw new Error("Server error occurred. Please try again later.");
          } else if (res.status >= 400 && res.status < 500) {
            throw new Error("Invalid request data. Please check your inputs.");
          } else {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
          }
        }

        const data: ApiResponse = await res.json();

        if (!data || !data.crop || !data.top3) {
          throw new Error("Invalid response from prediction service.");
        }

        if (cropData.soilType && !data.soil_specific_advice) {
          setSoilAdviceError(
            "Soil-specific advice could not be generated. General recommendations are still available."
          );
        }

        setApiResult(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === "TypeError" && err.message.includes("fetch")) {
            setApiError(
              "Unable to connect to the prediction service. Please check your internet connection and try again."
            );
          } else {
            setApiError(err.message);
          }
        } else {
          setApiError(
            "An unexpected error occurred while fetching predictions."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [payload, apiUrl, cropData]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600 dark:text-gray-300">
        🔄 Predicting best crop...
      </div>
    );
  }

  if (apiError || !apiResult) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle
              className="text-red-500 mt-1 flex-shrink-0"
              size={24}
            />
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
            <p>
              While we couldn't provide specific crop recommendations, here are
              some general tips:
            </p>
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
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-800 rounded-2xl p-6 border border-green-200 dark:border-green-700">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {apiResult.crop}
          </h3>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {Math.round(apiResult.top3[0].prob * 100)}% Match
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            This crop is the top recommendation from our ML model based on your
            soil and climate data.
          </p>
        </div>

        {/* Top 3 predictions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Top 3 Predictions
          </h4>
          <ul className="space-y-1">
            {apiResult.top3.map((item, idx) => (
              <li
                key={idx}
                className="flex justify-between text-gray-700 dark:text-gray-300"
              >
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
            <AlertTriangle
              className="text-yellow-600 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div>
              <p className="text-yellow-800 text-sm font-medium">
                Soil Advice Notice
              </p>
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
          {/* ... same as your branch’s soil advice rendering ... */}
        </div>
      )}

      {/* General Growing Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <AlertTriangle className="text-orange-500 mr-2" size={24} />
          General Growing Tips
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          Ensure proper irrigation, pest control, and nutrient management for
          optimal yields.{" "}
          {!apiResult.soil_specific_advice &&
            cropData.soilType &&
            "For more detailed advice, ensure your soil type data is properly configured."}
        </p>
      </div>
    </div>
  );
};

export default CropRecommendation;
