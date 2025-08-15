import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Info, AlertCircle } from 'lucide-react';
import { SOIL_TYPE_OPTIONS, getSoilTypeLabel } from '../types/soilTypes';
import { soilTypeService } from '../services/soilTypeService';

interface SoilTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SoilTypeSelector: React.FC<SoilTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDescription, setShowDescription] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isServiceReady, setIsServiceReady] = useState(false);

  useEffect(() => {
    // Check if soil type service is ready
    try {
      const ready = soilTypeService.isReady();
      setIsServiceReady(ready);
      if (!ready) {
        setServiceError('Soil type data is not available. You can still proceed without soil-specific recommendations.');
      }
    } catch (error) {
      setServiceError('Error loading soil type data. Please try refreshing the page.');
      setIsServiceReady(false);
    }
  }, []);

  const handleSelect = useCallback((soilTypeValue: string) => {
    try {
      onChange(soilTypeValue);
      setIsOpen(false);
      setServiceError(null); // Clear any previous errors
    } catch (error) {
      setServiceError('Error selecting soil type. Please try again.');
    }
  }, [onChange]);

  const selectedLabel = useMemo(() => {
    if (!value) return 'Select your soil type';
    return getSoilTypeLabel(value);
  }, [value]);

  const getSoilDescription = useCallback((soilTypeKey: string): string => {
    try {
      if (!isServiceReady) return 'Soil data not available';
      
      const soilType = soilTypeService.getSoilType(soilTypeKey);
      if (!soilType) return 'Description not available for this soil type';
      
      const mainCharacteristics = soilType.characteristics.slice(0, 2).join('. ');
      return `${mainCharacteristics}. Drainage: ${soilType.drainage}, Water retention: ${soilType.water_retention}.`;
    } catch (error) {
      return 'Error loading soil description';
    }
  }, [isServiceReady]);

  return (
    <div className="relative w-full">
      {/* Main Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-white border-2 rounded-xl transition-all duration-300
          ${disabled 
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
            : isOpen 
              ? 'border-green-500 shadow-lg ring-2 ring-green-200' 
              : value 
                ? 'border-green-300 hover:border-green-400' 
                : 'border-gray-300 hover:border-gray-400'
          }
          focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500
          text-base md:text-lg
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`${value ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
            {selectedLabel}
          </span>
          <ChevronDown 
            className={`
              w-5 h-5 transition-transform duration-200
              ${isOpen ? 'rotate-180' : 'rotate-0'}
              ${disabled ? 'text-gray-400' : 'text-gray-600'}
            `} 
          />
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {SOIL_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="relative">
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setShowDescription(option.value)}
                onMouseLeave={() => setShowDescription(null)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-200
                  border-b border-gray-100 last:border-b-0
                  ${value === option.value ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-700'}
                  focus:outline-none focus:bg-green-50
                  text-base md:text-lg
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
              </button>

              {/* Soil Type Description Tooltip */}
              {showDescription === option.value && (
                <div className="absolute left-full top-0 ml-2 w-80 bg-gray-800 text-white text-sm rounded-lg p-3 shadow-lg z-60 hidden md:block">
                  <div className="absolute left-0 top-4 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800 -ml-1"></div>
                  <h4 className="font-semibold mb-1">{option.label} Soil</h4>
                  <p className="text-gray-200 leading-relaxed">
                    {getSoilDescription(option.value)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Soil Type Description (Mobile) */}
      {value && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg md:hidden">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800 text-sm">
                {getSoilTypeLabel(value)} Soil
              </h4>
              <p className="text-green-700 text-xs mt-1 leading-relaxed">
                {getSoilDescription(value)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Error Display */}
      {serviceError && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-700 text-xs leading-relaxed">
                {serviceError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Display */}
      {!value && !serviceError && (
        <p className="mt-2 text-sm text-gray-500">
          Selecting your soil type will provide more accurate crop recommendations
        </p>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SoilTypeSelector;