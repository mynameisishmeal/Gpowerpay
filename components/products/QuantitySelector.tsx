import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * QuantitySelector Component
 * Increment/decrement quantity with input field
 */
export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999,
  disabled = false,
  size = 'md',
}: QuantitySelectorProps) {
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const increment = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const decrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      if (value >= min && value <= max) {
        onQuantityChange(value);
      }
    } else if (e.target.value === '') {
      onQuantityChange(min);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={decrement}
        disabled={disabled || quantity <= min}
        className={buttonSizes[size]}
      >
        <Minus size={16} />
      </Button>

      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className={`
          w-20 text-center border border-gray-300 rounded-lg font-medium
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${sizeClasses[size]}
        `}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={increment}
        disabled={disabled || quantity >= max}
        className={buttonSizes[size]}
      >
        <Plus size={16} />
      </Button>
    </div>
  );
}
