'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';
import { useLoading } from '@/components/providers/LoadingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';

/**
 * Review Form Component - Submit product reviews
 */

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, productName, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const { startLoading, stopLoading } = useLoading();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      setError('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!title.trim() || !comment.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      startLoading('Submitting your review...');

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      stopLoading();
    }
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">Please log in to write a review</p>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Write a Review</CardTitle>
        <p className="text-sm text-gray-600">for {productName}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={32}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <Input
              type="text"
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Tell others about your experience with this product"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={rating === 0}
            className="w-full btn-modern"
          >
            <Star size={20} className="mr-2" />
            Submit Review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
