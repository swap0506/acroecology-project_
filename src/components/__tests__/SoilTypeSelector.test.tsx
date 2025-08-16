import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SoilTypeSelector from '../SoilTypeSelector'

// Mock the soil type service
vi.mock('../../services/soilTypeService', () => ({
  soilTypeService: {
    isReady: vi.fn(() => true),
    getSoilType: vi.fn((key: string) => {
      const mockData: Record<string, any> = {
        sandy: {
          name: 'Sandy',
          characteristics: ['Large particles', 'Good drainage'],
          water_retention: 'low',
          drainage: 'excellent'
        },
        clay: {
          name: 'Clay',
          characteristics: ['Small particles', 'High retention'],
          water_retention: 'high',
          drainage: 'poor'
        }
      }
      return mockData[key] || null
    })
  }
}))

describe('SoilTypeSelector', () => {
  const mockOnChange = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    disabled: false
  }

  it('renders with default placeholder text', () => {
    render(<SoilTypeSelector {...defaultProps} />)
    expect(screen.getByText('Select your soil type')).toBeInTheDocument()
  })

  it('displays selected soil type label', () => {
    render(<SoilTypeSelector {...defaultProps} value="sandy" />)
    expect(screen.getByText('Sandy')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', async () => {
    render(<SoilTypeSelector {...defaultProps} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Sandy')).toBeInTheDocument()
    expect(screen.getByText('Clay')).toBeInTheDocument()
    expect(screen.getByText('Loamy')).toBeInTheDocument()
  })

  it('calls onChange when option is selected', async () => {
    render(<SoilTypeSelector {...defaultProps} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)
    
    expect(mockOnChange).toHaveBeenCalledWith('sandy')
  })

  it('closes dropdown after selection', async () => {
    render(<SoilTypeSelector {...defaultProps} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    const sandyOption = screen.getByText('Sandy')
    await user.click(sandyOption)
    
    // Dropdown should be closed, so options should not be visible
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sandy/i })).not.toBeInTheDocument()
    })
  })

  it('is disabled when disabled prop is true', () => {
    render(<SoilTypeSelector {...defaultProps} disabled={true} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-not-allowed')
  })

  it('does not open dropdown when disabled', async () => {
    render(<SoilTypeSelector {...defaultProps} disabled={true} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // Options should not be visible
    expect(screen.queryByText('Sandy')).not.toBeInTheDocument()
  })

  it('shows soil description on mobile for selected soil type', () => {
    render(<SoilTypeSelector {...defaultProps} value="sandy" />)
    
    expect(screen.getByText('Sandy Soil')).toBeInTheDocument()
    expect(screen.getByText(/Large particles.*Good drainage/)).toBeInTheDocument()
  })

  it('shows validation message when no soil type is selected', () => {
    render(<SoilTypeSelector {...defaultProps} />)
    
    expect(screen.getByText('Selecting your soil type will provide more accurate crop recommendations')).toBeInTheDocument()
  })

  it('highlights selected option in dropdown', async () => {
    render(<SoilTypeSelector {...defaultProps} value="sandy" />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    const selectedOption = screen.getByRole('button', { name: /sandy/i })
    expect(selectedOption).toHaveClass('bg-green-100', 'text-green-800', 'font-medium')
  })

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <SoilTypeSelector {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    )
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // Verify dropdown is open
    expect(screen.getByText('Sandy')).toBeInTheDocument()
    
    // Click outside
    const outsideElement = screen.getByTestId('outside')
    await user.click(outsideElement)
    
    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sandy/i })).not.toBeInTheDocument()
    })
  })

  it('handles service error gracefully', () => {
    // Mock service to return error state
    vi.mocked(require('../../services/soilTypeService').soilTypeService.isReady).mockReturnValue(false)
    
    render(<SoilTypeSelector {...defaultProps} />)
    
    expect(screen.getByText(/Soil type data is not available/)).toBeInTheDocument()
  })
})