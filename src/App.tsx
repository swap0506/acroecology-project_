import React, { useState, useEffect } from 'react';
import { Sprout, CloudRain, Thermometer, Atom, Beaker, FlaskConical, Zap, ArrowRight, Leaf, Sun, Droplets, RotateCcw, TrendingUp, Wind, User, LogOut, Home, Settings, Bell } from 'lucide-react';
import AuthModal from './components/AuthModal';
import CropRecommendation from './components/CropRecommendation';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import SettingsPage from './components/Settings';


{/* <Route path="/crop-recommendation" element={<CropRecommendation />} /> */}


interface CropData {
  rainfall: string;
  temperature: string;
  humidity: string;
  phosphorous: string;
  potassium: string;
  nitrogen: string;
  ph: string;
}

interface User {
  name: string;
  email: string;
}

const App = () => {
  const [currentStep, setCurrentStep] = useState(-1); // Start with landing page
  const [currentPage, setCurrentPage] = useState('prediction'); // 'prediction', 'dashboard', 'analytics', 'settings'
  const [cropData, setCropData] = useState<CropData>({
    rainfall: '',
    temperature: '',
    humidity: '',
    phosphorous: '',
    potassium: '',
    nitrogen: '',
    ph: ''
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPlantGrowth, setShowPlantGrowth] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [predictionCount, setPredictionCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Load user data and prediction count from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cropVisionUser');
    const savedCount = localStorage.getItem('cropPredictionCount');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (savedCount) {
      setPredictionCount(parseInt(savedCount, 10));
    }
  }, []);

  // Save prediction count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cropPredictionCount', predictionCount.toString());
  }, [predictionCount]);

  const steps = [
    {
      key: 'rainfall',
      title: 'Monsoon\'s Gift',
      subtitle: 'The life-giving drops from heaven',
      placeholder: 'Enter rainfall (mm)',
      icon: CloudRain,
      story: 'In the ancient dance of agriculture, water is the first blessing. Each drop carries the promise of life, awakening seeds from their slumber...',
      background: 'bg-gradient-to-br from-blue-900 via-slate-800 to-indigo-900',
      animation: 'rain-drops',
      feedback: {
        low: 'Light rainfall detected. Your crops will need careful water management and possibly irrigation support.',
        medium: 'Moderate rainfall - perfect for most crops! This balanced moisture will support healthy growth.',
        high: 'Abundant rainfall! Excellent for water-loving crops, but ensure proper drainage to prevent waterlogging.'
      },
      thresholds: { low: 100, high: 300 }
    },
    {
      key: 'temperature',
      title: 'Solar Embrace',
      subtitle: 'The warmth that awakens growth',
      placeholder: 'Enter temperature (°C)',
      icon: Thermometer,
      story: 'As the sun rises over fertile fields, its golden rays penetrate the soil, stirring life within every seed. Temperature is the conductor of nature\'s symphony...',
      background: 'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-600',
      animation: 'sun-rays',
      feedback: {
        low: 'Cool climate detected. Perfect for temperate crops like wheat, barley, and cool-season vegetables.',
        medium: 'Ideal temperature range! Most crops will thrive in this balanced thermal environment.',
        high: 'Warm climate conditions. Excellent for tropical crops like rice, sugarcane, and heat-loving vegetables.'
      },
      thresholds: { low: 20, high: 30 }
    },
    {
      key: 'humidity',
      title: 'Atmospheric Moisture',
      subtitle: 'The invisible embrace of water vapor',
      placeholder: 'Enter humidity (%)',
      icon: Wind,
      story: 'Floating unseen through the air, humidity wraps around every leaf like a gentle caress. It determines how plants breathe and how diseases spread...',
      background: 'bg-gradient-to-br from-cyan-600 via-blue-500 to-indigo-600',
      animation: 'humidity-waves',
      feedback: {
        low: 'Low humidity detected. Plants may need more frequent watering and could be stressed in dry conditions.',
        medium: 'Perfect humidity levels! Ideal conditions for most crops with balanced moisture in the air.',
        high: 'High humidity environment. Great for tropical crops but watch for fungal diseases and ensure good air circulation.'
      },
      thresholds: { low: 40, high: 70 }
    },
    {
      key: 'phosphorous',
      title: 'Root\'s Foundation',
      subtitle: 'The mineral that builds strength',
      placeholder: 'Enter phosphorous (kg/ha)',
      icon: Atom,
      story: 'Deep beneath the earth\'s surface, phosphorous waits like buried treasure. It strengthens roots, fuels flowering, and ensures the next generation...',
      background: 'bg-gradient-to-br from-purple-800 via-violet-700 to-indigo-800',
      animation: 'mineral-crystals',
      feedback: {
        low: 'Low phosphorous levels. Consider phosphate fertilizers to boost root development and flowering.',
        medium: 'Good phosphorous content! Your crops will develop strong root systems and healthy blooms.',
        high: 'Rich phosphorous levels! Excellent for root crops and flowering plants. Monitor to prevent over-fertilization.'
      },
      thresholds: { low: 20, high: 50 }
    },
    {
      key: 'potassium',
      title: 'Guardian\'s Shield',
      subtitle: 'The protector against adversity',
      placeholder: 'Enter potassium (kg/ha)',
      icon: Zap,
      story: 'Like an invisible armor, potassium fortifies plants against drought, disease, and harsh weather. It is the guardian that ensures survival...',
      background: 'bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700',
      animation: 'energy-shield',
      feedback: {
        low: 'Potassium deficiency detected. Plants may be vulnerable to stress. Consider potash fertilizers.',
        medium: 'Balanced potassium levels! Your crops will have good disease resistance and stress tolerance.',
        high: 'Excellent potassium content! Plants will be highly resilient to environmental stresses.'
      },
      thresholds: { low: 15, high: 40 }
    },
    {
      key: 'nitrogen',
      title: 'Verdant Awakening',
      subtitle: 'The essence of green vitality',
      placeholder: 'Enter nitrogen (kg/ha)',
      icon: FlaskConical,
      story: 'Nitrogen flows through the plant like liquid emerald, painting leaves in vibrant green and fueling the engine of photosynthesis...',
      background: 'bg-gradient-to-br from-green-800 via-emerald-600 to-lime-700',
      animation: 'chlorophyll-flow',
      feedback: {
        low: 'Nitrogen deficiency may cause yellowing leaves. Consider nitrogen-rich fertilizers for better growth.',
        medium: 'Optimal nitrogen levels! Expect lush, green foliage and vigorous vegetative growth.',
        high: 'High nitrogen content! Great for leafy crops, but monitor to prevent excessive vegetative growth.'
      },
      thresholds: { low: 30, high: 80 }
    },
    {
      key: 'ph',
      title: 'Chemical Harmony',
      subtitle: 'The balance that unlocks potential',
      placeholder: 'Enter pH value (0-14)',
      icon: Beaker,
      story: 'In the delicate chemistry of soil, pH holds the master key. It unlocks nutrients, enables absorption, and creates the perfect environment for life to flourish...',
      background: 'bg-gradient-to-br from-rose-700 via-pink-600 to-fuchsia-700',
      animation: 'ph-balance',
      feedback: {
        acidic: 'Acidic soil detected (pH < 6.5). Good for acid-loving crops like blueberries, but may need lime for others.',
        neutral: 'Perfect pH balance! Most crops will thrive in this neutral to slightly acidic environment.',
        alkaline: 'Alkaline soil (pH > 7.5). Suitable for some crops, but may need sulfur amendments for acid-loving plants.'
      },
      thresholds: { acidic: 6.5, alkaline: 7.5 }
    }
  ];

  const getFeedback = (stepIndex: number, value: string) => {
    const step = steps[stepIndex];
    const numValue = parseFloat(value);
    
    if (step.key === 'ph') {
      if (numValue < step.thresholds.acidic) return step.feedback.acidic;
      if (numValue > step.thresholds.alkaline) return step.feedback.alkaline;
      return step.feedback.neutral;
    } else {
      if (numValue < step.thresholds.low) return step.feedback.low;
      if (numValue > step.thresholds.high) return step.feedback.high;
      return step.feedback.medium;
    }
  };

  const handleInputChange = (value: string) => {
    // Ensure we have a valid current step
    if (currentStep < 0 || currentStep >= steps.length) return;
    
    const currentKey = steps[currentStep].key as keyof CropData;
    setCropData(prev => ({ ...prev, [currentKey]: value }));
    setShowFeedback(false);
  };

  // Check if current input is valid for proceeding
  const isCurrentInputValid = () => {
    if (currentStep < 0 || currentStep >= steps.length) return false;
    
    const currentKey = steps[currentStep].key as keyof CropData;
    const currentValue = cropData[currentKey];
    
    // Check if value exists and is not empty
    if (!currentValue || currentValue.trim() === '') return false;
    
    // Check if it's a valid number
    const numValue = parseFloat(currentValue);
    if (isNaN(numValue)) return false;
    
    // Additional validation for specific fields
    if (currentKey === 'ph') {
      return numValue >= 0 && numValue <= 14;
    }
    
    // For other fields, just check if it's a positive number
    return numValue >= 0;
  };

  const handleNext = () => {
    if (currentStep === -1) {
      // From landing page to first step
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(0);
        setIsTransitioning(false);
      }, 800);
    } else if (currentStep < steps.length - 1) {
      // Show feedback first
      setShowFeedback(true);
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
          setIsTransitioning(false);
          setShowFeedback(false);
        }, 800);
      }, 2000);
    } else {
      // Final step - show feedback then plant growth
      setShowFeedback(true);
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setShowPlantGrowth(true);
          // Increment prediction count when showing final result
          setPredictionCount(prev => prev + 1);
        }, 800);
      }, 2000);
    }
  };

  const handlePredictAnother = () => {
    // Reset all states to start over
    setShowPlantGrowth(false);
    setCurrentStep(-1);
    setCurrentPage('prediction');
    setCropData({
      rainfall: '',
      temperature: '',
      humidity: '',
      phosphorous: '',
      potassium: '',
      nitrogen: '',
      ph: ''
    });
    setShowFeedback(false);
    setIsTransitioning(false);
  };

  const handleLogin = (email: string, password: string) => {
    // Simple login simulation - in real app, this would call an API
    const userData = { name: email.split('@')[0], email };
    setUser(userData);
    localStorage.setItem('cropVisionUser', JSON.stringify(userData));
  };

  const handleSignup = (name: string, email: string, password: string) => {
    // Simple signup simulation - in real app, this would call an API
    const userData = { name, email };
    setUser(userData);
    localStorage.setItem('cropVisionUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cropVisionUser');
    setCurrentPage('prediction');
    handlePredictAnother();
  };

  const handleUpdateUser = (userData: { name: string; email: string }) => {
    setUser(userData);
    localStorage.setItem('cropVisionUser', JSON.stringify(userData));
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  // Render different pages based on currentPage state
  if (currentPage === 'dashboard') {
    return (
      <>
        <Dashboard user={user} predictionCount={predictionCount} />
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => handleNavigation('prediction')}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          >
            <Sprout size={24} />
          </button>
        </div>
      </>
    );
  }

  if (currentPage === 'analytics') {
    return (
      <>
        <Analytics predictionCount={predictionCount} />
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => handleNavigation('prediction')}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          >
            <Sprout size={24} />
          </button>
        </div>
      </>
    );
  }

  if (currentPage === 'settings') {
    return (
      <>
        <SettingsPage user={user} onUpdateUser={handleUpdateUser} />
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => handleNavigation('prediction')}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          >
            <Sprout size={24} />
          </button>
        </div>
      </>
    );
  }

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="floating-seeds"></div>
        <div className="growing-vines"></div>
      </div>
      
      {/* Header with Auth */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <Sprout className="text-green-300" size={32} />
          <span className="text-white text-xl font-bold">CropVision</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <User className="text-white" size={20} />
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-full transition-all duration-300"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 pt-8 pb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-8">
            <Sprout size={48} className="text-green-300 animate-pulse" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Crop<span className="text-green-300">Vision</span>
          </h1>
          
          <p className="text-2xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Unlock the secrets of your soil and discover the perfect crop for your land through an immersive agricultural journey
          </p>
          
          {/* Prediction Counter Display */}
          {predictionCount > 0 && (
            <div className="mb-8">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                <TrendingUp className="text-green-300 mr-2" size={20} />
                <span className="text-white font-semibold">
                  {predictionCount} prediction{predictionCount !== 1 ? 's' : ''} completed
                </span>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-default">
              <Droplets className="text-blue-300 mb-4 mx-auto" size={32} />
              <h3 className="text-xl font-semibold text-white mb-2">Climate Analysis</h3>
              <p className="text-green-100">Analyze rainfall, temperature, and humidity patterns for optimal crop selection</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-default">
              <Atom className="text-purple-300 mb-4 mx-auto" size={32} />
              <h3 className="text-xl font-semibold text-white mb-2">Soil Chemistry</h3>
              <p className="text-green-100">Evaluate nutrient levels and pH balance for maximum yield potential</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-default">
              <Leaf className="text-green-300 mb-4 mx-auto" size={32} />
              <h3 className="text-xl font-semibold text-white mb-2">Smart Predictions</h3>
              <p className="text-green-100">Get AI-powered crop recommendations based on your unique conditions</p>
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-12 py-4 rounded-full text-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Begin Your Journey
            <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={24} />
          </button>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="relative z-10 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: CloudRain, title: "Weather Data", desc: "Input your local rainfall, temperature, and humidity conditions" },
              { icon: FlaskConical, title: "Soil Analysis", desc: "Provide nitrogen, phosphorous, and potassium levels" },
              { icon: Beaker, title: "pH Testing", desc: "Enter your soil's pH value for complete analysis" },
              { icon: Zap, title: "AI Processing", desc: "Our algorithm analyzes all parameters instantly" },
              { icon: Sprout, title: "Crop Prediction", desc: "Receive personalized crop recommendations" },
              { icon: Sun, title: "Growth Guidance", desc: "Get tips for optimal cultivation success" }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <feature.icon className="text-green-300 mb-4" size={32} />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-green-100">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const PlantGrowthAnimation = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex flex-col relative overflow-hidden">
      {/* Enhanced Header with Navigation */}
      <div className="relative z-20 bg-black/20 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Sprout className="text-white" size={28} />
                <span className="text-white text-xl font-bold">CropVision</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => handleNavigation('dashboard')}
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <Home size={18} />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => handleNavigation('analytics')}
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <TrendingUp size={18} />
                  <span>Analytics</span>
                </button>
                <button 
                  onClick={() => handleNavigation('settings')}
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
                <Bell size={20} />
              </button>
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <User className="text-white" size={18} />
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-2 rounded-full transition-all duration-300"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-medium transition-all duration-300"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Particles Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="floating-particles"></div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-8">
        <div className="text-center max-w-6xl mx-auto">
          <div className="plant-container mb-8">
            <div className="soil"></div>
            <div className="seed"></div>
            <div className="stem"></div>
            <div className="leaf leaf-1"></div>
            <div className="leaf leaf-2"></div>
            <div className="leaf leaf-3"></div>
            <div className="flower"></div>
            <div className="roots"></div>
          </div>
          
          <div className="prediction-result">
            <h2 className="text-4xl font-bold text-white mb-8 opacity-0 animate-fade-in-delayed">
              🌾 Your Perfect Crop Match
            </h2>
            
            {/* Enhanced Crop Recommendation */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 max-w-5xl mx-auto mb-6 shadow-2xl">
              <CropRecommendation cropData={cropData} />
              
              {/* Prediction Statistics */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{predictionCount}</p>
                    <p className="text-gray-600">Total Predictions</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <User className="text-blue-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">10,000+</p>
                    <p className="text-gray-600">Happy Farmers</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Leaf className="text-purple-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">95%</p>
                    <p className="text-gray-600">Success Rate</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  onClick={handlePredictAnother}
                  className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <RotateCcw className="inline-block mr-2 group-hover:rotate-180 transition-transform duration-500" size={20} />
                  Predict Another Crop
                </button>
                
                {!user && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <User className="inline-block mr-2" size={20} />
                    Save Your Results
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Footer */}
      <div className="relative z-10 bg-black/30 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 text-center">
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Policies</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Terms & Conditions</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Privacy</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Data Protection</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Blog</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Latest Insights</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Documentation</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">API Guide</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Pricing</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Plans & Features</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Help Center</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Support Hub</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Community</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Forum</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Contact</h4>
              <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Support</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/20 text-center">
            <p className="text-white/60 text-sm">© 2025 CropVision. All rights reserved. Empowering farmers with AI-driven insights.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (showPlantGrowth) {
    return (
      <>
        <PlantGrowthAnimation />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      </>
    );
  }

  if (currentStep === -1) {
    return (
      <>
        <LandingPage />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      </>
    );
  }

  const currentStepData = steps[currentStep];
  
  // Add defensive check to prevent undefined access
  if (!currentStepData) {
    return <LandingPage />;
  }
  
  const Icon = currentStepData.icon;
  const currentValue = cropData[currentStepData.key as keyof CropData];

  return (
    <>
      <div className={`min-h-screen transition-all duration-1000 ${currentStepData.background} ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} relative overflow-hidden`}>
        {/* Background Animations */}
        <div className="absolute inset-0 opacity-30">
          <div className={`animation-overlay ${currentStepData.animation}`}></div>
        </div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-lg mx-auto">
            {/* Story Text */}
            <div className="mb-8 opacity-0 animate-fade-in">
              <p className="text-white/90 text-lg italic leading-relaxed font-light">
                {currentStepData.story}
              </p>
            </div>

            {/* Icon */}
            <div className="mb-6 opacity-0 animate-fade-in-delayed">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <Icon size={48} className="text-white animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <div className="mb-8 opacity-0 animate-slide-up">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
                {currentStepData.title}
              </h1>
              <p className="text-white/90 text-xl font-light">
                {currentStepData.subtitle}
              </p>
            </div>

            {/* Input Card */}
            <div className="opacity-0 animate-slide-up-delayed">
              <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={currentStepData.key === 'ph' ? "14" : undefined}
                  placeholder={currentStepData.placeholder}
                  value={currentValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full px-6 py-4 text-xl text-center bg-white/90 rounded-2xl border-none outline-none focus:ring-4 focus:ring-white/50 transition-all duration-300 font-medium"
                  autoFocus
                />
                
                {/* Input Validation Hint */}
                <div className="mt-2 text-white/60 text-sm">
                  {currentStepData.key === 'ph' ? 'Enter a value between 0-14' : 'Enter a positive number'}
                </div>
                
                {showFeedback && currentValue && isCurrentInputValid() && (
                  <div className="mt-6 p-4 bg-white/20 rounded-xl border border-white/30 animate-fade-in">
                    <p className="text-white text-sm leading-relaxed">
                      {getFeedback(currentStep, currentValue)}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={!isCurrentInputValid()}
                  className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-white to-gray-100 text-gray-800 rounded-2xl font-semibold text-lg hover:from-gray-100 hover:to-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                >
                  {currentStep === steps.length - 1 ? '🌱 Predict My Crop' : 'Continue the Journey →'}
                </button>
              </div>
            </div>

            {/* Step Counter */}
            <div className="mt-8 opacity-0 animate-fade-in-delayed-2">
              <div className="flex justify-center space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index <= currentStep ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/70 mt-2 text-sm">
                Chapter {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
    </>
  );
};

export default App;