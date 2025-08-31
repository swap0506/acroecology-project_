# CropVision - Soil Type Analysis Feature

An intelligent crop recommendation system enhanced with comprehensive soil type analysis capabilities.

## 🌱 Features

### Core Functionality
- **Multi-step Interactive Form**: Intuitive data collection for environmental parameters
- **ML-Powered Predictions**: Advanced machine learning models for crop recommendations
- **Soil Type Integration**: Comprehensive soil analysis with 6 soil types (Sandy, Clay, Loamy, Silty, Peaty, Chalky)

### Soil-Specific Features
- **Compatibility Scoring**: Detailed crop-soil compatibility analysis
- **Amendment Recommendations**: Tailored soil improvement suggestions
- **Irrigation Guidance**: Soil-specific watering recommendations
- **Variety Suggestions**: Crop varieties optimized for specific soil types
- **Warning System**: Alerts for poor crop-soil combinations

### Technical Features
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Error Handling**: Comprehensive error management and graceful degradation
- **Performance Optimization**: Caching, memoization, and efficient data loading
- **Comprehensive Testing**: Unit, integration, and E2E test coverage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+ and pip
- Git

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>
cd cropvision

# Install dependencies
npm install

---

## 📝 Description

CropVision transforms raw agronomic inputs—like rainfall, temperature, humidity, and macronutrient levels—into **clear, actionable recommendations**. The app blends a clean, modern UI with interactive storytelling to guide users through each input, explain *why* it matters, and surface **confidence-scored predictions** with tips for success. A built-in dashboard visualizes trends, tracks past predictions, and helps compare how conditions have changed over time. Whether you’re a student, a precision-ag professional, or a farmer experimenting with field plots, CropVision makes agronomic decision-making **simple, transparent, and visual**.

---

### ✨ Key Features


# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to ML service
cd ml-service

# Install Python dependencies
pip install -r requirements.txt

---

## 🎯 Goals

- **Enhance decision quality**: Provide reliable, interpretable crop suggestions based on seven core parameters.
- **Make agronomy approachable**: Use friendly UI, tooltips, and micro-explanations to cut through jargon.
- **Promote sustainability**: Encourage crop choices that suit local conditions, reducing waste and inputs.
- **Support learning and iteration**: Save, compare, and export predictions to study what works best.
- **Be fast and accessible**: Lightweight frontend with responsive design for mobile and rural connectivity.

---

## 🎯 How It Works


# Install test dependencies (optional)
pip install -r test-requirements.txt

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🧪 Testing

### Frontend Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage


