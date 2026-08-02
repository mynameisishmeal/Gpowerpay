import { MarketType } from '@/types';

interface MarketTypeSelectorProps {
  availableMarkets: MarketType[];
  selected: MarketType;
  onSelect: (marketType: MarketType) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * MarketTypeSelector Component
 * Toggle between Kilo and Carton purchase options
 */
export function MarketTypeSelector({
  availableMarkets,
  selected,
  onSelect,
  disabled = false,
  className = '',
}: MarketTypeSelectorProps) {
  if (availableMarkets.length === 1) {
    // If only one market type available, show as label
    return (
      <div className={`inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium ${className}`}>
        {selected === 'kilo' ? 'Per Kilo' : 'Per Carton'}
      </div>
    );
  }

  return (
    <div className={`inline-flex rounded-lg border border-gray-300 bg-white ${className}`}>
      {availableMarkets.includes('kilo') && (
        <button
          type="button"
          onClick={() => onSelect('kilo')}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm font-medium rounded-l-lg transition-colors
            ${selected === 'kilo'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Per Kilo
        </button>
      )}
      
      {availableMarkets.includes('carton') && (
        <button
          type="button"
          onClick={() => onSelect('carton')}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm font-medium rounded-r-lg transition-colors
            ${selected === 'carton'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${availableMarkets.includes('kilo') ? 'border-l border-gray-300' : ''}
          `}
        >
          Per Carton
        </button>
      )}
    </div>
  );
}
