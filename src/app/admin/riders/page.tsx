'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Phone, Edit2, Trash2, User, Bike, Package, Upload, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Rider {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  partnerType: 'bulk' | 'small';
  riderType?: 'bulk' | 'small'; // For backward compatibility with API response
  isActive: boolean;
  status?: 'active' | 'inactive'; // For backward compatibility
  image?: string;
  createdAt: string;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    riderType: 'small' as 'bulk' | 'small',
    status: 'active' as 'active' | 'inactive',
    image: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const response = await fetch('/api/riders');
      const data = await response.json();
      
      // Map the API response to match our interface
      const mappedRiders = (data.riders || []).map((rider: any) => ({
        _id: rider._id,
        name: rider.name,
        phone: rider.phone,
        partnerType: rider.partnerType || rider.riderType,
        riderType: rider.partnerType || rider.riderType, // For filtering
        isActive: rider.isActive ?? (rider.status === 'active'),
        status: rider.isActive ? 'active' : 'inactive', // For display
        image: rider.image,
        createdAt: rider.createdAt,
      }));
      
      setRiders(mappedRiders);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingRider
        ? `/api/riders/${editingRider._id}`
        : '/api/riders';
      const method = editingRider ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save rider');
      }

      toast.success(
        editingRider ? 'Rider updated successfully' : 'Rider added successfully'
      );
      setShowModal(false);
      resetForm();
      fetchRiders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (riderId: string) => {
    if (!confirm('Are you sure you want to delete this rider?')) return;

    try {
      const response = await fetch(`/api/riders/${riderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete rider');
      }

      toast.success('Rider deleted successfully');
      fetchRiders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditModal = (rider: Rider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      email: rider.email || '',
      phone: rider.phone,
      password: '', // Don't populate password when editing
      riderType: rider.partnerType || rider.riderType || 'small',
      status: rider.isActive ? 'active' : (rider.status || 'active'),
      image: rider.image || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRider(null);
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      riderType: 'small',
      status: 'active',
      image: '',
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ ...formData, image: data.url });
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const bulkRiders = riders.filter((r) => (r.partnerType || r.riderType) === 'bulk');
  const smallRiders = riders.filter((r) => (r.partnerType || r.riderType) === 'small');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riders Management</h1>
          <p className="text-gray-600 mt-1">
            Manage delivery riders - {riders.length} total
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Add Rider
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading riders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bulk Riders */}
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Package size={24} />
                Bulk Delivery Riders ({bulkRiders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {bulkRiders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No bulk riders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {bulkRiders.map((rider) => (
                    <RiderCard
                      key={rider._id}
                      rider={rider}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Small Quantity Riders */}
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Bike size={24} />
                Small Quantity Riders ({smallRiders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {smallRiders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No small quantity riders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {smallRiders.map((rider) => (
                    <RiderCard
                      key={rider._id}
                      rider={rider}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingRider ? 'Edit Rider' : 'Add New Rider'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rider name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="rider@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingRider ? '(Leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingRider}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min. 6 characters"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rider Type *
                </label>
                <select
                  required
                  value={formData.riderType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      riderType: e.target.value as 'bulk' | 'small',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small Quantity Rider</option>
                  <option value="bulk">Bulk Delivery Rider</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rider Image (Optional)
                </label>
                
                {/* Image Preview */}
                {formData.image && (
                  <div className="mb-3 relative">
                    <img
                      src={formData.image}
                      alt="Rider preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors bg-gray-50">
                    <div className="flex flex-col items-center gap-2">
                      {uploadingImage ? (
                        <>
                          <Loader2 size={32} className="animate-spin text-blue-600" />
                          <p className="text-sm text-gray-600">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload size={32} className="text-gray-400" />
                          <p className="text-sm text-gray-900 font-medium">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, WebP</p>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                  {editingRider ? 'Update Rider' : 'Add Rider'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RiderCard({
  rider,
  onEdit,
  onDelete,
}: {
  rider: Rider;
  onEdit: (rider: Rider) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {rider.image ? (
          <Image
            src={rider.image}
            alt={rider.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={24} className="text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{rider.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <Phone size={14} />
                <span>{rider.phone}</span>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                (rider.isActive ?? (rider.status === 'active'))
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {(rider.isActive ?? (rider.status === 'active')) ? 'active' : 'inactive'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(rider)}
              className="flex items-center gap-1"
            >
              <Edit2 size={14} />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(rider._id)}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
