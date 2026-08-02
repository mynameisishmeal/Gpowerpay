'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, ThumbsDown, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from './StarRating';

/**
 * Review List Component - Display product reviews with filtering and sorting
 */

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
}

interface ReviewListProps {
  productId: string;
  refreshTrigger?: number;
}

export function ReviewList({ productId, refreshTrigger = 0 }: ReviewListProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>('recent');

  useEffect(() => {
    fetchReviews();
  }, [productId, page, sort, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviews?productId=${productId}&page=${page}&limit=10&sort=${sort}`
      );
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId: string, helpful: boolean) => {
    if (!session) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });

      const data = await response.json();

      if (data.success) {
        fetchReviews();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingPercentage = (count: number) => {
    if (!stats?.totalReviews) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="text-center md:text-left">
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {stats.averageRating.toFixed(1)}
                </p>
                <StarRating rating={stats.averageRating} readonly size={24} />
                <p className="text-sm text-gray-600 mt-2">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-12">{star} star</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{
                          width: `${getRatingPercentage(stats[`rating${star}`])}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {getRatingPercentage(stats[`rating${star}`])}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Reviews ({stats?.totalReviews || 0})
        </h3>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{review.customerName}</p>
                        {review.verified && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle size={12} />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} readonly />
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Was this helpful?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote(review._id, true)}
                    className="text-sm"
                  >
                    <ThumbsUp size={14} className="mr-1" />
                    Yes ({review.helpful})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote(review._id, false)}
                    className="text-sm"
                  >
                    <ThumbsDown size={14} className="mr-1" />
                    No ({review.notHelpful})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
