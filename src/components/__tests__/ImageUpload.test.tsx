import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ImageUpload from '../ImageUpload';

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();

// Setup global mocks
beforeEach(() => {
  // Mock URL methods
  (globalThis as any).URL.createObjectURL = mockCreateObjectURL;
  (globalThis as any).URL.revokeObjectURL = mockRevokeObjectURL;
  
  // Mock Image constructor
  (globalThis as any).Image = class MockImage {
    onload: (() => void) | null = null;
    src = '';
    width = 800;
    height = 600;
    
    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  } as any;
  
  // Mock canvas
  const mockCanvas = {
    getContext: vi.fn(() => ({
      drawImage: vi.fn(),
    })),
    toBlob: vi.fn((callback) => {
      const blob = new Blob(['compressed'], { type: 'image/jpeg' });
      callback(blob);
    }),
    width: 0,
    height: 0,
  };
  
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas as any;
    }
    return originalCreateElement(tagName);
  }) as any;
});

describe('ImageUpload Component', () => {
  const mockOnImageUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload interface correctly', () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    expect(screen.getByText('Upload Plant Image')).toBeInTheDocument();
    expect(screen.getByText('Take or upload a photo of your affected plant for identification')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop an image here, or click to select')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} loading={true} />);
    
    expect(screen.getByText('Analyzing image...')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Upload failed';
    render(<ImageUpload onImageUpload={mockOnImageUpload} error={errorMessage} />);
    
    expect(screen.getByText('Upload Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('validates file format correctly', async () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    const invalidFile = createMockFile('test.gif', 1024, 'image/gif');
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('Please select a .jpg or .png image file.')).toBeInTheDocument();
    });
    
    expect(mockOnImageUpload).not.toHaveBeenCalled();
  });

  it('validates file size correctly', async () => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    render(<ImageUpload onImageUpload={mockOnImageUpload} maxSizeBytes={maxSize} />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File size must be less than 5MB/)).toBeInTheDocument();
    });
    
    expect(mockOnImageUpload).not.toHaveBeenCalled();
  });

  it('accepts valid image files', async () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    const validFile = createMockFile('test.jpg', 1024, 'image/jpeg');
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(mockOnImageUpload).toHaveBeenCalled();
    });
  });

  it('handles drag and drop functionality', async () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    const dropZone = screen.getByText('Upload Plant Image').closest('div');
    const validFile = createMockFile('test.png', 1024, 'image/png');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: { files: [validFile] }
    });
    
    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [validFile] }
    });
    
    await waitFor(() => {
      expect(mockOnImageUpload).toHaveBeenCalled();
    });
  });

  it('disables interaction when disabled prop is true', () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} disabled={true} />);
    
    const chooseFileButton = screen.getByRole('button', { name: /choose file/i });
    expect(chooseFileButton).toBeDisabled();
  });

  it('shows mobile photo tips toggle', () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    expect(screen.getByText('Photo Tips')).toBeInTheDocument();
    expect(screen.getByText('Need help taking better photos?')).toBeInTheDocument();
  });

  it('shows camera button on mobile with camera support', () => {
    // Mock mobile user agent and camera support
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    });
    
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
  });

  it('handles basic functionality correctly', () => {
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    // Component should render without errors
    expect(screen.getByText('Upload Plant Image')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });
});  it('expands photo tips when clicked on mobile', async () => {
    const user = userEvent.setup();
    
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    const showTipsButton = screen.getByText('Show Tips');
    await user.click(showTipsButton);
    
    expect(screen.getByText('📱 Photo Tips for Best Results')).toBeInTheDocument();
    expect(screen.getByText('Lighting')).toBeInTheDocument();
    expect(screen.getByText('Camera Technique')).toBeInTheDocument();
    expect(screen.getByText('Composition')).toBeInTheDocument();
  });

  it('shows optimization stats after image processing', async () => {
    const user = userEvent.setup();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    const input = screen.getByRole('button', { name: /choose file/i });
    await user.click(input);
    
    // Mock file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Optimized:/)).toBeInTheDocument();
    });
  });

  it('applies mobile-specific styling and touch interactions', () => {
    // Mock mobile user agent and touch support
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    Object.defineProperty(window, 'ontouchstart', {
      value: () => {},
      configurable: true,
    });
    
    render(<ImageUpload onImageUpload={mockOnImageUpload} />);
    
    const uploadArea = screen.getByText('Upload Plant Image').closest('div');
    expect(uploadArea).toHaveClass('active:scale-95');
    
    const chooseFileButton = screen.getByText('Choose File');
    expect(chooseFileButton).toHaveClass('active:scale-95');
  });