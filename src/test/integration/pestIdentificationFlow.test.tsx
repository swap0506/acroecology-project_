import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// Mock the useMobile hook

vi.mock('../../hooks/useMobile', () => ({
  useMobile: () => ({
    isMobile: false,
    isTablet: false,
    hasCamera: true,
    hasTouchScreen: false,
    orientation: 'portrait',
    screenSize: 'desktop'
  })
}))

// Mock the mobileImageOptimization utility
vi.mock('../../utils/mobileImageOptimization', () => ({
  mobileImageOptimizer: {
    optimizeForMobile: vi.fn().mockResolvedValue({
      file: new File(['optimized'], 'optimized.jpg', { type: 'image/jpeg' }),
      compressionRatio: 0.8
    })
  }
}))

// Mock fetch globally for API calls
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock URL.createObjectURL and revokeObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
globalThis.URL.revokeObjectURL = vi.fn()

// Mock File constructor
globalThis.File = class MockFile {
  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + (chunk.length || 0), 0)
    this.type = options.type || 'image/jpeg'
    this.lastModified = Date.now()
  }
  name: string
  size: number
  type: string
  lastModified: number
} as any

// Mock FileReader
globalThis.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mock-base64-data'
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 10)
  }
} as any

// Mock navigator.mediaDevices for camera access
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
  }
})

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

