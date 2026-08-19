'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Home, ShoppingCart, Package, Users, TrendingUp, Star, Eye, EyeOff } from "lucide-react";

export default function ShowcasePage() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Component Showcase</h1>
          <p className="text-xl text-gray-600">Explore all available UI components and styles</p>
        </div>

        {/* Buttons Section */}
        <Card className="card-shadow animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-2xl">Buttons</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 text-gray-700">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default" className="btn-modern">Default</Button>
                <Button variant="destructive" className="btn-modern">Destructive</Button>
                <Button variant="outline" className="btn-modern">Outline</Button>
                <Button variant="secondary" className="btn-modern">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-700">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" className="btn-modern">Small</Button>
                <Button size="default" className="btn-modern">Default</Button>
                <Button size="lg" className="btn-modern">Large</Button>
                <Button size="icon" className="btn-modern">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-gray-700">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <Button className="btn-modern">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <Button variant="outline" className="btn-modern">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="secondary" className="btn-modern">
                  <Package className="h-4 w-4" />
                  Inventory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Sales</CardTitle>
                <CardDescription>Total sales this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">$12,345</div>
                <p className="text-sm text-green-600 mt-2">+12.5% from last month</p>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Items in inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">456</div>
                <p className="text-sm text-gray-600 mt-2">8 low stock items</p>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Customers</CardTitle>
                <CardDescription>Active customer base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">1,234</div>
                <p className="text-sm text-blue-600 mt-2">+5 new this week</p>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Growth</CardTitle>
                <CardDescription>Year over year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">+23%</div>
                <p className="text-sm text-green-600 mt-2">On track for goals</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Elements Section */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">Form Elements</CardTitle>
            <CardDescription>Input fields and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Input
                </label>
                <Input placeholder="Enter text..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Input
                </label>
                <Input type="email" placeholder="email@example.com" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Input
                </label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number Input
                </label>
                <Input type="number" placeholder="0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dropdown
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Textarea
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={4}
                placeholder="Enter your message..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">Badges</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <span className="badge bg-blue-100 text-blue-800">Primary</span>
              <span className="badge bg-green-100 text-green-800">Success</span>
              <span className="badge bg-yellow-100 text-yellow-800">Warning</span>
              <span className="badge bg-red-100 text-red-800">Danger</span>
              <span className="badge bg-gray-100 text-gray-800">Neutral</span>
              <span className="badge bg-purple-100 text-purple-800">Info</span>
            </div>
          </CardContent>
        </Card>

        {/* Animations Section */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">Animations</CardTitle>
            <CardDescription>Built-in animation utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="animate-fade-in-up p-4 bg-blue-50 rounded-lg">
              <p className="font-medium">Fade In Up Animation</p>
              <p className="text-sm text-gray-600">Class: animate-fade-in-up</p>
            </div>
            
            <div className="animate-slide-in p-4 bg-green-50 rounded-lg">
              <p className="font-medium">Slide In Animation</p>
              <p className="text-sm text-gray-600">Class: animate-slide-in</p>
            </div>
          </CardContent>
        </Card>

        {/* Icons Section */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">Icons (Lucide React)</CardTitle>
            <CardDescription>Commonly used icons in different sizes and colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center gap-2">
                <Home className="h-8 w-8 text-blue-600" />
                <span className="text-sm">Home</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <span className="text-sm">Cart</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Package className="h-8 w-8 text-purple-600" />
                <span className="text-sm">Package</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Users className="h-8 w-8 text-orange-600" />
                <span className="text-sm">Users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glass Effect Section */}
        <div className="glass p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Glass Effect</h2>
          <p className="text-gray-600 mb-4">
            This section uses the glass effect with backdrop blur and semi-transparent background.
          </p>
          <p className="text-sm text-gray-500">Class: glass</p>
        </div>
      </div>
    </div>
  );
}
