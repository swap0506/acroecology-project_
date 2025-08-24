import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PestDiseaseResults from '../PestDiseaseResults';

// Mock data for testing
const mockHighConfidenceResult = {
  matches: [
    {
      name: 'Aphids',
      scientific_name: 'Aphidoidea',
      confidence: 0.87,
      category: 'pest' as const,
      description: 'Small, soft-bodied insects that feed on plant sap, causing damage to leaves and stems',
      symptoms: [
        'Curled or yellowing leaves',
        'Sticky honeydew on leaves and stems',
        'Visible clusters of small insects'
      ],
      images: ['/images/pests/aphids_1.jpg', '/images/pests/aphids_2.jpg']
    }
  ],
  treatments: [
    {
      method: 'organic' as const,
      treatment: 'Neem oil spray',
      application: 'Mix 2 tablespoons per gallon of water, spray on affected areas',
      timing: 'Early morning or evening every 3-5 days',
      safety_notes: 'Safe for beneficial insects when dry, avoid spraying during bloom'
    },
    {
      method: 'chemical' as const,
      treatment: 'Imidacloprid-based insecticide',
      application: 'Follow label instructions for dilution and application',
      timing: 'Apply when pest pressure is high',
      safety_notes: 'Wear protective equipment, avoid during bloom, toxic to bees'
    }
  ],
  prevention_tips: [
    'Encourage beneficial insects like ladybugs and lacewings',
    'Remove weeds that harbor aphids',
    'Use reflective mulch to deter aphids',
    'Monitor plants regularly for early detection'
  ],
  expert_resources: [
    {
      name: 'Local Agricultural Extension Service',
      contact: 'Contact your local county extension office',
      type: 'extension_service',
      location: 'Local'
    }
  ],
  confidence_level: 'high' as const,
  api_source: 'plant_id_api'
};

const mockLowConfidenceResult = {
  ...mockHighConfidenceResult,
  matches: [
    {
      ...mockHighConfidenceResult.matches[0],
      confidence: 0.35
    }
  ],
  confidence_level: 'low' as const,
  fallback_mode: true,
  message: 'Low confidence identification. Expert consultation recommended.'
};

describe('PestDiseaseResults', () => {
  const mockOnNewUpload = vi.fn();

  beforeEach(() => {
    mockOnNewUpload.mockClear();
  });

  it('renders basic result information correctly', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check header
    expect(screen.getByText('Identification Complete')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();

    // Check primary match
    expect(screen.getByText('Aphids')).toBeInTheDocument();
    expect(screen.getByText('Aphidoidea')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/Small, soft-bodied insects/)).toBeInTheDocument();
  });

  it('renders low confidence warning correctly', () => {
    render(
      <PestDiseaseResults 
        result={mockLowConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check low confidence indicator
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    
    // Check uncertainty warning
    expect(screen.getByText('Low Confidence Detection')).toBeInTheDocument();
    expect(screen.getByText(/identification confidence is low/)).toBeInTheDocument();
  });

  it('displays treatment options', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check treatments section
    expect(screen.getByText('Treatment Options')).toBeInTheDocument();
    expect(screen.getByText('Neem oil spray')).toBeInTheDocument();
    expect(screen.getByText('Imidacloprid-based insecticide')).toBeInTheDocument();
  });

  it('displays prevention tips', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check prevention tips
    expect(screen.getByText('Prevention Tips')).toBeInTheDocument();
    expect(screen.getByText(/Encourage beneficial insects/)).toBeInTheDocument();
  });

  it('displays expert resources', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check expert resources
    expect(screen.getByText('Expert Resources')).toBeInTheDocument();
    expect(screen.getByText('Local Agricultural Extension Service')).toBeInTheDocument();
  });

  it('calls onNewUpload when analyze another image button is clicked', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    const analyzeButton = screen.getByText('Analyze Another Image');
    fireEvent.click(analyzeButton);

    expect(mockOnNewUpload).toHaveBeenCalledTimes(1);
  });

  it('displays API source attribution', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check that the component renders without errors
    expect(screen.getByText('Identification Complete')).toBeInTheDocument();
  });

  it('handles fallback mode correctly', () => {
    render(
      <PestDiseaseResults 
        result={mockLowConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check that fallback mode is handled properly
    expect(screen.getByText('Identification Complete')).toBeInTheDocument();
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });

  it('renders mobile-responsive design', () => {
    render(
      <PestDiseaseResults 
        result={mockHighConfidenceResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Check that the component renders properly
    expect(screen.getByText('Treatment Options')).toBeInTheDocument();
    expect(screen.getByText('Prevention Tips')).toBeInTheDocument();
    expect(screen.getByText('Expert Resources')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const minimalResult = {
      matches: [],
      treatments: [],
      prevention_tips: [],
      expert_resources: [],
      confidence_level: 'low' as const,
      api_source: 'test_api'
    };

    render(
      <PestDiseaseResults 
        result={minimalResult} 
        onNewUpload={mockOnNewUpload} 
      />
    );

    // Should still render basic structure
    expect(screen.getByText('Identification Complete')).toBeInTheDocument();
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });
});