'use client';

import { useState, useEffect } from 'react';
import { ICategory, IProductFilters, MarketType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';

interface ProductFiltersProps {
  categories: ICategory[];
  filters: IProductFilters;
  onFiltersChange: (filters: IProductFilters) => void;
  onReset: () => void;
  priceRange: { min: number; max: number };
}

/**
 * ProductFilters Component
 * Sidebar filters for product listing page
 */
export function ProductFilters({
  categories,
  filters,
  onFiltersChange,
  onReset,
  priceRange,
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice || priceRange.min);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice || priceRange.max);

  // Update local state when filters change externally
  useEffect(() => {
    setLocalMinPrice(filters.minPrice || priceRange.min);
    setLocalMaxPrice(filters.maxPrice || priceRange.max);
  }, [filters.minPrice, filters.maxPrice, priceRange]);

  const updateFilter = (key: keyof IProductFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Debounced price update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMinPrice !== filters.minPrice || localMaxPrice !== filters.maxPrice) {
        onFiltersChange({
          ...filters,
          minPrice: localMinPrice === priceRange.min ? undefined : localMinPrice,
          maxPrice: localMaxPrice === priceRange.max ? undefined : localMaxPrice,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localMinPrice, localMaxPrice]);

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => updateFilter('category', undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category._id.toString()} className="flex items-center">
              <input
                type="radio"
                name="category"
                checked={filters.category === category._id.toString()}
                onChange={() => updateFilter('category', category._id.toString())}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {category.name}
                {category.productCount > 0 && (
                  <span className="text-gray-500 ml-1">({category.productCount})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Market Type Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Purchase Option</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="marketType"
              checked={!filters.marketType}
              onChange={() => updateFilter('marketType', undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">All Options</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="marketType"
              checked={filters.marketType === 'kilo'}
              onChange={() => updateFilter('marketType', 'kilo' as MarketType)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Per Kilo</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="marketType"
              checked={filters.marketType === 'carton'}
              onChange={() => updateFilter('marketType', 'carton' as MarketType)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Per Carton</span>
          </label>
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-4">
          {/* Price Display */}
          <div className="flex justify-between text-sm font-medium text-gray-700">
            <span>{formatPrice(localMinPrice)}</span>
            <span>{formatPrice(localMaxPrice)}</span>
          </div>
          
          {/* Min Price Slider */}
          <div>
            <label className="text-xs text-gray-600 mb-2 block">Minimum Price</label>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={1000}
              value={localMinPrice}
              onChange={(e) => {
                const newMin = Number(e.target.value);
                if (newMin <= localMaxPrice) {
                  setLocalMinPrice(newMin);
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <Input
              type="number"
              placeholder="Min price"
              value={localMinPrice}
              onChange={(e) => {
                const newMin = Number(e.target.value) || priceRange.min;
                if (newMin <= localMaxPrice) {
                  setLocalMinPrice(newMin);
                }
              }}
              className="h-9 mt-2"
              min={priceRange.min}
              max={localMaxPrice}
              step={1000}
            />
          </div>

          {/* Max Price Slider */}
          <div>
            <label className="text-xs text-gray-600 mb-2 block">Maximum Price</label>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={1000}
              value={localMaxPrice}
              onChange={(e) => {
                const newMax = Number(e.target.value);
                if (newMax >= localMinPrice) {
                  setLocalMaxPrice(newMax);
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <Input
              type="number"
              placeholder="Max price"
              value={localMaxPrice}
              onChange={(e) => {
                const newMax = Number(e.target.value) || priceRange.max;
                if (newMax >= localMinPrice) {
                  setLocalMaxPrice(newMax);
                }
              }}
              className="h-9 mt-2"
              min={localMinPrice}
              max={priceRange.max}
              step={1000}
            />
          </div>
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Availability</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
        </label>
      </div>

      {/* Special Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Special</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.isFeatured || false}
              onChange={(e) => updateFilter('isFeatured', e.target.checked || undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Featured Products</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.isNewArrival || false}
              onChange={(e) => updateFilter('isNewArrival', e.target.checked || undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">New Arrivals</span>
          </label>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <X size={16} className="mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          variant="outline"
          className="w-full"
        >
          <Filter size={16} className="mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
