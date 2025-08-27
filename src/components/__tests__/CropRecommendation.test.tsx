import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import CropRecommendation from '../CropRecommendation'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CropRecommendation', () => {
  const mockCropData = {
    rainfall: '180',
    temperature: '22.4',
    humidity: '82',
    phosphorous: '42',
    potassium: '43',
    nitrogen: '90',
    ph: '6.5',
    soilType: 'sandy'
  }

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
          purpose: 'Improve water retention',
          application_rate: '2-4 inches',
          timing: 'Spring'
        }
      ],
      irrigation_tips: {
        frequency: 'Daily watering',
        duration: '15-20 minutes',
        method: 'Drip irrigation',
        special_notes: 'Water frequently'
      },
      warnings: ['May need frequent fertilization'],
      variety_recommendations: ['Drought-resistant varieties', 'Early maturing cultivars']
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<CropRecommendation cropData={mockCropData} />)
    
    expect(screen.getByText('🔄 Predicting best crop...')).toBeInTheDocument()
  })

  it('renders crop recommendation with soil advice', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      expect(screen.getByText('wheat')).toBeInTheDocument()
    })

    // Check main recommendation
    expect(screen.getByText('80% Match')).toBeInTheDocument()
    
    // Check soil-specific advice
    expect(screen.getByText('🌱 Soil-Specific Recommendations')).toBeInTheDocument()
    expect(screen.getByText('60% Compatible')).toBeInTheDocument()
    
    // Check warnings
    expect(screen.getByText('Important Considerations')).toBeInTheDocument()
    expect(screen.getByText('May need frequent fertilization')).toBeInTheDocument()
    
    // Check variety recommendations
    expect(screen.getByText('🌾 Recommended Varieties')).toBeInTheDocument()
    expect(screen.getByText('Drought-resistant varieties')).toBeInTheDocument()
    
    // Check irrigation guidance
    expect(screen.getByText('💧 Irrigation Guidance')).toBeInTheDocument()
    expect(screen.getByText('Daily watering')).toBeInTheDocument()
    
    // Check soil amendments
    expect(screen.getByText('🌿 Recommended Soil Amendments')).toBeInTheDocument()
    expect(screen.getByText('Organic compost')).toBeInTheDocument()
  })

  it('renders recommendation without soil advice when not provided', async () => {
    const responseWithoutSoilAdvice = {
      ...mockApiResponse,
      soil_specific_advice: undefined
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithoutSoilAdvice
    })

    const cropDataWithoutSoil = { ...mockCropData, soilType: '' }
    render(<CropRecommendation cropData={cropDataWithoutSoil} />)

    await waitFor(() => {
      expect(screen.getByText('wheat')).toBeInTheDocument()
    })

    // Should not show soil-specific advice
    expect(screen.queryByText('🌱 Soil-Specific Recommendations')).not.toBeInTheDocument()
    
    // Should show general growing tips
    expect(screen.getByText('General Growing Tips')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      expect(screen.getByText('Prediction Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByText('General Agricultural Advice')).toBeInTheDocument()
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument()
  })

  it('handles HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      expect(screen.getByText('Prediction Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Server error occurred. Please try again later.')).toBeInTheDocument()
  })

  it('validates input data before sending request', async () => {
    const invalidCropData = {
      ...mockCropData,
      ph: 'invalid' // Invalid pH value
    }

    render(<CropRecommendation cropData={invalidCropData} />)

    await waitFor(() => {
      expect(screen.getByText('Prediction Error')).toBeInTheDocument()
    })

    expect(screen.getByText(/Invalid ph value/)).toBeInTheDocument()
  })

  it('sends correct payload to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
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
    })
  })

  it('shows soil advice error when soil advice fails to generate', async () => {
    const responseWithSoilError = {
      ...mockApiResponse,
      soil_specific_advice: undefined
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithSoilError
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      expect(screen.getByText('wheat')).toBeInTheDocument()
    })

    // Should show soil advice error notice
    expect(screen.getByText('Soil Advice Notice')).toBeInTheDocument()
    expect(screen.getByText(/Soil-specific advice could not be generated/)).toBeInTheDocument()
  })

  it('displays compatibility score with correct styling', async () => {
    // Test high compatibility (green)
    const highCompatibilityResponse = {
      ...mockApiResponse,
      soil_specific_advice: {
        ...mockApiResponse.soil_specific_advice,
        compatibility_score: 0.9
      }
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => highCompatibilityResponse
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      const compatibilityBadge = screen.getByText('90% Compatible')
      expect(compatibilityBadge).toHaveClass('bg-green-100', 'text-green-800')
    })
  })

  it('displays medium compatibility score with yellow styling', async () => {
    // Test medium compatibility (yellow)
    const mediumCompatibilityResponse = {
      ...mockApiResponse,
      soil_specific_advice: {
        ...mockApiResponse.soil_specific_advice,
        compatibility_score: 0.7
      }
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mediumCompatibilityResponse
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      const compatibilityBadge = screen.getByText('70% Compatible')
      expect(compatibilityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })
  })

  it('displays low compatibility score with red styling', async () => {
    // Test low compatibility (red)
    const lowCompatibilityResponse = {
      ...mockApiResponse,
      soil_specific_advice: {
        ...mockApiResponse.soil_specific_advice,
        compatibility_score: 0.3
      }
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => lowCompatibilityResponse
    })

    render(<CropRecommendation cropData={mockCropData} />)

    await waitFor(() => {
      const compatibilityBadge = screen.getByText('30% Compatible')
      expect(compatibilityBadge).toHaveClass('bg-red-100', 'text-red-800')
    })
  })
})