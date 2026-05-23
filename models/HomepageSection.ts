import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IHomepageSection extends Document {
  type: 'banner' | 'feature' | 'custom';
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  order: number;
  isActive: boolean;
  content?: string;
}

const HomepageSectionSchema = new Schema<IHomepageSection>({
  type: { type: String, enum: ['banner', 'feature', 'custom'], required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  image: { type: String },
  link: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  content: { type: String },
});

export default models.HomepageSection || model<IHomepageSection>('HomepageSection', HomepageSectionSchema);
