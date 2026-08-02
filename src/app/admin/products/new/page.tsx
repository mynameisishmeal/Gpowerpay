'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormWizard } from '@/components/admin/FormWizard';
import { BasicInfoStep } from '@/components/admin/product-form/BasicInfoStep';
import { PricingStep } from '@/components/admin/product-form/PricingStep';
import { InventoryStep } from '@/components/admin/product-form/InventoryStep';
import { ImageStep } from '@/components/admin/product-form/ImageStep';
import { SEOStep } from '@/components/admin/product-form/SEOStep';
import { ICategory, MarketType } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Product details' },
  { id: 'pricing', title: 'Pricing', description: 'Price & markets' },
  { id: 'inventory', title: 'Inventory', description: 'Stock levels' },
  { id: 'images', title: 'Images', description: 'Product photos' },
  { id: 'seo', title: 'SEO & Publish', description: 'Optimization' },
];

interface ProductFormData {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  tags: string[];
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
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  slug: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  isFeatured: boolean;
}

/**
 * Add New Product Page
 * Multi-step wizard for creating products
 */
export default function NewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    brand: '',
    sku: '',
    tags: [],
    availableMarkets: ['kilo'],
    pricing: {
      kilo: {
        price: 0,
        compareAtPrice: 0,
        minQuantity: 1,
        maxQuantity: 0,
      },
      carton: {
        price: 0,
        compareAtPrice: 0,
        minQuantity: 1,
        maxQuantity: 0,
        unitsPerCarton: 1,
      },
    },
    inventory: {
      kilo: {
        stock: 0,
        lowStockThreshold: 10,
        trackInventory: true,
      },
      carton: {
        stock: 0,
        lowStockThreshold: 5,
        trackInventory: true,
      },
    },
    images: [],
    slug: '',
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
    status: 'draft',
    isFeatured: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?status=active');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = 'Product name is required';
        }
        if (!formData.category) {
          newErrors.category = 'Category is required';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        break;

      case 1: // Pricing
        if (formData.availableMarkets.length === 0) {
          newErrors.availableMarkets = 'Select at least one market type';
        }
        if (formData.availableMarkets.includes('kilo') && formData.pricing.kilo.price <= 0) {
          newErrors.kiloPrice = 'Kilo price must be greater than 0';
        }
        if (formData.availableMarkets.includes('carton') && formData.pricing.carton.price <= 0) {
          newErrors.cartonPrice = 'Carton price must be greater than 0';
        }
        break;

      case 4: // SEO
        if (!formData.slug.trim()) {
          newErrors.slug = 'URL slug is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepChange = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep) {
      // Validate current step before allowing forward navigation
      if (validateStep(currentStep)) {
        setCurrentStep(step);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/admin/products');
      } else {
        alert(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={formData}
            categories={categories}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 1:
        return (
          <PricingStep
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <InventoryStep
            data={formData}
            onChange={handleChange}
          />
        );
      case 3:
        return (
          <ImageStep
            data={formData}
            onChange={handleChange}
          />
        );
      case 4:
        return (
          <SEOStep
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">
            Create a new product for your catalog
          </p>
        </div>

        {/* Form Wizard */}
        <FormWizard
          steps={STEPS}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === STEPS.length - 1}
          canProceed={true}
          isSubmitting={loading}
        >
          {renderStep()}
        </FormWizard>
      </div>
    </div>
  );
}
