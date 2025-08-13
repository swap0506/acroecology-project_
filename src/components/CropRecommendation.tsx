import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface CropData {
  rainfall: string;
  temperature: string;
  humidity: string;
  phosphorous: string;
  potassium: string;
  nitrogen: string;
  ph: string;
}

interface CropRecommendationProps {
  cropData: CropData;
}

interface ApiTop3 {
  crop: string;
  prob: number;
}

interface ApiResponse {
  crop: string;
  top3: ApiTop3[];
  probs?: Record<string, number>;
}

const CropRecommendation: React.FC<CropRecommendationProps> = ({ cropData }) => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const payload = {
          N: Number(cropData.nitrogen),
          P: Number(cropData.phosphorous),
          K: Number(cropData.potassium),
          temperature: Number(cropData.temperature),
          humidity: Number(cropData.humidity),
          ph: Number(cropData.ph),
          rainfall: Number(cropData.rainfall),
        };

        const res = await fetch(
          import.meta.env.VITE_API_BASE_URL
            ? `${import.meta.env.VITE_API_BASE_URL}/predict`
            : "http://localhost:8000/predict",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        setApiResult(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setApiError(err.message);
        } else {
          setApiError("Failed to fetch prediction");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [cropData]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        🔄 Predicting best crop...
      </div>
    );
  }

  if (apiError || !apiResult) {
    return (
      <div className="p-4 text-center text-red-600">
        ❌ Could not fetch AI prediction. Showing no results.
        <br />
        <small>{apiError}</small>
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

      {/* Growing Tips */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <AlertTriangle className="text-orange-500 mr-2" size={24} />
          General Growing Tips
        </h4>
        <p className="text-gray-700">
          Ensure proper irrigation, pest control, and nutrient management for
          optimal yields.
        </p>
      </div>
    </div>
  );
};

export default CropRecommendation;