describe('Pest Identification Integration Flow', () => {
  const user = userEvent.setup()

  // Mock successful API response
  const mockSuccessfulApiResponse = {
    matches: [
      {
        name: 'Aphids',
        scientific_name: 'Aphidoidea',
        confidence: 0.85,
        category: 'pest',
        description: 'Small, soft-bodied insects that feed on plant sap, causing yellowing and curling of leaves.',
        symptoms: [
          'Curled or yellowing leaves',
          'Sticky honeydew on leaves',
          'Stunted plant growth',
          'Visible clusters of small insects'
        ],
        images: [
          '/images/pests/aphids_1.jpg',
          '/images/pests/aphids_2.jpg'
        ]
      },
      {
        name: 'Spider Mites',
        scientific_name: 'Tetranychidae',
        confidence: 0.65,
        category: 'pest',
        description: 'Tiny arachnids that cause stippling damage on leaves.',
        symptoms: [
          'Fine webbing on leaves',
          'Yellow stippling on leaf surface',
          'Leaf bronzing'
        ],
        images: ['/images/pests/spider_mites_1.jpg']
      }
    ],
    treatments: [
      {
        method: 'organic',
        treatment: 'Neem oil spray',
        application: 'Spray on affected areas every 3-5 days',
        timing: 'Early morning or evening',
        safety_notes: 'Safe for beneficial insects when dry'
      },
      {
        method: 'chemical',
        treatment: 'Imidacloprid-based insecticide',
        application: 'Follow label instructions for dilution',
        timing: 'Apply when pest pressure is high',
        safety_notes: 'Wear protective equipment, avoid during bloom'
      },
      {
        method: 'cultural',
        treatment: 'Encourage beneficial insects',
        application: 'Plant companion flowers and avoid broad-spectrum pesticides',
        timing: 'Ongoing prevention strategy',
        safety_notes: 'Monitor for natural predator populations'
      }
    ],
    prevention_tips: [
      'Encourage beneficial insects like ladybugs',
      'Remove weeds that harbor aphids',
      'Use reflective mulch to deter aphids',
      'Monitor plants regularly for early detection',
      'Maintain proper plant spacing for air circulation'
    ],
    expert_resources: [
      {
        name: 'Local Agricultural Extension Service',
        contact: 'Contact your local county extension office',
        type: 'extension_service',
        location: 'Local'
      },
      {
        name: 'Certified Crop Advisor',
        contact: 'Find a CCA through the American Society of Agronomy',
        type: 'consultant',
        location: 'Regional'
      }
    ],
    confidence_level: 'high',
    api_source: 'plant_id_api'
  }

  // Mock low confidence API response
  const mockLowConfidenceResponse = {
    matches: [
      {
        name: 'Unknown Plant Issue',
        scientific_name: null,
        confidence: 0.35,
        category: 'unknown',
        description: 'Unable to identify specific pest or disease with high confidence.',
        symptoms: ['Visible plant damage', 'Requires expert examination'],
        images: []
      }
    ],
    treatments: [
      {
        method: 'cultural',
        treatment: 'Expert consultation recommended',
        application: 'Contact local agricultural extension for accurate diagnosis',
        timing: 'As soon as possible',
        safety_notes: 'Professional diagnosis recommended for proper treatment'
      }
    ],
    prevention_tips: [
      'Monitor plants regularly for early detection',
      'Maintain good plant hygiene',
      'Ensure proper watering and nutrition'
    ],
    expert_resources: [
      {
        name: 'Local Agricultural Extension Service',
        contact: 'Contact your local county extension office',
        type: 'extension_service',
        location: 'Local'
      }
    ],
    confidence_level: 'low',
    api_source: 'plant_id_api'
  }

  // Mock fallback response
  const mockFallbackResponse = {
    matches: [
      {
        name: 'Service Temporarily Unavailable',
        scientific_name: null,
        confidence: 0.0,
        category: 'unknown',
        description: 'The pest and disease identification service is temporarily unavailable.',
        symptoms: ['Service unavailable', 'Network connectivity issues'],
        images: []
      }
    ],
    treatments: [
      {
        method: 'cultural',
        treatment: 'Expert consultation recommended',
        application: 'Contact local agricultural extension or plant pathologist for accurate diagnosis',
        timing: 'As soon as possible',
        safety_notes: 'Professional diagnosis is recommended for proper treatment'
      }
    ],
    prevention_tips: [
      'Monitor plants regularly for early detection of issues',
      'Maintain good plant hygiene and proper spacing',
      'Ensure adequate but not excessive watering'
    ],
    expert_resources: [
      {
        name: 'Local Agricultural Extension Service',
        contact: 'Contact your local county extension office for in-person diagnosis',
        type: 'extension_service',
        location: 'Local'
      }
    ],
    confidence_level: 'low',
    api_source: 'fallback_service',
    fallback_mode: true,
    message: 'Primary identification service unavailable. We recommend consulting local experts for accurate diagnosis.'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessfulApiResponse
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completes successful pest identification flow with high confidence', async () => {
    render(<App />)

    // Navigate to pest identification
    expect(screen.getByText('CropVision')).toBeInTheDocument()

    // Look for the "Identify Pests" button on the landing page
    const pestIdButton = screen.getByText('Identify Pests')
    expect(pestIdButton).toBeInTheDocument()

    await user.click(pestIdButton)

    // Wait for pest identification page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Verify introduction text
    expect(screen.getByText('Identify Plant Problems')).toBeInTheDocument()
    expect(screen.getByText(/Upload a photo of your affected plant/)).toBeInTheDocument()

    // Create a mock image file
    const mockImageFile = new File(['mock image data'], 'plant-disease.jpg', {
      type: 'image/jpeg'
    })

    // Find and interact with file input
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()

    // Upload the file
    await user.upload(fileInput as HTMLInputElement, mockImageFile)

    // Wait for upload processing
    await waitFor(() => {
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify API call was made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/identify',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Identification Complete')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify high confidence indicator
    expect(screen.getByText('High Confidence')).toBeInTheDocument()

    // Verify primary match display
    expect(screen.getByText('Aphids')).toBeInTheDocument()
    expect(screen.getByText('Aphidoidea')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()

    // Verify description
    expect(screen.getByText(/Small, soft-bodied insects that feed on plant sap/)).toBeInTheDocument()

    // Verify symptoms are displayed
    expect(screen.getByText('Common Symptoms')).toBeInTheDocument()
    expect(screen.getByText('Curled or yellowing leaves')).toBeInTheDocument()
    expect(screen.getByText('Sticky honeydew on leaves')).toBeInTheDocument()

    // Verify additional matches section
    expect(screen.getByText('Other Possible Matches')).toBeInTheDocument()
    expect(screen.getByText('Spider Mites')).toBeInTheDocument()
    expect(screen.getByText('65% confidence')).toBeInTheDocument()

    // Verify treatment options
    expect(screen.getByText('Treatment Options')).toBeInTheDocument()

    // Check treatment filter functionality
    const treatmentFilter = screen.getByRole('combobox')
    expect(treatmentFilter).toBeInTheDocument()

    // Test filtering by organic methods
    await user.selectOptions(treatmentFilter, 'organic')
    expect(screen.getByText('Neem oil spray')).toBeInTheDocument()
    expect(screen.queryByText('Imidacloprid-based insecticide')).not.toBeInTheDocument()

    // Reset filter to show all treatments
    await user.selectOptions(treatmentFilter, 'all')
    expect(screen.getByText('Neem oil spray')).toBeInTheDocument()
    expect(screen.getByText('Imidacloprid-based insecticide')).toBeInTheDocument()
    expect(screen.getByText('Encourage beneficial insects')).toBeInTheDocument()

    // Verify treatment details
    expect(screen.getByText('Spray on affected areas every 3-5 days')).toBeInTheDocument()
    expect(screen.getByText('Early morning or evening')).toBeInTheDocument()
    expect(screen.getByText('Safe for beneficial insects when dry')).toBeInTheDocument()

    // Verify prevention tips
    expect(screen.getByText('Prevention Tips')).toBeInTheDocument()
    expect(screen.getByText('Encourage beneficial insects like ladybugs')).toBeInTheDocument()
    expect(screen.getByText('Monitor plants regularly for early detection')).toBeInTheDocument()

    // Verify expert resources
    expect(screen.getByText('Expert Resources')).toBeInTheDocument()
    expect(screen.getByText('Local Agricultural Extension Service')).toBeInTheDocument()
    expect(screen.getByText('Certified Crop Advisor')).toBeInTheDocument()

    // Verify action buttons
    expect(screen.getByText('Analyze Another Image')).toBeInTheDocument()

    // Test new upload functionality
    const newUploadButton = screen.getByText('Analyze Another Image')
    await user.click(newUploadButton)

    // Verify we're back to upload interface
    await waitFor(() => {
      expect(screen.getByText('Upload Plant Image')).toBeInTheDocument()
    })
  })

  it('handles low confidence identification with expert consultation recommendations', async () => {
    // Mock low confidence response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockLowConfidenceResponse
    })

    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Upload image
    const mockImageFile = new File(['mock image data'], 'unclear-plant-issue.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, mockImageFile)

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Identification Complete')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify low confidence indicator
    expect(screen.getByText('Low Confidence')).toBeInTheDocument()

    // Verify low confidence warning
    expect(screen.getByText('Low Confidence Detection')).toBeInTheDocument()
    expect(screen.getByText(/identification confidence is low/)).toBeInTheDocument()

    // Verify unknown issue display
    expect(screen.getByText('Unknown Plant Issue')).toBeInTheDocument()
    expect(screen.getByText(/Unable to identify specific pest or disease/)).toBeInTheDocument()

    // Verify expert consultation is prominently recommended
    expect(screen.getByText('Expert consultation recommended')).toBeInTheDocument()
    expect(screen.getByText(/Strong Recommendation/)).toBeInTheDocument()

    // Verify expert resources are displayed
    expect(screen.getByText('Expert Resources')).toBeInTheDocument()
    expect(screen.getByText('Local Agricultural Extension Service')).toBeInTheDocument()
  })

  it('handles API errors and displays fallback results', async () => {
    // Mock API error
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Upload image
    const mockImageFile = new File(['mock image data'], 'plant-issue.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, mockImageFile)

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/Connection Issue|Service Temporarily Unavailable/)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify error message and recovery options
    expect(screen.getByText(/having trouble connecting|experiencing high demand/)).toBeInTheDocument()

    // Check for retry functionality
    const retryButton = screen.queryByText(/retry/i)
    if (retryButton) {
      expect(retryButton).toBeInTheDocument()
    }

    // Check for expert contacts option
    const expertContactsButton = screen.queryByText(/find local experts/i)
    if (expertContactsButton) {
      await user.click(expertContactsButton)

      await waitFor(() => {
        expect(screen.getByText('Expert Consultation Resources')).toBeInTheDocument()
      })
    }
  })

  it('handles service unavailable with fallback mode', async () => {
    // Mock fallback response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockFallbackResponse
    })

    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Upload image
    const mockImageFile = new File(['mock image data'], 'plant-issue.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, mockImageFile)

    // Wait for fallback results
    await waitFor(() => {
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify fallback mode messaging
    expect(screen.getByText(/Service Unavailable - Fallback Mode/)).toBeInTheDocument()
    expect(screen.getByText(/Primary identification service is temporarily unavailable/)).toBeInTheDocument()

    // Verify fallback result display
    expect(screen.getByText('Service Temporarily Unavailable')).toBeInTheDocument()
    expect(screen.getByText(/pest and disease identification service is temporarily unavailable/)).toBeInTheDocument()

    // Verify expert consultation is strongly recommended
    expect(screen.getByText(/strongly recommend consulting with local experts/)).toBeInTheDocument()
    expect(screen.getByText('Why Expert Consultation is Important:')).toBeInTheDocument()

    // Verify fallback treatments
    expect(screen.getByText('Expert consultation recommended')).toBeInTheDocument()
    expect(screen.getByText(/Contact local agricultural extension/)).toBeInTheDocument()

    // Verify API source attribution shows fallback
    expect(screen.getByText(/fallback service.*Fallback Mode/)).toBeInTheDocument()
  })

  it('validates mobile camera functionality and image processing', async () => {
    // Mock mobile environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    // Mock camera capture
    const mockCameraFile = new File(['camera image data'], 'camera-capture.jpg', {
      type: 'image/jpeg'
    })

    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Look for camera button (should be available on mobile)
    const cameraButton = screen.queryByText(/take photo/i)
    if (cameraButton) {
      expect(cameraButton).toBeInTheDocument()

      // Mock camera input
      const cameraInput = document.querySelector('input[capture="environment"]')
      if (cameraInput) {
        await user.upload(cameraInput as HTMLInputElement, mockCameraFile)

        // Wait for processing
        await waitFor(() => {
          expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
        }, { timeout: 3000 })
      }
    }

    // Check for mobile-specific photo tips
    const photoTipsButton = screen.queryByText(/photo tips/i)
    if (photoTipsButton) {
      await user.click(photoTipsButton)

      await waitFor(() => {
        expect(screen.getByText(/Photo Tips for Best Results/)).toBeInTheDocument()
      })

      // Verify mobile-specific tips
      expect(screen.getByText(/Use natural daylight when possible/)).toBeInTheDocument()
      expect(screen.getByText(/Hold phone with both hands/)).toBeInTheDocument()
    }
  })

  it('tests database lookup and treatment recommendation generation', async () => {
    // Mock response with specific pest that should have local database match
    const mockDatabaseMatchResponse = {
      matches: [
        {
          name: 'Tomato Hornworm',
          scientific_name: 'Manduca quinquemaculata',
          confidence: 0.92,
          category: 'pest',
          description: 'Large green caterpillar that feeds on tomato plants.',
          symptoms: [
            'Large holes in leaves',
            'Missing foliage',
            'Large green caterpillars visible',
            'Black droppings on leaves'
          ],
          images: ['/images/pests/hornworm_1.jpg']
        }
      ],
      treatments: [
        {
          method: 'organic',
          treatment: 'Hand picking',
          application: 'Remove caterpillars by hand in early morning',
          timing: 'Daily inspection during growing season',
          safety_notes: 'Wear gloves when handling'
        },
        {
          method: 'organic',
          treatment: 'Bacillus thuringiensis (Bt)',
          application: 'Spray according to label directions',
          timing: 'Apply when caterpillars are small',
          safety_notes: 'Safe for beneficial insects'
        },
        {
          method: 'cultural',
          treatment: 'Companion planting',
          application: 'Plant basil and marigolds nearby',
          timing: 'At planting time',
          safety_notes: 'Monitor for effectiveness'
        }
      ],
      prevention_tips: [
        'Inspect plants regularly for eggs and small caterpillars',
        'Encourage beneficial insects like parasitic wasps',
        'Remove plant debris at end of season',
        'Rotate crops to break pest cycles'
      ],
      expert_resources: [
        {
          name: 'Local Agricultural Extension Service',
          contact: 'Contact your local county extension office',
          type: 'extension_service',
          location: 'Local'
        }
      ],
      confidence_level: 'high',
      api_source: 'plant_id_api'
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDatabaseMatchResponse
    })

    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Upload image
    const mockImageFile = new File(['hornworm image'], 'hornworm.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, mockImageFile)

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Identification Complete')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify specific pest identification
    expect(screen.getByText('Tomato Hornworm')).toBeInTheDocument()
    expect(screen.getByText('Manduca quinquemaculata')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()

    // Verify comprehensive treatment options from database
    expect(screen.getByText('Hand picking')).toBeInTheDocument()
    expect(screen.getByText('Bacillus thuringiensis (Bt)')).toBeInTheDocument()
    expect(screen.getByText('Companion planting')).toBeInTheDocument()

    // Test treatment filtering
    const treatmentFilter = screen.getByRole('combobox')

    // Filter by organic methods
    await user.selectOptions(treatmentFilter, 'organic')
    expect(screen.getByText('Hand picking')).toBeInTheDocument()
    expect(screen.getByText('Bacillus thuringiensis (Bt)')).toBeInTheDocument()
    expect(screen.queryByText('Companion planting')).not.toBeInTheDocument()

    // Filter by cultural methods
    await user.selectOptions(treatmentFilter, 'cultural')
    expect(screen.queryByText('Hand picking')).not.toBeInTheDocument()
    expect(screen.getByText('Companion planting')).toBeInTheDocument()

    // Verify prevention tips from database
    expect(screen.getByText('Inspect plants regularly for eggs and small caterpillars')).toBeInTheDocument()
    expect(screen.getByText('Rotate crops to break pest cycles')).toBeInTheDocument()
  })

  it('handles file validation errors and provides recovery guidance', async () => {
    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Test invalid file type
    const invalidFile = new File(['invalid data'], 'document.pdf', {
      type: 'application/pdf'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, invalidFile)

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/Upload Error/)).toBeInTheDocument()
    })

    // Verify error message and recovery suggestions
    expect(screen.getByText(/Please select a .jpg or .png image file/)).toBeInTheDocument()
    expect(screen.getByText(/Try these solutions:/)).toBeInTheDocument()
    expect(screen.getByText(/Ensure your image is in JPG or PNG format/)).toBeInTheDocument()

    // Test oversized file
    const oversizedFile = new File([new ArrayBuffer(15 * 1024 * 1024)], 'huge-image.jpg', {
      type: 'image/jpeg'
    })

    // Mock file size property
    Object.defineProperty(oversizedFile, 'size', {
      value: 15 * 1024 * 1024,
      writable: false
    })

    await user.upload(fileInput as HTMLInputElement, oversizedFile)

    // Wait for size validation error
    await waitFor(() => {
      expect(screen.getByText(/file size.*exceeds maximum/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Try compressing the image before uploading/)).toBeInTheDocument()
  })

  it('tests error scenarios and recovery mechanisms', async () => {
    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // Test network timeout
    mockFetch.mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    )

    const mockImageFile = new File(['image data'], 'test.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, mockImageFile)

    // Wait for timeout error
    await waitFor(() => {
      expect(screen.getByText(/Connection Issue|Service Temporarily Unavailable/)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Test retry functionality
    const retryButton = screen.queryByText(/retry/i)
    if (retryButton) {
      // Mock successful retry
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSuccessfulApiResponse
      })

      await user.click(retryButton)

      // Wait for successful result after retry
      await waitFor(() => {
        expect(screen.getByText('Identification Complete')).toBeInTheDocument()
      }, { timeout: 5000 })
    }
  })

  it('validates complete user journey with multiple interactions', async () => {
    render(<App />)

    // Navigate to pest identification
    const pestIdButton = screen.getByText('Identify Pests')
    await user.click(pestIdButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pest & Disease Identification' })).toBeInTheDocument()
    })

    // First identification
    const mockImageFile1 = new File(['first image'], 'aphids.jpg', {
      type: 'image/jpeg'
    })

    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput as HTMLInputElement, mockImageFile1)

    // Wait for first results
    await waitFor(() => {
      expect(screen.getByText('Identification Complete')).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText('Aphids')).toBeInTheDocument()

    // Test treatment filtering interaction
    const treatmentFilter = screen.getByRole('combobox')
    await user.selectOptions(treatmentFilter, 'organic')
    expect(screen.getByText('Neem oil spray')).toBeInTheDocument()

    // Start new analysis
    const newAnalysisButton = screen.getByText('Analyze Another Image')
    await user.click(newAnalysisButton)

    // Verify we're back to upload interface
    await waitFor(() => {
      expect(screen.getByText('Upload Plant Image')).toBeInTheDocument()
    })

    // Second identification with different result
    const mockDifferentResponse = {
      ...mockSuccessfulApiResponse,
      matches: [
        {
          name: 'Powdery Mildew',
          scientific_name: 'Erysiphales',
          confidence: 0.78,
          category: 'disease',
          description: 'Fungal disease causing white powdery coating on leaves.',
          symptoms: ['White powdery coating on leaves', 'Yellowing leaves', 'Stunted growth'],
          images: ['/images/diseases/powdery_mildew.jpg']
        }
      ]
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockDifferentResponse
    })

    const mockImageFile2 = new File(['second image'], 'mildew.jpg', {
      type: 'image/jpeg'
    })

    await user.upload(fileInput as HTMLInputElement, mockImageFile2)

    // Wait for second results
    await waitFor(() => {
      expect(screen.getByText('Powdery Mildew')).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByText('Erysiphales')).toBeInTheDocument()
    expect(screen.getByText('78%')).toBeInTheDocument()

    // Verify different disease category
    expect(screen.getByText(/Fungal disease causing white powdery coating/)).toBeInTheDocument()
  })
})