import mongoose, { Document, Schema, Types } from 'mongoose';
import { EmployeeCategory, AllocationUnitType } from '../constants';

export interface IAllocationUnit extends Document {
  bootcampId: Types.ObjectId;
  unitCode: string;
  category: EmployeeCategory;
  unitType: AllocationUnitType;
  portionIdentifier?: string | null;
  bedIdentifier?: string | null;
  isOccupied: boolean;
  currentAllotmentId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const allocationUnitSchema = new Schema<IAllocationUnit>(
  {
    bootcampId: {
      type: Schema.Types.ObjectId,
      ref: 'Bootcamp',
      required: true,
      index: true,
    },
    unitCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(EmployeeCategory),
      index: true,
    },
    unitType: {
      type: String,
      required: true,
      enum: Object.values(AllocationUnitType),
    },
    portionIdentifier: {
      type: String,
      default: null,
      trim: true,
    },
    bedIdentifier: {
      type: String,
      default: null,
      trim: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentAllotmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Allotment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
allocationUnitSchema.index(
  { bootcampId: 1, portionIdentifier: 1, bedIdentifier: 1 },
  { unique: true }
);
allocationUnitSchema.index({ category: 1, isOccupied: 1 });

export const AllocationUnit = mongoose.model<IAllocationUnit>(
  'AllocationUnit',
  allocationUnitSchema
);
