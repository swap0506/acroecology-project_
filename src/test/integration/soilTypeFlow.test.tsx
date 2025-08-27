import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// Mock fetch globally
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

describe('Soil Type Integration Flow', () => {
  const user = userEvent.setup()

  const mockApiResponse = {
    crop: 'wheat',
    top3: [
      { crop: 'wheat', prob: 0.8 },
      { crop: 'corn', prob: 0.15 },
      { crop: 'rice', prob: 0.05 }
    ],
    probs: { wheat: 0.8, corn: 0.15, rice: 0.05 },
    model_version: '1.0',
    soil_specific_advice: {
      compatibility_score: 0.6,
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
        special_notes: 'Water deeply but frequently to prevent nutrient leaching. Mulch heavily to retain moisture.'
      },
      warnings: ['May need frequent fertilization', 'Ensure adequate water retention'],
      variety_recommendations: ['Drought-resistant varieties', 'Early maturing cultivars']
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completes full soil type selection and prediction flow', async () => {
    render(<App />)

    // Start from landing page
    expect(screen.getByText('CropVision')).toBeInTheDocument()
    
    // Click "Begin Your Journey"
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Wait for first step (rainfall)
    await waitFor(() => {
      expect(screen.getByText("Monsoon's Gift")).toBeInTheDocument()
    })

    // Fill in all the form steps
    const steps = [
      { value: '180', placeholder: 'Enter rainfall (mm)' },
      { value: '22.4', placeholder: 'Enter temperature (°C)' },
      { value: '82', placeholder: 'Enter humidity (%)' },
      { value: '42', placeholder: 'Enter phosphorous (kg/ha)' },
      { value: '43', placeholder: 'Enter potassium (kg/ha)' },
      { value: '90', placeholder: 'Enter nitrogen (kg/ha)' },
      { value: '6.5', placeholder: 'Enter pH value (0-14)' }
    ]

    for (const step of steps) {
      const input = screen.getByPlaceholderText(step.placeholder)
      await user.type(input, step.value)
      
      // Click next button
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
      
      // Wait for transition
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(step.placeholder)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    }

    // Now we should be at the soil type selection step
    await waitFor(() => {
      expect(screen.getByText("Earth's Foundation")).toBeInTheDocument()
    })

    // Find and click the soil type selector
    const soilSelector = screen.getByText('Select your soil type')
    await user.click(soilSelector)

    // Wait for dropdown to open and select sandy soil
    await waitFor(() => {
      expect(screen.getByText('Sandy')).toBeInTheDocument()
    })

    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)

    // Verify soil type is selected
    await waitFor(() => {
      expect(screen.getByText('Sandy')).toBeInTheDocument()
    })

    // Click next to proceed to final step
    const finalNextButton = screen.getByRole('button', { name: /next|continue/i })
    await user.click(finalNextButton)

    // Wait for prediction results
    await waitFor(() => {
      expect(screen.getByText('🌾 Your Perfect Crop Match')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify the API was called with soil type
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/predict',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          N: 90,
          P: 42,
          K: 43,
          temperature: 22.4,
          humidity: 82,
          ph: 6.5,
          rainfall: 180,
          soil_type: 'sandy'
        })
      })
    )

    // Verify crop recommendation is displayed
    expect(screen.getByText('wheat')).toBeInTheDocument()
    expect(screen.getByText('80% Match')).toBeInTheDocument()

    // Verify soil-specific advice is displayed
    expect(screen.getByText('🌱 Soil-Specific Recommendations')).toBeInTheDocument()
    expect(screen.getByText('60% Compatible')).toBeInTheDocument()

    // Verify warnings are shown
    expect(screen.getByText('Important Considerations')).toBeInTheDocument()
    expect(screen.getByText('May need frequent fertilization')).toBeInTheDocument()

    // Verify variety recommendations
    expect(screen.getByText('🌾 Recommended Varieties')).toBeInTheDocument()
    expect(screen.getByText('Drought-resistant varieties')).toBeInTheDocument()

    // Verify irrigation guidance
    expect(screen.getByText('💧 Irrigation Guidance')).toBeInTheDocument()
    expect(screen.getByText('More frequent watering needed (daily in hot weather)')).toBeInTheDocument()

    // Verify soil amendments
    expect(screen.getByText('🌿 Recommended Soil Amendments')).toBeInTheDocument()
    expect(screen.getByText('Organic compost')).toBeInTheDocument()
  })

  it('handles flow without soil type selection', async () => {
    render(<App />)

    // Start from landing page
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Fill in all steps but skip soil type
    const steps = [
      { value: '180', placeholder: 'Enter rainfall (mm)' },
      { value: '22.4', placeholder: 'Enter temperature (°C)' },
      { value: '82', placeholder: 'Enter humidity (%)' },
      { value: '42', placeholder: 'Enter phosphorous (kg/ha)' },
      { value: '43', placeholder: 'Enter potassium (kg/ha)' },
      { value: '90', placeholder: 'Enter nitrogen (kg/ha)' },
      { value: '6.5', placeholder: 'Enter pH value (0-14)' }
    ]

    for (const step of steps) {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(step.placeholder)).toBeInTheDocument()
      })
      
      const input = screen.getByPlaceholderText(step.placeholder)
      await user.type(input, step.value)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
    }

    // At soil type step, skip selection and proceed
    await waitFor(() => {
      expect(screen.getByText("Earth's Foundation")).toBeInTheDocument()
    })

    const skipButton = screen.getByRole('button', { name: /next|continue/i })
    await user.click(skipButton)

    // Wait for prediction results
    await waitFor(() => {
      expect(screen.getByText('🌾 Your Perfect Crop Match')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify API was called without soil type
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/predict',
      expect.objectContaining({
        body: JSON.stringify({
          N: 90,
          P: 42,
          K: 43,
          temperature: 22.4,
          humidity: 82,
          ph: 6.5,
          rainfall: 180,
          soil_type: null
        })
      })
    )

    // Verify no soil-specific advice is shown
    expect(screen.queryByText('🌱 Soil-Specific Recommendations')).not.toBeInTheDocument()
  })

  it('handles API errors during prediction with soil type', async () => {
    // Mock API to return error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<App />)

    // Complete the form flow quickly
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Fill form steps (abbreviated for test speed)
    const inputs = ['180', '22.4', '82', '42', '43', '90', '6.5']
    
    for (let i = 0; i < inputs.length; i++) {
      await waitFor(() => {
        const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(input).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, inputs[i])
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
    }

    // Select soil type
    await waitFor(() => {
      expect(screen.getByText('Select your soil type')).toBeInTheDocument()
    })

    const soilSelector = screen.getByText('Select your soil type')
    await user.click(soilSelector)
    
    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)

    const finalNext = screen.getByRole('button', { name: /next|continue/i })
    await user.click(finalNext)

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText('Prediction Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByText('General Agricultural Advice')).toBeInTheDocument()
  })

  it('validates soil type selection behavior', async () => {
    render(<App />)

    // Navigate to soil type step (abbreviated)
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Skip to soil type step by filling previous steps quickly
    const inputs = ['180', '22.4', '82', '42', '43', '90', '6.5']
    
    for (const input of inputs) {
      await waitFor(() => {
        const inputElement = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(inputElement).toBeInTheDocument()
      })
      
      const inputElement = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(inputElement)
      await user.type(inputElement, input)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
    }

    // Now at soil type selection
    await waitFor(() => {
      expect(screen.getByText('Select your soil type')).toBeInTheDocument()
    })

    // Test dropdown opening
    const selector = screen.getByText('Select your soil type')
    await user.click(selector)

    // Verify all soil types are available
    expect(screen.getByText('Sandy')).toBeInTheDocument()
    expect(screen.getByText('Clay')).toBeInTheDocument()
    expect(screen.getByText('Loamy')).toBeInTheDocument()
    expect(screen.getByText('Silty')).toBeInTheDocument()
    expect(screen.getByText('Peaty')).toBeInTheDocument()
    expect(screen.getByText('Chalky')).toBeInTheDocument()

    // Select clay soil
    const clayOption = screen.getByText('Clay')
    await user.click(clayOption)

    // Verify selection
    await waitFor(() => {
      expect(screen.getByText('Clay')).toBeInTheDocument()
    })

    // Verify soil description appears on mobile
    expect(screen.getByText('Clay Soil')).toBeInTheDocument()
  })

  it('handles form reset and maintains soil type state', async () => {
    render(<App />)

    // Complete full flow
    const beginButton = screen.getByText('Begin Your Journey')
    await user.click(beginButton)

    // Fill form and select soil type (abbreviated)
    const inputs = ['180', '22.4', '82', '42', '43', '90', '6.5']
    
    for (const input of inputs) {
      await waitFor(() => {
        const inputElement = screen.getByRole('textbox') || screen.getByRole('spinbutton')
        expect(inputElement).toBeInTheDocument()
      })
      
      const inputElement = screen.getByRole('textbox') || screen.getByRole('spinbutton')
      await user.clear(inputElement)
      await user.type(inputElement, input)
      
      const nextButton = screen.getByRole('button', { name: /next|continue/i })
      await user.click(nextButton)
    }

    // Select soil type
    const selector = screen.getByText('Select your soil type')
    await user.click(selector)
    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)

    const finalNext = screen.getByRole('button', { name: /next|continue/i })
    await user.click(finalNext)

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('🌾 Your Perfect Crop Match')).toBeInTheDocument()
    })

    // Click "Predict Another Crop"
    const predictAnotherButton = screen.getByText('Predict Another Crop')
    await user.click(predictAnotherButton)

    // Verify form is reset
    await waitFor(() => {
      expect(screen.getByText('Begin Your Journey')).toBeInTheDocument()
    })

    // Verify we're back to the landing page
    expect(screen.getByText('CropVision')).toBeInTheDocument()
  })
})