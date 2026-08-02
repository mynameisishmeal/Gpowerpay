'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowCustom?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder, allowCustom = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || value || '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (allowCustom && search && !selectedOption) {
          onChange(search);
        }
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search, selectedOption, allowCustom, onChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (allowCustom) {
      onChange(e.target.value);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative mb-4">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between bg-white"
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={allowCustom ? "Search or type new..." : "Search..."}
            className="w-full px-4 py-2 border-b border-gray-200 focus:outline-none"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                {allowCustom && search ? (
                  <button 
                    onClick={() => handleSelect(search)}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Add "{search}" as new customer
                  </button>
                ) : (
                  'No results found'
                )}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  onClick={() => handleSelect(option.value)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-gray-900"
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
