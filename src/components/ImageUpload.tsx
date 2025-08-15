import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Camera, X, AlertCircle, CheckCircle, Loader2, Smartphone, Zap, Focus } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import { mobileImageOptimizer } from '../utils/mobileImageOptimization';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onAnalysisComplete?: (result: any) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  maxSizeBytes?: number;
  compressionQuality?: number;
  onRetry?: () => void;
  showRecoveryOptions?: boolean;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onAnalysisComplete,
  loading = false,
  error,
  disabled = false,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  compressionQuality = 0.8,
  onRetry,
  showRecoveryOptions = true
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Use mobile capabilities hook
  const { isMobile, isTablet, hasCamera, hasTouchScreen, orientation, screenSize } = useMobile();

  // Validate file format and size
  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a .jpg or .png image file.';
    }
    
    if (file.size > maxSizeBytes) {
      const maxSizeMB = maxSizeBytes / (1024 * 1024);
      return `File size must be less than ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
    }
    
    return null;
  }, [maxSizeBytes]);

  // Enhanced mobile-optimized image compression
  const optimizeImage = useCallback(async (file: File): Promise<File> => {
    try {
      const result = await mobileImageOptimizer.optimizeForMobile(file, {
        quality: compressionQuality,
        maxWidth: isMobile ? 1920 : 2560,
        maxHeight: isMobile ? 1920 : 2560,
        format: file.type.includes('png') ? 'png' : 'jpeg'
      });

      // Store optimization stats for user feedback
      setOptimizationStats({
        originalSize: file.size,
        optimizedSize: result.file.size,
        compressionRatio: result.compressionRatio
      });

      return result.file;
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return file;
    }
  }, [compressionQuality, isMobile]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setValidationError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    try {
      // Show upload progress simulation
      setUploadProgress({ loaded: 0, total: 100, percentage: 0 });
      
      // Optimize image for mobile
      setUploadProgress({ loaded: 25, total: 100, percentage: 25 });
      const optimizedFile = await optimizeImage(file);
      
      // Update progress
      setUploadProgress({ loaded: 75, total: 100, percentage: 75 });
      
      // Create preview
      const previewUrl = URL.createObjectURL(optimizedFile);
      setPreviewUrl(previewUrl);
      setSelectedFile(optimizedFile);
      
      // Complete progress
      setUploadProgress({ loaded: 100, total: 100, percentage: 100 });
      
      // Call upload handler
      onImageUpload(optimizedFile);
      
      // Clear progress after a short delay
      setTimeout(() => setUploadProgress(null), 1000);
      
    } catch (error) {
      setValidationError('Failed to process image. Please try again.');
      setUploadProgress(null);
    }
  }, [validateFile, optimizeImage, onImageUpload]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || loading) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [disabled, loading, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  // Clear selected file
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setValidationError(null);
    setUploadProgress(null);
    setOptimizationStats(null);
    
    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="w-full space-y-4">
      {/* Main Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-2xl transition-all duration-300
          ${isMobile || hasTouchScreen ? 'p-6' : 'p-8'} text-center
          ${dragActive 
            ? 'border-green-500 bg-green-50 scale-105' 
            : selectedFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${loading ? 'pointer-events-none' : ''}
          ${hasTouchScreen ? 'active:scale-95 active:bg-gray-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !loading && fileInputRef.current?.click()}
      >
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">Analyzing image...</p>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl">
            <div className="text-center w-full max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Processing image... {uploadProgress.percentage}%
              </p>
            </div>
          </div>
        )}

        {/* Preview or Upload Interface */}
        {selectedFile && previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-64 rounded-lg shadow-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={disabled || loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB</p>
              {optimizationStats && (
                <div className="flex items-center justify-center gap-2 text-xs text-green-600">
                  <Zap size={12} />
                  <span>
                    Optimized: {((1 - (optimizationStats.optimizedSize / optimizationStats.originalSize)) * 100).toFixed(0)}% smaller
                  </span>
                </div>
              )}
            </div>
            {!loading && (
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Ready for analysis</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`${isMobile ? 'text-4xl' : 'text-6xl'} mb-4`}>📸</div>
            <div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-800 mb-2`}>
                Upload Plant Image
              </h3>
              <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : ''}`}>
                Take or upload a photo of your affected plant for identification
              </p>
            </div>
            
            {/* Upload Options */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-3 justify-center`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={disabled || loading}
                className={`
                  flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg 
                  hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${hasTouchScreen ? 'active:bg-green-700 active:scale-95' : ''}
                  ${isMobile ? 'text-base font-medium' : ''}
                `}
              >
                <Upload className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                Choose File
              </button>
              
              {hasCamera && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraCapture();
                  }}
                  disabled={disabled || loading}
                  className={`
                    flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg 
                    hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${hasTouchScreen ? 'active:bg-blue-700 active:scale-95' : ''}
                    ${isMobile ? 'text-base font-medium' : ''}
                  `}
                >
                  <Camera className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                  Take Photo
                </button>
              )}
              
              {/* Photo Tips Toggle for Mobile */}
              {isMobile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPhotoTips(!showPhotoTips);
                  }}
                  className={`
                    flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg 
                    hover:bg-gray-200 transition-colors
                    ${hasTouchScreen ? 'active:bg-gray-300 active:scale-95' : ''}
                  `}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Photo Tips
                </button>
              )}
            </div>
            
            {!isMobile && (
              <p className="text-sm text-gray-500">
                Drag and drop an image here, or click to select
              </p>
            )}
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>
              Supports .jpg and .png files up to {maxSizeBytes / (1024 * 1024)}MB
            </p>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || loading}
        />
        
        {hasCamera && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || loading}
          />
        )}
      </div>

      {/* Enhanced Error Display with Recovery Options */}
      {(validationError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">Upload Error</p>
              <p className="text-red-700 text-sm mt-1">
                {validationError || error}
              </p>
              
              {/* Recovery Suggestions */}
              {showRecoveryOptions && (validationError || error) && (
                <div className="mt-3">
                  <p className="text-red-800 text-xs font-medium mb-2">Try these solutions:</p>
                  <ul className="text-red-700 text-xs space-y-1">
                    {validationError ? (
                      <>
                        <li>• Ensure your image is in JPG or PNG format</li>
                        <li>• Check that file size is under {maxSizeBytes / (1024 * 1024)}MB</li>
                        <li>• Try compressing the image before uploading</li>
                      </>
                    ) : (
                      <>
                        <li>• Check your internet connection</li>
                        <li>• Try uploading a different image</li>
                        <li>• Refresh the page and try again</li>
                        <li>• Contact support if the problem persists</li>
                      </>
                    )}
                  </ul>
                  
                  {/* Retry Button */}
                  {onRetry && !validationError && (
                    <button
                      onClick={onRetry}
                      className="mt-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Photo Quality Tips for Mobile */}
      {(isMobile && showPhotoTips) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-blue-800 text-sm font-medium flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              📱 Photo Tips for Best Results
            </h4>
            <button
              onClick={() => setShowPhotoTips(false)}
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="grid gap-3">
            {/* Lighting Tips */}
            <div className="bg-blue-100 rounded-lg p-3">
              <h5 className="text-blue-800 font-medium text-xs mb-2 flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Lighting
              </h5>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Use natural daylight when possible</li>
                <li>• Avoid harsh shadows or direct sunlight</li>
                <li>• Turn on HDR mode for better detail</li>
              </ul>
            </div>

            {/* Camera Technique */}
            <div className="bg-blue-100 rounded-lg p-3">
              <h5 className="text-blue-800 font-medium text-xs mb-2 flex items-center">
                <Focus className="w-3 h-3 mr-2" />
                Camera Technique
              </h5>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Hold phone with both hands for stability</li>
                <li>• Tap screen to focus on affected area</li>
                <li>• Take photo 6-12 inches from plant</li>
                <li>• Use rear camera for better quality</li>
              </ul>
            </div>

            {/* Composition */}
            <div className="bg-blue-100 rounded-lg p-3">
              <h5 className="text-blue-800 font-medium text-xs mb-2 flex items-center">
                <Camera className="w-3 h-3 mr-2" />
                Composition
              </h5>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Include both affected and healthy parts</li>
                <li>• Fill frame with plant details</li>
                <li>• Take multiple angles if unsure</li>
                <li>• Avoid blurry or dark images</li>
              </ul>
            </div>
          </div>

          {orientation === 'landscape' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-yellow-800 text-xs">
                💡 Tip: Portrait orientation often works better for plant photos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Always show basic tips for mobile users */}
      {isMobile && !showPhotoTips && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-blue-700 text-xs">
              💡 Need help taking better photos?
            </p>
            <button
              onClick={() => setShowPhotoTips(true)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              Show Tips
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;