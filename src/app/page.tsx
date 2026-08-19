'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Package, ShoppingCart, TrendingUp, Shield, Wallet as WalletIcon, Star, Wallet, Heart } from "lucide-react";
import { ProductCard } from '@/components/products/ProductCard';
import { IProduct } from '@/types';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  // Redirect rider to their dashboard
  useEffect(() => {
    if (status === 'authenticated' && (session?.user?.role as string) === 'rider') {
      router.replace('/rider/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [featuredRes, newArrivalsRes] = await Promise.all([
        fetch('/api/products/featured?limit=4'),
        fetch('/api/products/new-arrivals?limit=4'),
      ]);

      const [featuredData, newArrivalsData] = await Promise.all([
        featuredRes.json(),
        newArrivalsRes.json(),
      ]);

      if (featuredData.success) {
        setFeaturedProducts(featuredData.products);
      }
      if (newArrivalsData.success) {
        setNewArrivals(newArrivalsData.products);
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: IProduct) => {
    if ((session?.user?.role as string) === 'rider') {
      return;
    }

    const primaryMarket = product.availableMarkets[0];
    const pricing = product.pricing[primaryMarket];
    const inventory = product.inventory[primaryMarket];
    const image = product.images?.find(img => img.isPrimary) || product.images?.[0];
    
    // Calculate max quantity based on inventory tracking
    const maxQuantity = inventory.trackInventory ? inventory.stock : pricing.maxQuantity || 999;

    addItem({
      productId: String(product._id),
      name: product.name,
      price: pricing.price,
      quantity: 1,
      marketType: primaryMarket,
      image: image?.url,
      maxQuantity: maxQuantity,
      inStock: !inventory.trackInventory || inventory.stock > 0,
    });

    toast.success(`${product.name} added to cart!`, {
      icon: '🛒',
    });
  };

  // If authenticated as rider, don't show customer homepage while redirecting
  if (status === 'authenticated' && (session?.user?.role as string) === 'rider') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="glass">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/web-app-manifest-512x512.png" 
                alt="Gpowerpay Logo" 
                width={64} 
                height={64} 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Gpowerpay
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Premium frozen foods delivered fresh to your doorstep
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="btn-modern">
                  <ShoppingCart className="mr-2" size={20} />
                  Start Shopping
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="btn-modern">
                  My Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="card-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Dual Market</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Buy per kilo or per carton - flexible options for all needs
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Digital Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Fund your wallet with Paystack and enjoy faster checkout
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Home Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Fast delivery to your doorstep or pickup at our store
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Quality Guaranteed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Premium frozen foods with verified customer reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Products */}
        {!loading && featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <Link href="/products">
                <Button variant="outline">
                  View All Products
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={String(product._id)}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* New Arrivals */}
        {!loading && newArrivals.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
              <Link href="/products?filter=new">
                <Button variant="outline">
                  View All New Products
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={String(product._id)}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8 opacity-90">
            Browse our complete catalog of premium frozen foods
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <ShoppingCart className="mr-2" size={20} />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
