'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useLoading } from '@/components/providers/LoadingProvider';

interface RiderReviewFormProps {
  orderId: string;
  riderId: string;
  riderName: string;
  onSuccess?: () => void;
}

export function RiderReviewForm({
  orderId,
  riderId,
  riderName,
  onSuccess,
}: RiderReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [punctuality, setPunctuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [communication, setCommunication] = useState(0);
  const { startLoading, stopLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    startLoading('Submitting review...');

    try {
      const response = await fetch(`/api/riders/${riderId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim() || undefined,
          punctuality: punctuality || undefined,
          professionalism: professionalism || undefined,
          communication: communication || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      stopLoading();
    }
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => {
    const [hover, setHover] = useState(0);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hover || value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Rate Your Delivery Experience</h3>
      <p className="text-gray-600 mb-6">
        How was your delivery experience with <strong>{riderName}</strong>?
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <StarRating
          value={rating}
          onChange={setRating}
          label="Overall Rating *"
        />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <StarRating
            value={punctuality}
            onChange={setPunctuality}
            label="Punctuality"
          />
          <StarRating
            value={professionalism}
            onChange={setProfessionalism}
            label="Professionalism"
          />
          <StarRating
            value={communication}
            onChange={setCommunication}
            label="Communication"
          />
        </div>

        {/* Comment */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Additional Comments (Optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your experience with this delivery..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={rating === 0}
            className="flex-1"
          >
            Submit Review
          </Button>
        </div>
      </form>
    </div>
  );
}
