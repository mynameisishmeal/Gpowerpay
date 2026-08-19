'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, MapPin, Loader2, Plus, Edit, Trash2, Home, Eye, EyeOff } from 'lucide-react';

// Profile validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Address validation schema
const addressSchema = z.object({
  label: z.string().min(1, 'Label is required (e.g., Home, Work)'),
  fullAddress: z.string().min(5, 'Address must be at least 5 characters'),
  street: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address {
  _id: string;
  label: string;
  fullAddress: string;
  street?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [authProvider, setAuthProvider] = useState('email');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Address form
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddressForm,
    setValue: setAddressValue,
    formState: { errors: addressErrors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [status, router]);

  // Fetch user profile
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      fetchAddresses();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setProfileValue('name', data.user.name);
        setProfileValue('phone', data.user.phone || '');
        setAuthProvider(data.user.authProvider || 'email');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses');
      const data = await response.json();

      if (data.success) {
        setAddresses(data.addresses);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const requestEmailChangeOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingEmail(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await fetch('/api/user/change-email/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, currentPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request code');
      }

      setProfileSuccess(result.message);
      setOtpStep(true);
      setTimeout(() => setProfileSuccess(''), 5000);
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingEmail(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, otp: otpCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change email');
      }

      setProfileSuccess(result.message);
      setShowEmailForm(false);
      setOtpStep(false);
      setNewEmail('');
      setCurrentPassword('');
      setOtpCode('');
      setTimeout(() => setProfileSuccess(''), 5000);
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setIsChangingEmail(false);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onSubmitAddress = async (data: AddressFormData) => {
    setAddressError('');
    setAddressSuccess('');

    try {
      const url = editingAddressId
        ? `/api/user/addresses/${editingAddressId}`
        : '/api/user/addresses';
      
      const method = editingAddressId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, country: data.country || 'Nigeria' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save address');
      }

      setAddresses(result.addresses);
      setAddressSuccess(editingAddressId ? 'Address updated!' : 'Address added!');
      setShowAddressForm(false);
      setEditingAddressId(null);
      resetAddressForm();
      setTimeout(() => setAddressSuccess(''), 3000);
    } catch (err: any) {
      setAddressError(err.message);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address._id);
    setAddressValue('label', address.label);
    setAddressValue('fullAddress', address.fullAddress);
    setAddressValue('street', address.street || '');
    setAddressValue('city', address.city);
    setAddressValue('state', address.state);
    setAddressValue('postalCode', address.postalCode || '');
    setAddressValue('country', address.country);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete address');
      }

      setAddresses(result.addresses);
      setAddressSuccess('Address deleted successfully!');
      setTimeout(() => setAddressSuccess(''), 3000);
    } catch (err: any) {
      setAddressError(err.message);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set default address');
      }

      setAddresses(result.addresses);
    } catch (err: any) {
      setAddressError(err.message);
    }
  };

  if (status === 'loading' || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Section */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{profileError}</p>
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{profileSuccess}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    {...registerProfile('name')}
                    className="h-11"
                    disabled={isSavingProfile}
                  />
                  {profileErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(!showEmailForm)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {showEmailForm ? 'Cancel' : 'Change Email'}
                    </button>
                  </div>
                  <Input
                    value={session?.user?.email || ''}
                    className="h-11 bg-gray-100"
                    disabled
                  />
                  { (session?.user as any)?.pendingEmail && (
                    <p className="mt-1 text-xs text-yellow-600">Pending verification: {(session?.user as any)?.pendingEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    {...registerProfile('phone')}
                    className="h-11"
                    placeholder="08012345678"
                    disabled={isSavingProfile}
                  />
                  {profileErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="btn-modern"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>

            {showEmailForm && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">Change Email Address</h4>
                
                {!otpStep ? (
                  <form onSubmit={requestEmailChangeOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Email
                      </label>
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        placeholder="Enter new email address"
                        disabled={isChangingEmail}
                        className="bg-white"
                      />
                    </div>
                    
                    {authProvider === 'email' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Verify your password"
                            disabled={isChangingEmail}
                            className="bg-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            disabled={isChangingEmail}
                          >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      className="btn-modern w-full"
                      disabled={isChangingEmail || !newEmail || (authProvider === 'email' && !currentPassword)}
                    >
                      {isChangingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        'Request Email Change'
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm mb-4">
                      We've sent a 6-digit security code to your current email address. Please enter it below to authorize this change.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Code (OTP)
                      </label>
                      <Input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        maxLength={6}
                        placeholder="123456"
                        disabled={isChangingEmail}
                        className="bg-white text-center tracking-[0.5em] font-mono text-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="btn-modern flex-1"
                        disabled={isChangingEmail || !otpCode || otpCode.length < 6}
                      >
                        {isChangingEmail ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Update Email'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOtpStep(false)}
                        disabled={isChangingEmail}
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses Section */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 text-blue-600 mr-2" />
                  <CardTitle>Delivery Addresses</CardTitle>
                </div>
                <CardDescription>
                  Manage your delivery addresses
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingAddressId(null);
                  resetAddressForm();
                  setShowAddressForm(!showAddressForm);
                }}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {addressError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{addressError}</p>
              </div>
            )}
            {addressSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{addressSuccess}</p>
              </div>
            )}

            {/* Address Form */}
            {showAddressForm && (
              <form onSubmit={handleSubmitAddress(onSubmitAddress)} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label (e.g., Home, Work)
                    </label>
                    <Input {...registerAddress('label')} className="h-11" />
                    {addressErrors.label && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.label.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street
                    </label>
                    <Input {...registerAddress('street')} className="h-11" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Address
                    </label>
                    <Input {...registerAddress('fullAddress')} className="h-11" />
                    {addressErrors.fullAddress && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.fullAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <Input {...registerAddress('city')} className="h-11" />
                    {addressErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <Input {...registerAddress('state')} className="h-11" />
                    {addressErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <Input {...registerAddress('postalCode')} className="h-11" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <Input {...registerAddress('country')} defaultValue="Nigeria" className="h-11" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="btn-modern">
                    {editingAddressId ? 'Update Address' : 'Add Address'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                      resetAddressForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Address List */}
            {isLoadingAddresses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No delivery addresses yet</p>
                <p className="text-sm">Add your first address to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`p-4 border rounded-lg ${
                      address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Home className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{address.label}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{address.fullAddress}</p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!address.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultAddress(address._id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAddress(address)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAddress(address._id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
