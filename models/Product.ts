import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  images: [{ type: String }], // array of image URLs or paths
  videos: [{ type: String }], // array of video URLs or paths (max 1 minute)
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);