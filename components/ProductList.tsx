'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';

interface BusinessSettings {
  bargainEnabled?: boolean;
  biddingEnabled?: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPercent: number;
  gstPercent?: number;
  quantity: number;
  images: string[];
  videos?: string[];
  bargainEnabled?: boolean;
  bargainOffers?: Array<{ _id?: string; price: number; status: string; createdAt: string | Date }>;
  biddingEnabled?: boolean;
  biddingStart?: string | Date;
  biddingEnd?: string | Date;
  bids?: Array<{ _id?: string; price: number; status: string; createdAt: string | Date }>;
  biddingWinner?: string;
}

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
  user?: { name?: string };
}

interface ProductListProps {
  initialSearchQuery?: string;
}

export default function ProductList({ initialSearchQuery = '' }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({});
  const [offerValue, setOfferValue] = useState<string>('');
  const [bidValue, setBidValue] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [offerLoading, setOfferLoading] = useState<boolean>(false);
  const [bidLoading, setBidLoading] = useState<boolean>(false);
  const [biddingCountdown, setBiddingCountdown] = useState<string>('');
  const [stockMessage, setStockMessage] = useState<string>('');
  const [lightbox, setLightbox] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewAverage, setReviewAverage] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [canWriteReview, setCanWriteReview] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string>('');
  const [reviewMessage, setReviewMessage] = useState<string>('');
  const [shareStatus, setShareStatus] = useState<string>('');
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const { data: session } = useSession();

  const fetchProducts = () => {
    fetch('/api/products')
      .then(async (res) => {
        const data = await res.json();
        if (!Array.isArray(data)) {
          console.error('Expected products array but got:', data);
          setProducts([]);
          return;
        }
        setProducts(data);
        if (data.length > 0) {
          const maxPriceValue = Math.max(...data.map((p: Product) => p.originalPrice));
          setMaxPrice(Math.ceil(maxPriceValue / 10000) * 10000);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      });
  };

  useEffect(() => {
    fetchProducts();

    const loadSettings = async () => {
      try {
        const res = await fetch('/api/business-settings');
        if (!res.ok) return;
        const data = await res.json();
        setBusinessSettings({
          bargainEnabled: data.bargainEnabled ?? false,
          biddingEnabled: data.biddingEnabled ?? false,
        });
      } catch (error) {
        console.error('Failed to load business settings', error);
      }
    };

    loadSettings();
  }, []);

  const handleShareProduct = async () => {
    if (!selectedProduct) return;
    const shareUrl = `${window.location.origin}/?product=${selectedProduct._id}`;
    const shareText = `Check out ${selectedProduct.name} on Refurbished PC Studio: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedProduct.name,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus('Share dialog opened.');
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('Share text copied to clipboard.');
      }
    } catch (error) {
      console.error('Share failed:', error);
      setShareStatus('Unable to share product. Copy link and try again.');
    }
  };

  const shareProductWhatsapp = () => {
    if (!selectedProduct) return;
    const shareUrl = `${window.location.origin}/?product=${selectedProduct._id}`;
    const text = `Hey! Check out ${selectedProduct.name} on Refurbished PC Studio: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareStatus('WhatsApp share opened.');
  };

  const shareProductEmail = () => {
    if (!selectedProduct) return;
    const shareUrl = `${window.location.origin}/?product=${selectedProduct._id}`;
    const subject = `Check out ${selectedProduct.name}`;
    const body = `I found this product on Refurbished PC Studio: ${selectedProduct.name}\n\n${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    setShareStatus('Email share opened.');
  };

  useEffect(() => {
    if (!selectedProduct || !selectedProduct.biddingEnabled) {
      setBiddingCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const start = selectedProduct.biddingStart ? new Date(selectedProduct.biddingStart) : null;
      const end = selectedProduct.biddingEnd ? new Date(selectedProduct.biddingEnd) : null;

      if (start && now < start) {
        const diff = start.getTime() - now.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setBiddingCountdown(`Starts in ${hours}h ${minutes}m ${seconds}s`);
        return;
      }

      if (end && now > end) {
        setBiddingCountdown('Auction ended');
        return;
      }

      if (end) {
        const diff = end.getTime() - now.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setBiddingCountdown(`Ends in ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setBiddingCountdown('Auction is live');
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [selectedProduct]);

  // Only load products once on mount to avoid extra network requests and improve perceived speed.
  // If real-time updates are required later, add a manual refresh button instead.

  const { addItem, items } = useCart();
  const router = useRouter();

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.trim().toLowerCase();
    if (query && !(
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    )) {
      return false;
    }

    if (availabilityFilter === 'instock' && product.quantity <= 0) return false;
    if (availabilityFilter === 'outofstock' && product.quantity > 0) return false;

    const minPrice = priceFilter.min ? parseFloat(priceFilter.min) : 0;
    const maxPriceFilter = priceFilter.max ? parseFloat(priceFilter.max) : maxPrice;
    const productPrice = product.originalPrice;
    if (productPrice < minPrice || productPrice > maxPriceFilter) return false;

    return true;
  });

  const finalPrice = (original: number, discount: number) => original * (1 - discount / 100);

  const openLightbox = (url: string, type: 'image' | 'video') => setLightbox({ url, type });
  const closeLightbox = () => setLightbox(null);

  const handleAddToCart = (product: Product, quantity = 1, redirectToCart = false) => {
    const existingQuantity = items?.find((item) => item.productId === product._id)?.quantity || 0;
    if (existingQuantity + quantity > product.quantity) {
      setStockMessage(`Cannot add more than ${product.quantity} of ${product.name} to cart.`);
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      price: finalPrice(product.originalPrice, product.discountPercent),
      gstPercent: product.gstPercent || 0,
      quantity,
    });
    setStockMessage('');
    if (redirectToCart) {
      router.push('/cart');
    }
  };

  const loadProductDetails = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data as Product;
    } catch (error) {
      console.error('Failed to load product details:', error);
      return null;
    }
  };

  const loadProductReviews = async (productId: string) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (!res.ok) {
        console.error('Failed to load reviews:', await res.text());
        setReviews([]);
        setCanWriteReview(false);
        setHasReviewed(false);
        setReviewAverage(0);
        setReviewCount(0);
        return;
      }

      const data = await res.json();
      setReviews(data.reviews || []);
      setReviewAverage(data.averageRating || 0);
      setReviewCount(data.totalReviews || 0);
      setCanWriteReview(data.canReview || false);
      setHasReviewed(data.hasReviewed || false);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
      setCanWriteReview(false);
      setHasReviewed(false);
      setReviewAverage(0);
      setReviewCount(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  const openProductModal = async (product: Product) => {
    setCurrentImageIndex(0);
    setOfferMessage('');
    setBidMessage('');
    setReviewMessage('');
    setReviewError('');
    setReviewComment('');
    setShowReviewForm(false);
    const detail = await loadProductDetails(product._id);
    setSelectedProduct(detail || product);
    await loadProductReviews(product._id);
  };

  const handleSendOffer = async () => {
    if (!selectedProduct) return;
    const price = Number(offerValue);
    if (!price || price <= 0) {
      setOfferMessage('Enter a valid offer price.');
      return;
    }
    setOfferLoading(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct._id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOfferMessage(data.error || 'Unable to submit offer');
      } else {
        setOfferMessage('Offer submitted successfully. Admin can review it.');
        setOfferValue('');
        const refresh = await loadProductDetails(selectedProduct._id);
        if (refresh) setSelectedProduct(refresh);
      }
    } catch (error) {
      console.error(error);
      setOfferMessage('Unable to submit offer. Try again later.');
    }
    setOfferLoading(false);
  };

  const submitReview = async () => {
    if (!selectedProduct) return;
    setReviewError('');
    setReviewMessage('');

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setReviewError('Please write a review comment with at least 10 characters.');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Failed to submit review.');
        return;
      }

      setReviewMessage('Review submitted successfully.');
      setReviewComment('');
      setShowReviewForm(false);
      await loadProductReviews(selectedProduct._id);
    } catch (error) {
      console.error('Failed to submit review:', error);
      setReviewError('Failed to submit review. Please try again.');
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedProduct) return;
    const price = Number(bidValue);
    if (!price || price <= 0) {
      setBidMessage('Enter a higher bid amount.');
      return;
    }
    setBidLoading(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct._id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBidMessage(data.error || 'Unable to place bid');
      } else {
        setBidMessage('Bid placed successfully.');
        setBidValue('');
        const refresh = await loadProductDetails(selectedProduct._id);
        if (refresh) setSelectedProduct(refresh);
      }
    } catch (error) {
      console.error(error);
      setBidMessage('Unable to place bid. Try again later.');
    }
    setBidLoading(false);
  };

  const getHighestBid = (product: Product) => {
    return product.bids?.reduce((max, item) => Math.max(max, item.price || 0), 0) || 0;
  };

  const getHighestOffer = (product: Product) => {
    return product.bargainOffers?.reduce((max, item) => Math.max(max, item.price || 0), 0) || 0;
  };

  const showBargain = selectedProduct && selectedProduct.bargainEnabled && businessSettings.bargainEnabled;
  const showBidding = selectedProduct && selectedProduct.biddingEnabled && businessSettings.biddingEnabled;

  return (
    <>
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-theme-primary">{selectedProduct.name}</h2>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setCurrentImageIndex(0);
                }}
                className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Images Gallery */}
              <div>
                {selectedProduct.images.length > 0 && (
                  <>
                    <div className="relative w-full h-48 md:h-64 bg-gray-100 rounded-lg overflow-hidden mb-3 cursor-pointer" onClick={() => openLightbox(selectedProduct.images[currentImageIndex], 'image')}>
                      <img
                        src={selectedProduct.images[currentImageIndex]}
                        alt={`${selectedProduct.name}-${currentImageIndex}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 text-white rounded text-sm">Full screen</div>
                    </div>
                    {selectedProduct.images.length > 1 && (
                      <div className="flex gap-2">
                        {selectedProduct.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-12 h-12 rounded border-2 overflow-hidden ${
                              idx === currentImageIndex ? 'border-blue-600' : 'border-gray-300'
                            }`}
                          >
                            <img src={img} alt={`thumb-${idx}`} width={48} height={48} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => openLightbox(selectedProduct.images[currentImageIndex], 'image')}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
                    >
                      View Image Fullscreen
                    </button>
                  </>
                )}

                {/* Video */}
                {selectedProduct.videos && selectedProduct.videos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">🎥 Product Video:</p>
                    <video
                      src={selectedProduct.videos[0]}
                      controls
                      preload="metadata"
                      crossOrigin="anonymous"
                      className="w-full h-auto rounded-lg bg-black"
                      style={{ maxHeight: '400px' }}
                    >
                      <track kind="captions" srcLang="en" label="English" />
                      Your browser does not support the video tag with audio.
                    </video>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectedProduct.videos?.[0] && openLightbox(selectedProduct.videos[0], 'video')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
                      >
                        View Video Fullscreen
                      </button>
                      <a
                        href={selectedProduct.videos?.[0] || '#'}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Download Video
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <div className="mb-2">
                  <p className="text-lg font-bold text-red-600">
                    ₹{(finalPrice(selectedProduct.originalPrice, selectedProduct.discountPercent) * (1 + (selectedProduct.gstPercent || 0) / 100)).toFixed(2)}
                    {selectedProduct.discountPercent > 0 && (
                      <span className="text-sm text-gray-600 ml-2 line-through">₹{selectedProduct.originalPrice}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">(incl. {selectedProduct.gstPercent || 0}% GST)</p>
                </div>
                {selectedProduct.discountPercent > 0 && (
                  <p className="text-green-600 font-semibold mb-3">{selectedProduct.discountPercent}% off 🎉</p>
                )}

                <div className="bg-theme-surface p-4 rounded-lg mb-4 border border-theme">
                  <p className="text-theme-primary font-semibold mb-2">📝 Description:</p>
                  <p className="text-theme-body">{selectedProduct.description}</p>
                </div>

                <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">⭐ Customer ratings</p>
                      <p className="text-3xl font-bold text-gray-900">{reviewAverage.toFixed(1)} / 5</p>
                      <p className="text-sm text-gray-500">{reviewCount} review{reviewCount === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {session?.user && canWriteReview && !hasReviewed ? (
                        <button
                          onClick={() => setShowReviewForm((prev) => !prev)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          {showReviewForm ? 'Cancel Review' : 'Write Review'}
                        </button>
                      ) : null}
                      {session?.user && hasReviewed ? (
                        <span className="text-sm font-semibold text-green-700">You have already reviewed this product.</span>
                      ) : null}
                      {!session?.user ? (
                        <span className="text-sm text-gray-600">Login to review after delivery.</span>
                      ) : null}
                    </div>
                  </div>

                  {showReviewForm && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-4">
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${reviewRating === star ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                            >
                              {star} ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your review</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                          placeholder="Share your experience with this product."
                        />
                      </div>
                      {reviewError && <p className="text-sm text-red-600 mb-3">{reviewError}</p>}
                      {reviewMessage && <p className="text-sm text-green-700 mb-3">{reviewMessage}</p>}
                      <button
                        onClick={submitReview}
                        className="rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Submit review
                      </button>
                    </div>
                  )}

                  {loadingReviews ? (
                    <p className="text-sm text-gray-500">Loading reviews…</p>
                  ) : reviews.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {reviews.map((review) => (
                        <div key={review._id} className="rounded-2xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                            <span>Rating: {review.rating} / 5</span>
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-3 text-gray-800">{review.comment}</p>
                          {review.reply && (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 border border-slate-200">
                              <p className="font-semibold text-slate-900">Admin reply</p>
                              <p className="mt-2 whitespace-pre-line">{review.reply}</p>
                            </div>
                          )}
                          <p className="mt-3 text-sm text-gray-500">By {review.user?.name || 'Customer'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">No reviews yet for this product.</p>
                  )}
                </div>
                {selectedProduct.bargainEnabled && !businessSettings.bargainEnabled && (
                  <div className="bg-yellow-100 p-4 rounded-lg mb-4 border border-yellow-200 text-yellow-900">
                    Bargain offers are enabled for this product, but site-wide bargaining is currently disabled by the admin. Please try again later.
                  </div>
                )}
                {selectedProduct.biddingEnabled && !businessSettings.biddingEnabled && (
                  <div className="bg-blue-100 p-4 rounded-lg mb-4 border border-blue-200 text-blue-900">
                    Auction bidding is enabled for this product, but site-wide bidding is currently disabled by the admin. Please check back once the feature is turned on.
                  </div>
                )}

                {showBargain && (
                  <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                    <p className="text-yellow-800 font-semibold mb-2">💬 Bargain Offer</p>
                    <p className="text-sm text-gray-700 mb-3">Enter the price you want to offer. Admin can accept or reject your offer.</p>
                    <div className="flex gap-3 items-end flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm text-gray-800 mb-1">Your Offer</label>
                        <input
                          value={offerValue}
                          onChange={(e) => setOfferValue(e.target.value)}
                          type="number"
                          min="1"
                          placeholder="₹ Enter offer"
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <button
                        onClick={handleSendOffer}
                        disabled={offerLoading}
                        className="bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 font-semibold disabled:opacity-50"
                      >
                        {offerLoading ? 'Sending...' : 'Send Offer'}
                      </button>
                    </div>
                    {offerMessage && <p className="mt-3 text-sm text-gray-700">{offerMessage}</p>}
                    {selectedProduct.bargainOffers && selectedProduct.bargainOffers.length > 0 && (
                      <p className="mt-3 text-sm text-gray-700">Highest offer: ₹{getHighestOffer(selectedProduct)}</p>
                    )}
                  </div>
                )}

                {showBidding && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <p className="text-blue-800 font-semibold mb-2">🏁 Auction / Bidding</p>
                    <p className="text-sm text-gray-700 mb-2">Current highest bid: ₹{getHighestBid(selectedProduct)}</p>
                    {biddingCountdown && <p className="text-sm text-gray-700 mb-3">{biddingCountdown}</p>}
                    <div className="flex gap-3 items-end flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-sm text-gray-800 mb-1">Your Bid</label>
                        <input
                          value={bidValue}
                          onChange={(e) => setBidValue(e.target.value)}
                          type="number"
                          min="1"
                          placeholder="₹ Enter bid"
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={handlePlaceBid}
                        disabled={bidLoading}
                        className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                      >
                        {bidLoading ? 'Placing Bid...' : 'Place Bid'}
                      </button>
                    </div>
                    {bidMessage && <p className="mt-3 text-sm text-gray-700">{bidMessage}</p>}
                    {selectedProduct.bids && selectedProduct.bids.length > 0 && (
                      <p className="mt-3 text-sm text-gray-700">Total bids: {selectedProduct.bids.length}</p>
                    )}
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
                  <p className="text-sm font-semibold text-slate-900 mb-2">🔗 Share this product</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleShareProduct}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                    >
                      Share Product
                    </button>
                    <button
                      type="button"
                      onClick={shareProductWhatsapp}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Share via WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={shareProductEmail}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900"
                    >
                      Share via Email
                    </button>
                  </div>
                  {shareStatus && <p className="mt-3 text-sm text-green-700">{shareStatus}</p>}
                </div>

                {selectedProduct.quantity <= 0 ? (
                  <p className="text-theme-secondary font-bold text-lg mb-4">❌ Out of Stock</p>
                ) : (
                  <>
                    <p className="text-green-600 font-bold text-lg mb-4">✅ {selectedProduct.quantity} in Stock</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (!selectedProduct) return;
                          handleAddToCart(selectedProduct, 1, false);
                          setSelectedProduct(null);
                        }}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        🛒 Add to Cart
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedProduct) return;
                          handleAddToCart(selectedProduct, 1, true);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
                      >
                        💳 Buy Now
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {stockMessage && (
        <div className="mx-auto mb-4 max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          {stockMessage}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-full overflow-hidden rounded-3xl border border-white/20 bg-slate-950 shadow-2xl">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/90 text-slate-900 p-3 shadow-lg hover:bg-white"
            >
              ✕
            </button>
            {lightbox.type === 'image' ? (
              <img src={lightbox.url} alt="Preview" className="w-full h-full object-contain bg-black" />
            ) : (
              <video src={lightbox.url} controls className="w-full h-full bg-black" />
            )}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <a
                href={lightbox.url}
                download
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700"
              >
                Download {lightbox.type === 'image' ? 'Image' : 'Video'}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Product Grid */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Filter Products</h2>
            <p className="text-sm text-gray-600">Use filters to find the best deals quickly on mobile or desktop.</p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setAvailabilityFilter('all');
              setPriceFilter({ min: '', max: '' });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            🔄 Reset filters
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Availability Filter */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">📦 Availability:</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="all"
                  checked={availabilityFilter === 'all'}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-theme-body font-medium">All Products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="instock"
                  checked={availabilityFilter === 'instock'}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-theme-primary font-medium">✅ In Stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="outofstock"
                  checked={availabilityFilter === 'outofstock'}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-gray-800 font-medium">❌ Out of Stock</span>
              </label>
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">🔎 Search Products:</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">💰 Price Range:</label>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceFilter.min}
                  onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <span className="text-gray-600 font-bold">-</span>
              <div className="flex-1 min-w-[120px]">
                <input
                  type="number"
                  placeholder={`Max (₹${maxPrice})`}
                  value={priceFilter.max}
                  onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mt-4">
          📊 Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> of <span className="font-bold text-gray-900">{products.length}</span> products
        </p>
      </div>

      {/* Products Grid */}
      <section id="products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-2xl font-bold text-gray-600 mb-2">😢 No Products Found</p>
            <p className="text-gray-500">Try adjusting your filters to see more products</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl" onClick={() => openProductModal(product)}>
              <div className="absolute right-4 top-4 flex flex-wrap gap-2">
                {product.discountPercent > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">-{product.discountPercent}%</span>
                )}
                {product.quantity <= 0 ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Out of Stock</span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">In stock</span>
                )}
              </div>
              {product.images.length > 0 && (
                <img src={product.images[0]} alt={product.name} width={300} height={200} className="w-full h-48 object-cover rounded-3xl mb-4" />
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-700 mb-3 text-sm leading-relaxed line-clamp-2">{product.description}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-red-600">₹{(finalPrice(product.originalPrice, product.discountPercent) * (1 + (product.gstPercent || 0) / 100)).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">(incl. {product.gstPercent || 0}% GST)</p>
                  {product.discountPercent > 0 && (
                    <p className="text-sm text-gray-500 line-through">₹{product.originalPrice}</p>
                  )}
                </div>
                {product.videos && product.videos.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Video ready</span>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product, 1, false);
                  }}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  aria-label={`Add ${product.name} to cart`}
                >
                  Add to Cart
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product, 1, true);
                  }}
                  className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  aria-label={`Buy ${product.name} now`}
                >
                  Buy Now
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                {product.bargainEnabled && businessSettings.bargainEnabled && <span className="rounded-full bg-yellow-50 px-2 py-1">Bargain</span>}
                {product.biddingEnabled && businessSettings.biddingEnabled && <span className="rounded-full bg-blue-50 px-2 py-1">Auction</span>}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}