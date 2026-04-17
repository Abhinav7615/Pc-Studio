'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  reply?: string;
  replyAt?: string;
  replyBy?: { name?: string; email?: string };
  createdAt: string;
  user?: { name?: string; email?: string };
  product?: { _id?: string; name?: string };
}

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [replyValues, setReplyValues] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

  const filteredReviews = useMemo(() => {
    const term = productFilter.trim().toLowerCase();
    if (!term) return reviews;
    return reviews.filter((review) => {
      const productName = review.product?.name?.toLowerCase() || '';
      const productId = review.product?._id?.toLowerCase() || '';
      return productName.includes(term) || productId.includes(term);
    });
  }, [productFilter, reviews]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      router.push('/admin/login');
      return;
    }

    const loadReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/reviews?admin=true');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load reviews');
          setReviews([]);
        } else {
          setReviews(data.reviews || []);
        }
      } catch (fetchError) {
        console.error('Failed to load reviews:', fetchError);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [session, status, router]);

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review? This action cannot be undone.')) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete review');
      } else {
        setMessage('Review deleted successfully.');
        setReviews(reviews.filter((review) => review._id !== reviewId));
      }
    } catch (fetchError) {
      console.error('Delete review failed:', fetchError);
      setError('Failed to delete review');
    }
  };

  const saveReply = async (reviewId: string) => {
    const currentReview = reviews.find((item) => item._id === reviewId);
    const reply = replyValues.hasOwnProperty(reviewId)
      ? replyValues[reviewId]
      : currentReview?.reply || '';
    setMessage('');
    setError('');
    setReplyErrors((prev) => ({ ...prev, [reviewId]: '' }));
    setReplyLoading((prev) => ({ ...prev, [reviewId]: true }));

    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyErrors((prev) => ({ ...prev, [reviewId]: data.error || 'Failed to save reply' }));
      } else {
        setMessage('Reply saved successfully.');
        const updatedReview = data.review;
        setReviews((prev) => prev.map((review) => (review._id === reviewId ? updatedReview : review)));
      }
    } catch (fetchError) {
      console.error('Reply save failed:', fetchError);
      setReplyErrors((prev) => ({ ...prev, [reviewId]: 'Failed to save reply' }));
    } finally {
      setReplyLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const updateReplyValue = (reviewId: string, value: string) => {
    setReplyValues((prev) => ({ ...prev, [reviewId]: value }));
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading reviews...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">📝 Product Reviews</h1>
          <p className="text-gray-600 mt-2">View and manage customer reviews. Filter by product name or product ID.</p>
        </div>

        {message && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">{message}</div>}
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">{error}</div>}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">Total reviews:</p>
            <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
          </div>
          <div className="w-full md:w-96">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by product</label>
            <input
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              placeholder="Product name or ID"
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-700">No reviews match your filter.</div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review._id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-md font-semibold text-gray-900">{review.product?.name || 'Unknown product'}</p>
                    <p className="text-sm text-gray-500">Product ID: {review.product?._id || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Submitted by</p>
                    <p className="font-semibold text-gray-900">{review.user?.name || review.user?.email || 'Anonymous'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">Rating: {review.rating} / 5</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">{new Date(review.createdAt).toLocaleString()}</span>
                </div>

                <p className="mt-4 text-gray-700 whitespace-pre-line">{review.comment}</p>

                {review.reply && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">Admin reply</p>
                    <p className="mt-2 text-slate-700 whitespace-pre-line">{review.reply}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Replied by {review.replyBy?.name || 'Admin'} on {review.replyAt ? new Date(review.replyAt).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin reply</label>
                  <textarea
                    value={replyValues[review._id] ?? review.reply ?? ''}
                    onChange={(e) => updateReplyValue(review._id, e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-indigo-500 focus:outline-none"
                    placeholder="Write or update the admin reply for this review."
                  />
                  {replyErrors[review._id] && <p className="text-sm text-red-600 mt-2">{replyErrors[review._id]}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => saveReply(review._id)}
                      disabled={replyLoading[review._id]}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {replyLoading[review._id] ? 'Saving...' : 'Save reply'}
                    </button>
                    <button
                      onClick={() => updateReplyValue(review._id, review.reply || '')}
                      type="button"
                      className="inline-flex items-center rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-right">
                  <button
                    onClick={() => deleteReview(review._id)}
                    className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Delete review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
