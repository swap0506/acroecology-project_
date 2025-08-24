import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('Complete User Journey E2E Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completes successful journey with high soil compatibility', async () => {
    // Mock successful API response with high compatibility
    const highCompatibilityResponse = {
      crop: 'carrots',
      top3: [
        { crop: 'carrots', prob: 0.9 },
        { crop: 'potatoes', prob: 0.08 },
        { crop: 'radishes', prob: 0.02 }
      ],
      probs: { carrots: 0.9, potatoes: 0.08, radishes: 0.02 },
      model_version: '1.0',
      soil_specific_advice: {
        compatibility_score: 0.9,
        amendments: [
          {
            name: 'Organic compost',
            purpose: 'Improve water retention and add nutrients',
            application_rate: '2-4 inches annually',
            timing: 'Spring before planting'
          }
        ],
        irrigation_tips: {
          frequency: 'More frequent watering needed (daily in hot weather)',
          duration: 'Shorter duration sessions (15-20 minutes)',
          method: 'Drip irrigation or soaker hoses preferred',
          special_notes: 'Water deeply but frequently to prevent nutrient leaching.'
        },
        warnings: [],
        variety_recommendations: ['Early varieties', 'Heat-tolerant cultivars']
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => highCompatibilityResponse
    })

    render(<App />)

    // 1. Landing page interaction
    expect(screen.getByText('CropVision')).toBeInTheDocument()
    expect(screen.getByText('Begin Your Journey')).toBeInTheDocument()

    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // 2. Complete all form steps with realistic data for carrots in sandy soil
    const formData = [
      { value: '120', step: 'rainfall' },      // Lower rainfall suitable for carrots
      { value: '18', step: 'temperature' },    // Cool temperature for carrots
      { value: '65', step: 'humidity' },       // Moderate humidity
      { value: '25', step: 'phosphorous' },    // Good phosphorous for root development
      { value: '35', step: 'potassium' },      // Good potassium for root quality
      { value: '40', step: 'nitrogen' },       // Moderate nitrogen (too much causes forking)
      { value: '6.2', step: 'ph' }             // Slightly acidic pH good for carrots
    ]

    for (const data of formData) {
      await waitFor(() => {
        const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(input).toBeInTheDocument()
      }, { timeout: 5000 })

      const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, data.value)

      // Wait for input to be processed
      await waitFor(() => {
        expect(input).toHaveValue(data.value)
      })

      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)

      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 3. Soil type selection
    await waitFor(() => {
      expect(screen.getByText("Earth's Foundation")).toBeInTheDocument()
    }, { timeout: 5000 })

    const soilSelector = screen.getByText('Select your soil type')
    await user.click(soilSelector)

    await waitFor(() => {
      expect(screen.getByText('Sandy')).toBeInTheDocument()
    })

    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)

    // Verify soil type selection
    await waitFor(() => {
      expect(screen.getByText('Sandy Soil')).toBeInTheDocument()
    })

    // Proceed to results
    const finalNext = screen.getByRole('button', { name: /next|continue/i })
    await user.click(finalNext)

    // 4. Verify prediction results
    await waitFor(() => {
      expect(screen.getByText('🌾 Your Perfect Crop Match')).toBeInTheDocument()
    }, { timeout: 10000 })

    // Verify API call was made correctly
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/predict',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          N: 40,
          P: 25,
          K: 35,
          temperature: 18,
          humidity: 65,
          ph: 6.2,
          rainfall: 120,
          soil_type: 'sandy'
        })
      })
    )

    // 5. Verify crop recommendation display
    expect(screen.getByText('carrots')).toBeInTheDocument()
    expect(screen.getByText('90% Match')).toBeInTheDocument()

    // 6. Verify soil-specific advice with high compatibility
    expect(screen.getByText('🌱 Soil-Specific Recommendations')).toBeInTheDocument()
    
    const compatibilityBadge = screen.getByText('90% Compatible')
    expect(compatibilityBadge).toBeInTheDocument()
    expect(compatibilityBadge).toHaveClass('bg-green-100', 'text-green-800')

    // 7. Verify no warnings (since compatibility is high)
    expect(screen.queryByText('Important Considerations')).not.toBeInTheDocument()

    // 8. Verify variety recommendations
    expect(screen.getByText('🌾 Recommended Varieties')).toBeInTheDocument()
    expect(screen.getByText('Early varieties')).toBeInTheDocument()
    expect(screen.getByText('Heat-tolerant cultivars')).toBeInTheDocument()

    // 9. Verify irrigation guidance
    expect(screen.getByText('💧 Irrigation Guidance')).toBeInTheDocument()
    expect(screen.getByText('More frequent watering needed (daily in hot weather)')).toBeInTheDocument()
    expect(screen.getByText('Shorter duration sessions (15-20 minutes)')).toBeInTheDocument()

    // 10. Verify soil amendments
    expect(screen.getByText('🌿 Recommended Soil Amendments')).toBeInTheDocument()
    expect(screen.getByText('Organic compost')).toBeInTheDocument()
    expect(screen.getByText('Spring before planting')).toBeInTheDocument()

    // 11. Test "Predict Another Crop" functionality
    const predictAnotherButton = screen.getByText('Predict Another Crop')
    await user.click(predictAnotherButton)

    await waitFor(() => {
      expect(screen.getByText('Begin Your Journey')).toBeInTheDocument()
    })

    // Verify we're back to the landing page
    expect(screen.getByText('CropVision')).toBeInTheDocument()
  })

  it('handles low soil compatibility scenario with warnings', async () => {
    // Mock API response with low compatibility and warnings
    const lowCompatibilityResponse = {
      crop: 'rice',
      top3: [
        { crop: 'rice', prob: 0.7 },
        { crop: 'wheat', prob: 0.2 },
        { crop: 'corn', prob: 0.1 }
      ],
      probs: { rice: 0.7, wheat: 0.2, corn: 0.1 },
      model_version: '1.0',
      soil_specific_advice: {
        compatibility_score: 0.3,
        amendments: [
          {
            name: 'Clay amendments',
            purpose: 'Improve water retention for rice cultivation',
            application_rate: '4-6 inches',
            timing: 'Before flooding'
          }
        ],
        irrigation_tips: {
          frequency: 'Continuous flooding required',
          duration: 'Maintain 2-4 inches water depth',
          method: 'Flood irrigation',
          special_notes: 'Sandy soil not ideal for rice - consider alternative crops'
        },
        warnings: [
          'Poor water retention for rice cultivation',
          'Requires frequent irrigation',
          'Consider alternative crops better suited for sandy soil'
        ],
        variety_recommendations: [
          'Not recommended for sandy soil',
          'Consider upland rice varieties if must grow rice'
        ]
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => lowCompatibilityResponse
    })

    render(<App />)

    // Quick form completion for rice scenario
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Fill form with data suitable for rice but in sandy soil (poor match)
    const riceFormData = ['200', '25', '85', '35', '40', '80', '6.8']
    
    for (const value of riceFormData) {
      await waitFor(() => {
        const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, value)

      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Select sandy soil (poor for rice)
    await waitFor(() => {
      expect(screen.getByText('Select your soil type')).toBeInTheDocument()
    })

    const soilSelector = screen.getByText('Select your soil type')
    await user.click(soilSelector)
    
    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)

    const finalNext = screen.getByRole('button', { name: /next|continue/i })
    await user.click(finalNext)

    // Verify results with low compatibility
    await waitFor(() => {
      expect(screen.getByText('rice')).toBeInTheDocument()
    })

    // Verify low compatibility score with red styling
    const compatibilityBadge = screen.getByText('30% Compatible')
    expect(compatibilityBadge).toHaveClass('bg-red-100', 'text-red-800')

    // Verify warnings are prominently displayed
    expect(screen.getByText('Important Considerations')).toBeInTheDocument()
    expect(screen.getByText('Poor water retention for rice cultivation')).toBeInTheDocument()
    expect(screen.getByText('Consider alternative crops better suited for sandy soil')).toBeInTheDocument()

    // Verify variety recommendations reflect the poor match
    expect(screen.getByText('Not recommended for sandy soil')).toBeInTheDocument()
  })

  it('handles network errors gracefully throughout the journey', async () => {
    // Mock network error
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<App />)

    // Complete form quickly
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    const formValues = ['150', '20', '70', '30', '35', '50', '6.5']
    
    for (const value of formValues) {
      await waitFor(() => {
        const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, value)

      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Select soil type
    const soilSelector = screen.getByText('Select your soil type')
    await user.click(soilSelector)
    const loamyOption = screen.getByText('Loamy')
    await user.click(loamyOption)

    const finalNext = screen.getByRole('button', { name: /next|continue/i })
    await user.click(finalNext)

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText('Prediction Error')).toBeInTheDocument()
    })

    expect(screen.getByText(/Unable to connect to the prediction service/)).toBeInTheDocument()
    expect(screen.getByText('General Agricultural Advice')).toBeInTheDocument()
    
    // Verify fallback advice is provided
    expect(screen.getByText('Ensure proper soil preparation and drainage')).toBeInTheDocument()
    expect(screen.getByText('Consider local climate conditions')).toBeInTheDocument()
  })

  it('validates mobile responsiveness during soil selection', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        crop: 'tomatoes',
        top3: [{ crop: 'tomatoes', prob: 0.8 }],
        probs: { tomatoes: 0.8 },
        model_version: '1.0'
      })
    })

    render(<App />)

    // Navigate to soil selection quickly
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Skip through form steps
    const formValues = ['160', '22', '75', '40', '45', '60', '6.8']
    
    for (const value of formValues) {
      await waitFor(() => {
        const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, value)

      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Test mobile soil selection
    await waitFor(() => {
      expect(screen.getByText('Select your soil type')).toBeInTheDocument()
    })

    const soilSelector = screen.getByText('Select your soil type')
    await user.click(soilSelector)

    // Verify dropdown opens properly on mobile
    expect(screen.getByText('Sandy')).toBeInTheDocument()
    expect(screen.getByText('Clay')).toBeInTheDocument()

    // Select soil type
    const clayOption = screen.getByText('Clay')
    await user.click(clayOption)

    // Verify mobile description appears
    await waitFor(() => {
      expect(screen.getByText('Clay Soil')).toBeInTheDocument()
    })

    // Verify description is visible on mobile (not hidden)
    const mobileDescription = screen.getByText(/Small particles.*High retention/)
    expect(mobileDescription).toBeInTheDocument()
  })
})