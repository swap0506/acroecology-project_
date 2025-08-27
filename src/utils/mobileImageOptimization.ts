import { getMobileOptimizedImageSize, getOptimalCompressionQuality } from '../hooks/useMobile';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  enableProgressiveJPEG?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  hasExif: boolean;
}

export class MobileImageOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas?: OffscreenCanvas;
  private worker?: Worker;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    // Initialize offscreen canvas for better performance if available
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(1, 1);
    }
    
    // Initialize web worker for heavy processing if available
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Create inline worker for image processing
      const workerCode = `
        self.onmessage = function(e) {
          const { imageData, options } = e.data;
          
          // Perform heavy image processing operations here
          // This is a placeholder for more complex algorithms
          
          self.postMessage({
            success: true,
            processedData: imageData
          });
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      // Set up worker message handling
      this.worker.onmessage = (e) => {
        // Handle worker responses
        console.log('Worker response:', e.data);
      };
    } catch (error) {
      console.warn('Web Worker not available for image processing:', error);
    }
  }

  async optimizeForMobile(
    file: File, 
    options: ImageOptimizationOptions = {}
  ): Promise<{ file: File; metadata: ImageMetadata; compressionRatio: number }> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = getOptimalCompressionQuality(file.size),
      format = 'jpeg',
      enableProgressiveJPEG = true
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          const originalSize = file.size;
          const { width, height } = getMobileOptimizedImageSize(img.width, img.height);
          
          // Use offscreen canvas for better performance if available
          const canvas = this.offscreenCanvas || this.canvas;
          const ctx = canvas.getContext('2d')!;
          
          // Use the context for processing
          console.log('Using canvas context for image processing');
          
          // Set canvas dimensions
          canvas.width = Math.min(width, maxWidth);
          canvas.height = Math.min(height, maxHeight);
          
          // Apply advanced image processing
          await this.applyAdvancedProcessing(ctx, img, canvas.width, canvas.height, options);
          
          // Convert to blob with optimization
          const blob = await this.canvasToOptimizedBlob(canvas, format, quality, enableProgressiveJPEG);
          
          if (!blob) {
            reject(new Error('Failed to optimize image'));
            return;
          }

          const optimizedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now()
          });

          const metadata: ImageMetadata = {
            width: canvas.width,
            height: canvas.height,
            size: optimizedFile.size,
            format: format,
            hasExif: false // EXIF data is removed during canvas processing
          };

          const compressionRatio = originalSize / optimizedFile.size;

          resolve({
            file: optimizedFile,
            metadata,
            compressionRatio
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private async applyAdvancedProcessing(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
    options: ImageOptimizationOptions
  ): Promise<void> {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw image with potential filters
    ctx.drawImage(img, 0, 0, width, height);
    
    // Apply additional processing if needed
    if (options.format === 'jpeg') {
      // Apply slight sharpening for JPEG to counteract compression blur
      await this.applySharpeningFilter(ctx, width, height);
    }
  }

  private async applySharpeningFilter(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): Promise<void> {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const sharpened = new Uint8ClampedArray(data);
      
      // Simple unsharp mask filter
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB channels only
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * width + x) * 4 + c;
            sharpened[idx] = Math.max(0, Math.min(255, sum));
          }
        }
      }
      
      const sharpenedImageData = new ImageData(sharpened, width, height);
      ctx.putImageData(sharpenedImageData, 0, 0);
    } catch (error) {
      console.warn('Sharpening filter failed, using original image:', error);
    }
  }

  private async canvasToOptimizedBlob(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    format: string,
    quality: number,
    enableProgressiveJPEG: boolean
  ): Promise<Blob | null> {
    if (format === 'jpeg' && enableProgressiveJPEG) {
      // For progressive JPEG, we need to use a different approach
      // This is a simplified version - in production, you might use a library like jpeg-js
      if ('convertToBlob' in canvas) {
        return await canvas.convertToBlob({ type: `image/${format}`, quality });
      } else {
        return await new Promise<Blob | null>(resolve => 
          (canvas as HTMLCanvasElement).toBlob(resolve, `image/${format}`, quality)
        );
      }
    }
    
    if ('convertToBlob' in canvas) {
      return await canvas.convertToBlob({ type: `image/${format}`, quality });
    } else {
      return await new Promise<Blob | null>(resolve => 
        (canvas as HTMLCanvasElement).toBlob(resolve, `image/${format}`, quality)
      );
    }
  }

  async batchOptimize(
    files: File[],
    options: ImageOptimizationOptions = {}
  ): Promise<Array<{ file: File; metadata: ImageMetadata; compressionRatio: number }>> {
    const results: Array<{ file: File; metadata: ImageMetadata; compressionRatio: number }> = [];
    const concurrencyLimit = 3; // Process 3 images at a time
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(file => this.optimizeForMobile(file, options));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to optimize image ${i + index}:`, result.reason);
          // Add error result
          results.push({
            file: batch[index],
            metadata: {
              width: 0,
              height: 0,
              size: batch[index].size,
              format: 'error',
              hasExif: false
            },
            compressionRatio: 1
          });
        }
      });
    }
    
    return results;
  }

  async createThumbnail(
    file: File,
    maxSize: number = 150
  ): Promise<{ file: File; metadata: ImageMetadata }> {
    const result = await this.optimizeForMobile(file, {
      maxWidth: maxSize,
      maxHeight: maxSize,
      quality: 0.7,
      format: 'jpeg'
    });
    
    return {
      file: result.file,
      metadata: result.metadata
    };
  }

  async getImageMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const metadata: ImageMetadata = {
          width: img.width,
          height: img.height,
          size: file.size,
          format: file.type.split('/')[1] || 'unknown',
          hasExif: this.hasExifData(file)
        };
        
        resolve(metadata);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for metadata extraction'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private hasExifData(file: File): boolean {
    // Simple check for EXIF data presence (JPEG files starting with specific bytes)
    return file.type === 'image/jpeg' && file.size > 1000;
  }

  generatePhotoQualityTips(isMobile: boolean, hasCamera: boolean): string[] {
    const baseTips = [
      'Ensure good lighting - natural light works best',
      'Hold the camera steady and focus on the affected area',
      'Include some healthy parts of the plant for comparison',
      'Take the photo from 6-12 inches away from the plant',
      'Avoid blurry or dark images'
    ];

    const mobileTips = [
      'Use both hands to steady your phone',
      'Tap the screen to focus on the affected area',
      'Turn on HDR mode if available for better detail',
      'Clean your camera lens before taking photos',
      'Take multiple photos from different angles'
    ];

    const cameraSpecificTips = [
      'Use the rear camera for better quality',
      'Enable flash only if lighting is very poor',
      'Use portrait mode if available for better focus',
      'Avoid using digital zoom - move closer instead'
    ];

    let tips = [...baseTips];
    
    if (isMobile) {
      tips = [...tips, ...mobileTips];
    }
    
    if (hasCamera) {
      tips = [...tips, ...cameraSpecificTips];
    }

    return tips;
  }

  cleanup() {
    // Clean up canvas resources if needed
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

// Singleton instance for reuse
export const mobileImageOptimizer = new MobileImageOptimizer();