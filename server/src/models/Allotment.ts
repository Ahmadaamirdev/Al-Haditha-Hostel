import mongoose, { Document, Schema, Types } from 'mongoose';
import { AllotmentStatus } from '../constants';

export interface IAllotment extends Document {
  employeeId: Types.ObjectId;
  bootcampId: Types.ObjectId;
  allocationUnitId: Types.ObjectId;
  checkInDate: Date;
  expectedCheckInDate?: Date;
  actualCheckInDate?: Date | null;
  plannedStayDuration: number;
  checkoutDate: Date;
  expectedCheckoutDate?: Date;
  actualCheckoutDate?: Date | null;
  status: AllotmentStatus;
  createdById: Types.ObjectId;
  checkInConfirmedById?: Types.ObjectId | null;
  checkOutConfirmedById?: Types.ObjectId | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const allotmentSchema = new Schema<IAllotment>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    bootcampId: {
      type: Schema.Types.ObjectId,
      ref: 'Bootcamp',
      required: true,
      index: true,
    },
    allocationUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'AllocationUnit',
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    // Keep backward-compatible expectedCheckInDate virtual/alias
    expectedCheckInDate: {
      type: Date,
    },
    actualCheckInDate: {
      type: Date,
    },
    plannedStayDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    checkoutDate: {
      type: Date,
      required: true,
    },
    // Keep backward-compatible expectedCheckoutDate virtual/alias
    expectedCheckoutDate: {
      type: Date,
    },
    actualCheckoutDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(AllotmentStatus),
      default: AllotmentStatus.CHECKED_IN,
      index: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkInConfirmedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    checkOutConfirmedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Partial Unique Filter Index: Single active allotment per employee
allotmentSchema.index(
  { employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] },
    },
  }
);

// Partial Unique Filter Index: Single active allotment per allocation unit (Double-booking lock)
allotmentSchema.index(
  { allocationUnitId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] },
    },
  }
);

// Notification Query Index
allotmentSchema.index({ status: 1, expectedCheckoutDate: 1 });
allotmentSchema.index({ status: 1, checkoutDate: 1 });
allotmentSchema.index({ employeeId: 1, status: 1 });

export const Allotment = mongoose.model<IAllotment>('Allotment', allotmentSchema);

