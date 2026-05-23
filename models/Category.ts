import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export default models.Category || model<ICategory>('Category', CategorySchema);
