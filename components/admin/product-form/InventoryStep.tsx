import { Input } from '@/components/ui/input';
import { MarketType } from '@/types';

interface InventoryStepProps {
  data: {
    availableMarkets: MarketType[];
    inventory: {
      kilo: {
        stock: number;
        lowStockThreshold: number;
        trackInventory: boolean;
      };
      carton: {
        stock: number;
        lowStockThreshold: number;
        trackInventory: boolean;
      };
    };
  };
  onChange: (field: string, value: any) => void;
}

/**
 * InventoryStep Component
 * Step 3: Inventory management
 */
export function InventoryStep({ data, onChange }: InventoryStepProps) {
  const updateInventory = (market: 'kilo' | 'carton', field: string, value: any) => {
    onChange('inventory', {
      ...data.inventory,
      [market]: {
        ...data.inventory[market],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Inventory Management
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure stock levels and tracking for each market type
        </p>
      </div>

      {/* Kilo Inventory */}
      {data.availableMarkets.includes('kilo') && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Per Kilo Inventory</h4>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.inventory.kilo.trackInventory}
                onChange={(e) => updateInventory('kilo', 'trackInventory', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Track inventory for this market
              </span>
            </label>

            {data.inventory.kilo.trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock (kg)
                  </label>
                  <Input
                    type="number"
                    value={data.inventory.kilo.stock}
                    onChange={(e) => updateInventory('kilo', 'stock', Number(e.target.value))}
                    min="0"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Alert (kg)
                  </label>
                  <Input
                    type="number"
                    value={data.inventory.kilo.lowStockThreshold}
                    onChange={(e) => updateInventory('kilo', 'lowStockThreshold', Number(e.target.value))}
                    min="0"
                    className="h-11"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Alert when stock falls below this level
                  </p>
                </div>
              </div>
            )}

            {!data.inventory.kilo.trackInventory && (
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">
                  Inventory tracking disabled. Product will always show as available.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Carton Inventory */}
      {data.availableMarkets.includes('carton') && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Per Carton Inventory</h4>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.inventory.carton.trackInventory}
                onChange={(e) => updateInventory('carton', 'trackInventory', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Track inventory for this market
              </span>
            </label>

            {data.inventory.carton.trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock (cartons)
                  </label>
                  <Input
                    type="number"
                    value={data.inventory.carton.stock}
                    onChange={(e) => updateInventory('carton', 'stock', Number(e.target.value))}
                    min="0"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Alert (cartons)
                  </label>
                  <Input
                    type="number"
                    value={data.inventory.carton.lowStockThreshold}
                    onChange={(e) => updateInventory('carton', 'lowStockThreshold', Number(e.target.value))}
                    min="0"
                    className="h-11"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Alert when stock falls below this level
                  </p>
                </div>
              </div>
            )}

            {!data.inventory.carton.trackInventory && (
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">
                  Inventory tracking disabled. Product will always show as available.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Disable inventory tracking for products with unlimited supply
          or if you manage stock externally.
        </p>
      </div>
    </div>
  );
}