# Run tests in UI mode
npm run test:ui
```

## 🧪 Example

### Sample Input
```
Field: North Plot A
Rainfall: 210 mm
Temperature: 28 °C
Humidity: 75 %
Nitrogen (N): 90 kg/ha
Phosphorous (P): 50 kg/ha
Potassium (K): 80 kg/ha
pH: 6.3
```

### Sample Output (Illustrative)
- **Top Recommendation:** 🌾 **Rice**
- **Confidence:** 0.86
- **Reasoning (excerpt):** High rainfall and warm temperatures favor paddy cultivation; near‑slightly‑acidic pH is suitable; NPK balance supports vegetative growth.
- **Alternatives:** Maize (0.62), Tomato (0.48)
- **Tips:** Maintain standing water during early growth; monitor N top‑dress at tillering.

> *Note:* Outputs depend on your model/weights and may vary based on region/season.

---

## 🧭 Usage Instructions

### 1. Start a New Prediction
- Go to **Predict** → Enter your field/site name.
- Provide the seven parameters (rainfall, temperature, humidity, N, P, K, pH).
- Use on‑screen hints to understand recommended ranges and units.
- Click **Predict Crop**.

### 2. Understand the Results
- Review the **Top Recommended Crop** with a **confidence score**.
- Explore **Why this crop?** to see factor‑by‑factor reasoning.
- View **Growing Tips** (e.g., irrigation, nutrient balance, pH adjustments).

### 3. Track & Compare
- Open the **Dashboard** to see:
  - Recent predictions and outcomes
  - Distribution of recommended crops
  - Trend lines for inputs (e.g., rainfall vs. crop choice)
- Use **Filters** (date range, field, season) to compare scenarios.

### 4. Export & Share
- Click **Export** on the dashboard to download CSV/JSON of predictions and analytics.
- Attach exports to reports or share with collaborators.

---

## 🚀 Getting Started


### Backend Tests
```bash
cd ml-service
python -m pytest app/test_soil_functionality.py -v
python -m pytest app/test_integration.py -v
```

## 📁 Project Structure

```
cropvision/
├── src/
│   ├── components/
│   │   ├── SoilTypeSelector.tsx      # Soil type selection component
│   │   ├── CropRecommendation.tsx    # Enhanced recommendation display
│   │   └── __tests__/                # Component tests
│   ├── services/
│   │   ├── soilTypeService.ts        # Soil data management service
│   │   └── __tests__/                # Service tests
│   ├── types/
│   │   ├── soilTypes.ts              # TypeScript interfaces and utilities
│   │   └── __tests__/                # Type utility tests
│   ├── data/
│   │   └── soilTypes.json            # Frontend soil data
│   ├── utils/
│   │   └── performance.ts            # Performance monitoring utilities
│   └── test/
│       ├── integration/              # Integration tests
│       └── e2e/                      # End-to-end tests
├── ml-service/
│   └── app/
│       ├── main.py                   # FastAPI application with soil features
│       ├── soil_types.json           # Backend soil data
│       ├── test_soil_functionality.py # Unit tests
│       └── test_integration.py       # Integration tests
└── docs/
    └── soil-analysis-spec/           # Feature specification documents
```

## 🎯 Usage Guide

### Basic Crop Recommendation
1. Click "Begin Your Journey" on the landing page
2. Fill in environmental parameters (rainfall, temperature, humidity, etc.)
3. Complete the multi-step form
4. View your personalized crop recommendations

### Soil Type Analysis
1. During the form process, you'll reach the soil type selection step
2. Choose from 6 soil types: Sandy, Clay, Loamy, Silty, Peaty, or Chalky
3. View detailed soil descriptions and characteristics
4. Receive enhanced recommendations including:
   - Soil-crop compatibility scores
   - Soil amendment suggestions
   - Irrigation guidance
   - Variety recommendations
   - Compatibility warnings

### API Usage
```javascript
// Make a prediction request with soil type
const response = await fetch('/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    N: 90,
    P: 42,
    K: 43,
    temperature: 22.4,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 180.0,
    soil_type: 'sandy'  // Optional soil type parameter
  })
});

const data = await response.json();
// Response includes soil_specific_advice when soil_type is provided
```

## 🔧 Configuration

### Soil Data Customization
Modify `src/data/soilTypes.json` and `ml-service/app/soil_types.json` to:
- Add new soil types
- Update compatibility matrices
- Modify amendment recommendations
- Adjust irrigation guidance

### Performance Tuning
- Backend caching is enabled by default using `@lru_cache`
- Frontend components use React.memo and useMemo for optimization
- Performance monitoring is available via `PerformanceMonitor` utility

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with production ASGI server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment (Optional)
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]

# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY ml-service/requirements.txt .
RUN pip install -r requirements.txt
COPY ml-service/ .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📊 Performance Metrics

The application includes built-in performance monitoring:
- API response times
- Component render times
- Soil data loading performance
- User interaction metrics

Access metrics in development mode through the browser console or performance monitoring utilities.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test` and `pytest`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use semantic commit messages
- Update documentation for new features
- Ensure mobile responsiveness

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Machine Learning models for crop prediction
- Soil science research for compatibility matrices
- Agricultural extension services for variety recommendations
- Open source community for tools and libraries

## 📞 Support

For support, please:
1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs
4. Provide system information and logs when relevant

---

**Built with ❤️ for sustainable agriculture and smart farming by Swapna K. and Deep Das**
