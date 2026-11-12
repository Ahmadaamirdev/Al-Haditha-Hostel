import mongoose, { Document, Schema } from 'mongoose';
import { EmployeeCategory } from '../constants';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  category: EmployeeCategory;
  department?: string;
  contactNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
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
    department: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
