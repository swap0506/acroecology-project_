import React from 'react';
import { Leaf, Droplets, Sun, Clock, TrendingUp, AlertTriangle, CheckCircle, Atom, Zap, FlaskConical, Beaker } from 'lucide-react';

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

const CropRecommendation: React.FC<CropRecommendationProps> = ({ cropData }) => {
  // Enhanced crop recommendation logic based on all input values
  const getRecommendedCrop = () => {
    const rainfall = parseFloat(cropData.rainfall) || 0;
    const temperature = parseFloat(cropData.temperature) || 0;
    const humidity = parseFloat(cropData.humidity) || 0;
    const ph = parseFloat(cropData.ph) || 7;
    const nitrogen = parseFloat(cropData.nitrogen) || 0;
    const phosphorous = parseFloat(cropData.phosphorous) || 0;
    const potassium = parseFloat(cropData.potassium) || 0;

    // Calculate overall soil fertility score
    const soilFertility = (nitrogen + phosphorous + potassium) / 3;
    
    // Rice conditions - high water, warm temp, good nutrients
    if (rainfall > 200 && temperature > 25 && humidity > 70 && nitrogen > 40 && ph >= 5.5 && ph <= 7) {
      const confidence = Math.min(95, 75 + (soilFertility / 10) + (humidity - 70) / 2);
      return {
        name: 'Rice',
        emoji: '🌾',
        confidence: Math.round(confidence),
        yield: soilFertility > 50 ? 'Very High' : soilFertility > 30 ? 'High' : 'Medium',
        growthPeriod: '120-150 days',
        waterRequirement: 'High',
        description: `Excellent conditions for rice cultivation with optimal water availability and nutrient levels. Soil fertility score: ${Math.round(soilFertility)}/100`,
        tips: [
          'Maintain consistent water levels throughout growing season',
          `With N:${nitrogen}, P:${phosphorous}, K:${potassium} - consider balanced fertilization`,
          'Monitor for blast disease in humid conditions',
          'Ensure proper drainage during harvest'
        ],
        marketPrice: '$450-550 per ton',
        profitability: soilFertility > 50 ? 'Very High' : 'High'
      };
    }
    
    // Wheat conditions - cool temp, moderate water, good phosphorous
    if (temperature >= 15 && temperature <= 25 && rainfall >= 50 && rainfall <= 200 && phosphorous > 20 && ph >= 6 && ph <= 7.5) {
      const confidence = Math.min(92, 70 + (phosphorous / 5) + (25 - temperature));
      return {
        name: 'Wheat',
        emoji: '🌾',
        confidence: Math.round(confidence),
        yield: phosphorous > 40 && nitrogen > 30 ? 'Very High' : phosphorous > 25 ? 'High' : 'Medium',
        growthPeriod: '90-120 days',
        waterRequirement: 'Moderate',
        description: `Ideal cool climate conditions for wheat with balanced nutrients. Phosphorous level: ${phosphorous} kg/ha is ${phosphorous > 30 ? 'excellent' : 'adequate'}`,
        tips: [
          'Plant during cooler months for optimal tillering',
          `Nitrogen at ${nitrogen} kg/ha - ${nitrogen > 40 ? 'excellent for grain protein' : 'consider additional N for better yield'}`,
          'Monitor soil moisture during grain filling stage',
          `Potassium at ${potassium} kg/ha helps with disease resistance`
        ],
        marketPrice: '$380-420 per ton',
        profitability: soilFertility > 40 ? 'High' : 'Medium-High'
      };
    }

    // Maize conditions - warm temp, good nitrogen, balanced nutrients
    if (temperature >= 20 && temperature <= 32 && nitrogen > 30 && potassium > 15 && rainfall > 80) {
      const confidence = Math.min(90, 65 + (nitrogen / 8) + (potassium / 4));
      return {
        name: 'Maize',
        emoji: '🌽',
        confidence: Math.round(confidence),
        yield: nitrogen > 60 && potassium > 30 ? 'Very High' : nitrogen > 40 ? 'High' : 'Medium',
        growthPeriod: '90-120 days',
        waterRequirement: 'Moderate-High',
        description: `Good conditions for maize with adequate nitrogen and potassium. N:P:K ratio is ${Math.round(nitrogen)}:${Math.round(phosphorous)}:${Math.round(potassium)}`,
        tips: [
          `Nitrogen at ${nitrogen} kg/ha - ${nitrogen > 50 ? 'excellent for vegetative growth' : 'consider split application'}`,
          'Ensure consistent water supply during tasseling and grain filling',
          `Potassium at ${potassium} kg/ha helps with stalk strength`,
          'Control weeds during early growth stages'
        ],
        marketPrice: '$320-380 per ton',
        profitability: soilFertility > 45 ? 'High' : 'Medium-High'
      };
    }

    // Cotton conditions - warm temp, high potassium, moderate humidity
    if (temperature > 25 && potassium > 20 && humidity >= 40 && humidity <= 70 && rainfall > 100) {
      const confidence = Math.min(88, 60 + (potassium / 3) + (temperature - 25));
      return {
        name: 'Cotton',
        emoji: '🌿',
        confidence: Math.round(confidence),
        yield: potassium > 35 && phosphorous > 25 ? 'High' : 'Medium-High',
        growthPeriod: '150-180 days',
        waterRequirement: 'High',
        description: `Suitable warm climate for cotton with good potassium levels. K:${potassium} kg/ha supports fiber quality`,
        tips: [
          `Potassium at ${potassium} kg/ha - ${potassium > 30 ? 'excellent for fiber strength' : 'consider additional K fertilizer'}`,
          'Monitor for bollworm and whitefly infestations',
          `Phosphorous at ${phosphorous} kg/ha aids in root development`,
          'Ensure proper plant spacing for air circulation'
        ],
        marketPrice: '$1200-1500 per ton',
        profitability: potassium > 30 ? 'High' : 'Medium-High'
      };
    }

    // Soybean conditions - moderate temp, good phosphorous, neutral pH
    if (temperature >= 20 && temperature <= 30 && phosphorous > 15 && ph >= 6 && ph <= 7.5 && rainfall > 60) {
      const confidence = Math.min(85, 60 + (phosphorous / 4) + ((7 - Math.abs(ph - 6.8)) * 5));
      return {
        name: 'Soybean',
        emoji: '🫘',
        confidence: Math.round(confidence),
        yield: phosphorous > 30 && nitrogen > 20 ? 'High' : 'Medium-High',
        growthPeriod: '100-130 days',
        waterRequirement: 'Moderate',
        description: `Good conditions for soybean with balanced pH and nutrients. pH ${ph} is ${ph >= 6.5 && ph <= 7 ? 'optimal' : 'acceptable'}`,
        tips: [
          `Phosphorous at ${phosphorous} kg/ha supports nodulation and pod filling`,
          'Consider rhizobia inoculation for nitrogen fixation',
          `pH at ${ph} - ${ph < 6.5 ? 'consider liming' : ph > 7.5 ? 'monitor nutrient availability' : 'excellent for nutrient uptake'}`,
          'Ensure good drainage to prevent root rot'
        ],
        marketPrice: '$400-500 per ton',
        profitability: 'Medium-High'
      };
    }

    // Tomato conditions - warm temp, high nutrients, slightly acidic pH
    if (temperature >= 18 && temperature <= 29 && nitrogen > 25 && phosphorous > 20 && potassium > 25 && ph >= 6 && ph <= 7) {
      const confidence = Math.min(87, 55 + (soilFertility / 6) + (humidity / 10));
      return {
        name: 'Tomato',
        emoji: '🍅',
        confidence: Math.round(confidence),
        yield: soilFertility > 40 ? 'Very High' : 'High',
        growthPeriod: '70-100 days',
        waterRequirement: 'High',
        description: `Excellent conditions for tomato with balanced nutrition. NPK levels support vigorous growth and fruiting`,
        tips: [
          `Balanced NPK (${Math.round(nitrogen)}:${Math.round(phosphorous)}:${Math.round(potassium)}) excellent for fruit development`,
          'Provide consistent moisture but avoid waterlogging',
          'Support plants with stakes or cages',
          'Monitor for blight diseases in humid conditions'
        ],
        marketPrice: '$600-800 per ton',
        profitability: 'High'
      };
    }

    // Default recommendation based on overall conditions
    const avgTemp = temperature || 25;
    const avgNutrient = soilFertility || 30;
    
    return {
      name: 'Mixed Vegetables',
      emoji: '🥬',
      confidence: Math.min(80, 50 + (avgNutrient / 5) + (rainfall / 20)),
      yield: avgNutrient > 35 ? 'Medium-High' : 'Medium',
      growthPeriod: '60-90 days',
      waterRequirement: 'Moderate',
      description: `Your soil conditions (N:${nitrogen}, P:${phosphorous}, K:${potassium}) are suitable for diverse vegetable cultivation with pH ${ph}`,
      tips: [
        `With current nutrient levels, consider ${avgNutrient < 30 ? 'organic matter addition' : 'balanced fertilization'}`,
        'Implement crop rotation for soil health improvement',
        `pH at ${ph} - ${ph < 6.5 ? 'add lime for better nutrient availability' : ph > 7.5 ? 'add sulfur to lower pH' : 'maintain current pH levels'}`,
        'Use integrated pest management practices'
      ],
      marketPrice: '$200-400 per ton',
      profitability: 'Medium'
    };
  };

  const recommendedCrop = getRecommendedCrop();

  const getConditionStatus = (value: number, min: number, max: number, optimal?: number) => {
    if (optimal && Math.abs(value - optimal) <= (max - min) * 0.1) return 'optimal';
    if (value >= min && value <= max) return 'optimal';
    if (value < min * 0.7 || value > max * 1.3) return 'poor';
    return 'fair';
  };

  const getNutrientStatus = (value: number, low: number, high: number) => {
    if (value >= high) return 'high';
    if (value >= low) return 'medium';
    return 'low';
  };

  const conditions = [
    {
      name: 'Rainfall',
      value: cropData.rainfall,
      unit: 'mm',
      status: getConditionStatus(parseFloat(cropData.rainfall) || 0, 100, 300),
      icon: Droplets,
      color: 'blue'
    },
    {
      name: 'Temperature',
      value: cropData.temperature,
      unit: '°C',
      status: getConditionStatus(parseFloat(cropData.temperature) || 0, 15, 35, 25),
      icon: Sun,
      color: 'orange'
    },
    {
      name: 'Humidity',
      value: cropData.humidity,
      unit: '%',
      status: getConditionStatus(parseFloat(cropData.humidity) || 0, 40, 80),
      icon: Droplets,
      color: 'cyan'
    },
    {
      name: 'pH Level',
      value: cropData.ph,
      unit: '',
      status: getConditionStatus(parseFloat(cropData.ph) || 7, 6, 7.5, 6.8),
      icon: Beaker,
      color: 'purple'
    },
    {
      name: 'Nitrogen',
      value: cropData.nitrogen,
      unit: 'kg/ha',
      status: getNutrientStatus(parseFloat(cropData.nitrogen) || 0, 30, 60),
      icon: FlaskConical,
      color: 'green'
    },
    {
      name: 'Phosphorous',
      value: cropData.phosphorous,
      unit: 'kg/ha',
      status: getNutrientStatus(parseFloat(cropData.phosphorous) || 0, 20, 40),
      icon: Atom,
      color: 'indigo'
    },
    {
      name: 'Potassium',
      value: cropData.potassium,
      unit: 'kg/ha',
      status: getNutrientStatus(parseFloat(cropData.potassium) || 0, 15, 35),
      icon: Zap,
      color: 'emerald'
    }
  ];

  const getStatusColor = (status: string, baseColor: string) => {
    switch (status) {
      case 'optimal':
      case 'high':
        return `text-green-500 bg-green-100`;
      case 'medium':
      case 'fair':
        return `text-yellow-500 bg-yellow-100`;
      case 'low':
      case 'poor':
        return `text-red-500 bg-red-100`;
      default:
        return `text-${baseColor}-500 bg-${baseColor}-100`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'optimal': return 'Optimal';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'fair': return 'Fair';
      case 'low': return 'Low';
      case 'poor': return 'Poor';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Recommendation Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{recommendedCrop.emoji}</div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">{recommendedCrop.name}</h3>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {recommendedCrop.confidence}% Match
            </div>
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {recommendedCrop.profitability} Profit
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">{recommendedCrop.description}</p>
        </div>

        {/* Crop Details Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <TrendingUp className="text-green-500 mx-auto mb-2" size={24} />
            <p className="text-sm text-gray-600">Expected Yield</p>
            <p className="font-semibold text-gray-800">{recommendedCrop.yield}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <Clock className="text-blue-500 mx-auto mb-2" size={24} />
            <p className="text-sm text-gray-600">Growth Period</p>
            <p className="font-semibold text-gray-800">{recommendedCrop.growthPeriod}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <Droplets className="text-cyan-500 mx-auto mb-2" size={24} />
            <p className="text-sm text-gray-600">Water Need</p>
            <p className="font-semibold text-gray-800">{recommendedCrop.waterRequirement}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <Leaf className="text-emerald-500 mx-auto mb-2" size={24} />
            <p className="text-sm text-gray-600">Market Price</p>
            <p className="font-semibold text-gray-800">{recommendedCrop.marketPrice}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Condition Analysis */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <CheckCircle className="text-green-500 mr-2" size={24} />
          Complete Condition Analysis
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {conditions.map((condition, index) => {
            const Icon = condition.icon;
            const statusColorClass = getStatusColor(condition.status, condition.color);
            
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`text-${condition.color}-500`} size={20} />
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColorClass}`}>
                    {getStatusText(condition.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{condition.name}</p>
                <p className="font-semibold text-gray-800">
                  {condition.value} {condition.unit}
                </p>
                {/* Progress bar for nutrients */}
                {['Nitrogen', 'Phosphorous', 'Potassium'].includes(condition.name) && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${condition.color}-500`}
                        style={{ 
                          width: `${Math.min(100, (parseFloat(condition.value) / 80) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Nutrient Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-gray-800 mb-2">Soil Fertility Summary</h5>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">NPK Ratio:</span>
              <span className="font-semibold ml-2">
                {Math.round(parseFloat(cropData.nitrogen) || 0)}:
                {Math.round(parseFloat(cropData.phosphorous) || 0)}:
                {Math.round(parseFloat(cropData.potassium) || 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Overall Fertility:</span>
              <span className="font-semibold ml-2">
                {Math.round(((parseFloat(cropData.nitrogen) || 0) + 
                           (parseFloat(cropData.phosphorous) || 0) + 
                           (parseFloat(cropData.potassium) || 0)) / 3)} kg/ha avg
              </span>
            </div>
            <div>
              <span className="text-gray-600">pH Status:</span>
              <span className="font-semibold ml-2">
                {parseFloat(cropData.ph) < 6.5 ? 'Acidic' : 
                 parseFloat(cropData.ph) > 7.5 ? 'Alkaline' : 'Neutral'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Growing Tips */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <AlertTriangle className="text-orange-500 mr-2" size={24} />
          Personalized Growing Tips
        </h4>
        <div className="space-y-3">
          {recommendedCrop.tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                <CheckCircle className="text-green-600" size={16} />
              </div>
              <p className="text-gray-700 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
        
        {/* Additional Recommendations */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h5 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h5>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Monitor soil moisture regularly during critical growth stages</li>
            <li>• Consider soil testing every 2-3 years for optimal nutrient management</li>
            <li>• Implement integrated pest management for sustainable farming</li>
            <li>• Keep detailed records of inputs and yields for future planning</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;