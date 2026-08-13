'use client';

import { useState, useEffect } from 'react';
import { Home, Store, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { DeliveryInfo, DeliveryOption } from '@/src/app/checkout/page';

interface CheckoutStepDeliveryProps {
  onBack: () => void;
  onContinue: (info: DeliveryInfo) => void;
  onDeliveryOptionChange?: (option: DeliveryOption) => void;
  initialData: DeliveryInfo | null;
}

interface SavedAddress {
  _id: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  phone: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'gpowerpay-delivery-info';

export function CheckoutStepDelivery({
  onBack,
  onContinue,
  onDeliveryOptionChange,
  initialData,
}: CheckoutStepDeliveryProps) {
  // Load saved data from localStorage or use initialData
  const getSavedData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedData = getSavedData();
  
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>(
    savedData?.option || initialData?.option || 'home'
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [formData, setFormData] = useState({
    street: savedData?.address?.street || initialData?.address?.street || '',
    city: savedData?.address?.city || initialData?.address?.city || '',
    state: 'Lagos', // Fixed to Lagos only
    landmark: savedData?.address?.landmark || initialData?.address?.landmark || '',
    phone: savedData?.address?.phone || initialData?.address?.phone || '',
    deliveryDate: savedData?.deliveryDate || initialData?.deliveryDate || '',
    pickupDate: savedData?.pickupDate || initialData?.pickupDate || '',
    customerNote: savedData?.customerNote || initialData?.customerNote || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const response = await fetch('/api/user/addresses');
        const data = await response.json();
        if (data.success && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          
          // Find default address or use first one
          const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
          if (defaultAddr && !savedData?.address?.street) {
            setSelectedAddressId(defaultAddr._id);
            setUseNewAddress(false);
            setFormData({
              ...formData,
              street: defaultAddr.street,
              city: defaultAddr.city,
              state: defaultAddr.state,
              landmark: defaultAddr.landmark || '',
              phone: defaultAddr.phone,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, []);

  // Handle saved address selection
  const handleAddressSelect = (addressId: string) => {
    const address = savedAddresses.find(a => a._id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setUseNewAddress(false);
      setFormData({
        ...formData,
        street: address.street,
        city: address.city,
        state: address.state,
        landmark: address.landmark || '',
        phone: address.phone,
      });
    }
  };

  // Save to localStorage whenever form data changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const dataToSave = {
      option: deliveryOption,
      address: deliveryOption === 'home' ? {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        landmark: formData.landmark,
        phone: formData.phone,
      } : undefined,
      deliveryDate: formData.deliveryDate,
      pickupDate: formData.pickupDate,
      customerNote: formData.customerNote,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save delivery info:', error);
    }
  }, [deliveryOption, formData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (deliveryOption === 'home') {
      if (!formData.street.trim()) newErrors.street = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';
    } else {
      if (!formData.pickupDate) newErrors.pickupDate = 'Pickup date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const deliveryInfo: DeliveryInfo = {
      option: deliveryOption,
      deliveryFee: 0, // No delivery fee yet
      customerNote: formData.customerNote,
    };

    if (deliveryOption === 'home') {
      deliveryInfo.address = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        landmark: formData.landmark,
        phone: formData.phone,
      };
      deliveryInfo.deliveryDate = formData.deliveryDate;
    } else {
      deliveryInfo.pickupDate = formData.pickupDate;
    }

    onContinue(deliveryInfo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Option Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Choose Delivery Option</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setDeliveryOption('home');
                onDeliveryOptionChange?.('home');
              }}
              className={`p-4 border-2 rounded-lg transition-all ${
                deliveryOption === 'home'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home size={24} className={deliveryOption === 'home' ? 'text-blue-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Home Delivery</p>
                  <p className="text-sm text-gray-500">Delivered to your address</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryOption('pickup');
                onDeliveryOptionChange?.('pickup');
              }}
              className={`p-4 border-2 rounded-lg transition-all ${
                deliveryOption === 'pickup'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Store size={24} className={deliveryOption === 'pickup' ? 'text-blue-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Store Pickup</p>
                  <p className="text-sm text-green-600 font-medium">Free</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Home Delivery Form */}
        {deliveryOption === 'home' && (
          <div className="space-y-4">
            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Choose Delivery Address</label>
                
                {/* Saved addresses list */}
                <div className="space-y-2">
                  {savedAddresses.map((address) => (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => handleAddressSelect(address._id)}
                      className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                        selectedAddressId === address._id && !useNewAddress
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin 
                          size={20} 
                          className={selectedAddressId === address._id && !useNewAddress ? 'text-blue-600 mt-1' : 'text-gray-400 mt-1'} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{address.city}, {address.state}</p>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{address.street}</p>
                          {address.landmark && (
                            <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* New Address Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setUseNewAddress(true);
                      setSelectedAddressId('');
                      setFormData({
                        ...formData,
                        street: '',
                        city: '',
                        state: '',
                        landmark: '',
                        phone: '',
                      });
                    }}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      useNewAddress
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className={useNewAddress ? 'text-blue-600' : 'text-gray-400'} />
                      <p className="font-semibold text-gray-900">Use a new address</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Address Form - Show only if using new address or no saved addresses */}
            {(useNewAddress || savedAddresses.length === 0) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Enter your street address"
                    className={errors.street ? 'border-red-500' : ''}
                  />
                  {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <Input
                      value="Lagos"
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Currently delivering only in Lagos</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                  <Input
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Nearby landmark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="080XXXXXXXX"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Delivery Date *</label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className={errors.deliveryDate ? 'border-red-500' : ''}
              />
              {errors.deliveryDate && <p className="text-red-500 text-sm mt-1">{errors.deliveryDate}</p>}
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
              <textarea
                value={formData.customerNote}
                onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
                placeholder="Let us know how you want your order treated, e.g., 'Please cut the fish into small pieces'"
                className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm transition-shadow"
              />
            </div>
          </div>
        )}

        {/* Store Pickup Info */}
        {deliveryOption === 'pickup' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Store Address</h4>
              <p className="text-gray-600 text-sm">Gpower Frozen Foods</p>
              <p className="text-gray-600 text-sm">123 Main Street, Lagos, Nigeria</p>
              <p className="text-gray-600 text-sm mt-2">Operating Hours: Mon-Sat, 8AM-6PM</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Pickup Date *</label>
              <Input
                type="date"
                value={formData.pickupDate}
                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className={errors.pickupDate ? 'border-red-500' : ''}
              />
              {errors.pickupDate && <p className="text-red-500 text-sm mt-1">{errors.pickupDate}</p>}
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
              <textarea
                value={formData.customerNote}
                onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
                placeholder="Let us know how you want your order treated, e.g., 'Please cut the fish into small pieces'"
                className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm transition-shadow"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={handleSubmit} className="flex-1 btn-modern">
            Continue to Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
