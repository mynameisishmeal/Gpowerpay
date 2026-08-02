import { Input } from '@/components/ui/input';
import { MarketType } from '@/types';

interface PricingStepProps {
  data: {
    availableMarkets: MarketType[];
    pricing: {
      kilo: {
        price: number;
        compareAtPrice: number;
        minQuantity: number;
        maxQuantity: number;
      };
      carton: {
        price: number;
        compareAtPrice: number;
        minQuantity: number;
        maxQuantity: number;
        unitsPerCarton: number;
      };
    };
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

/**
 * PricingStep Component
 * Step 2: Pricing and market configuration
 */
export function PricingStep({ data, onChange, errors = {} }: PricingStepProps) {
  const updateMarket = (checked: boolean, market: MarketType) => {
    const markets = checked
      ? [...data.availableMarkets, market]
      : data.availableMarkets.filter((m) => m !== market);
    onChange('availableMarkets', markets);
  };

  const updatePricing = (market: 'kilo' | 'carton', field: string, value: any) => {
    onChange('pricing', {
      ...data.pricing,
      [market]: {
        ...data.pricing[market],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing & Markets
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure pricing for kilo and/or carton purchases
        </p>
      </div>

      {/* Available Markets */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Available Purchase Options <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.availableMarkets.includes('kilo')}
              onChange={(e) => updateMarket(e.target.checked, 'kilo')}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Per Kilo</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.availableMarkets.includes('carton')}
              onChange={(e) => updateMarket(e.target.checked, 'carton')}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Per Carton (Bulk)</span>
          </label>
        </div>
        {errors.availableMarkets && (
          <p className="mt-2 text-sm text-red-600">{errors.availableMarkets}</p>
        )}
      </div>

      {/* Kilo Pricing */}
      {data.availableMarkets.includes('kilo') && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Per Kilo Pricing</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={data.pricing.kilo.price}
                onChange={(e) => updatePricing('kilo', 'price', Number(e.target.value))}
                min="0"
                step="0.01"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare at Price (₦)
              </label>
              <Input
                type="number"
                value={data.pricing.kilo.compareAtPrice}
                onChange={(e) => updatePricing('kilo', 'compareAtPrice', Number(e.target.value))}
                min="0"
                step="0.01"
                className="h-11"
              />
              <p className="mt-1 text-xs text-gray-500">Original price for discount display</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Quantity
              </label>
              <Input
                type="number"
                value={data.pricing.kilo.minQuantity}
                onChange={(e) => updatePricing('kilo', 'minQuantity', Number(e.target.value))}
                min="1"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Quantity (Optional)
              </label>
              <Input
                type="number"
                value={data.pricing.kilo.maxQuantity}
                onChange={(e) => updatePricing('kilo', 'maxQuantity', Number(e.target.value))}
                min="1"
                className="h-11"
              />
            </div>
          </div>
        </div>
      )}

      {/* Carton Pricing */}
      {data.availableMarkets.includes('carton') && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Per Carton Pricing</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={data.pricing.carton.price}
                onChange={(e) => updatePricing('carton', 'price', Number(e.target.value))}
                min="0"
                step="0.01"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare at Price (₦)
              </label>
              <Input
                type="number"
                value={data.pricing.carton.compareAtPrice}
                onChange={(e) => updatePricing('carton', 'compareAtPrice', Number(e.target.value))}
                min="0"
                step="0.01"
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units per Carton <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={data.pricing.carton.unitsPerCarton}
                onChange={(e) => updatePricing('carton', 'unitsPerCarton', Number(e.target.value))}
                min="1"
                className="h-11"
              />
              <p className="mt-1 text-xs text-gray-500">e.g., 12 packs per carton</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Quantity
              </label>
              <Input
                type="number"
                value={data.pricing.carton.minQuantity}
                onChange={(e) => updatePricing('carton', 'minQuantity', Number(e.target.value))}
                min="1"
                className="h-11"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Quantity (Optional)
              </label>
              <Input
                type="number"
                value={data.pricing.carton.maxQuantity}
                onChange={(e) => updatePricing('carton', 'maxQuantity', Number(e.target.value))}
                min="1"
                className="h-11"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
