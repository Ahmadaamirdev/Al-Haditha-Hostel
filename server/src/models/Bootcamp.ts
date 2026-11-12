import mongoose, { Document, Schema } from 'mongoose';
import { EmployeeCategory } from '../constants';

export interface IBootcamp extends Document {
  bootcampCode: string;
  name: string;
  category: EmployeeCategory;
  locationBlock?: string;
  totalCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bootcampSchema = new Schema<IBootcamp>(
  {
    bootcampCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(EmployeeCategory),
      index: true,
    },
    locationBlock: {
      type: String,
      trim: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

bootcampSchema.index({ category: 1, isActive: 1 });

export const Bootcamp = mongoose.model<IBootcamp>('Bootcamp', bootcampSchema);

