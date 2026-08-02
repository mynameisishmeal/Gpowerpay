import { ArrowUpDown } from 'lucide-react';

interface ProductSortProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * ProductSort Component
 * Dropdown for sorting products
 */
export function ProductSort({ value, onChange }: ProductSortProps) {
  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'salesCount-desc', label: 'Most Popular' },
    { value: 'averageRating-desc', label: 'Highest Rated' },
  ];

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={16} className="text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
