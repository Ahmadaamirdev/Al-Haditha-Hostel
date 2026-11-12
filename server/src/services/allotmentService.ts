import mongoose, { Types } from 'mongoose';
import { Allotment, AllocationUnit, Employee, Bootcamp, IAllotment } from '../models';
import { AllotmentStatus } from '../constants';
import { AppError, addDays } from '../utils';

export class AllotmentService {
  /**
   * Atomic allotment creation with concurrency locking
   */
  public static async createAllotment(data: {
    employeeId: string;
    allocationUnitId: string;
    expectedCheckInDate: string;
    plannedStayDuration: number;
    createdById: string;
    notes?: string;
  }): Promise<IAllotment> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Verify Employee exists & does not have an active allotment
      const employee = await Employee.findById(data.employeeId).session(session);
      if (!employee) {
        throw new AppError('Employee not found', 404, 'NOT_FOUND');
      }

      const activeAllotment = await Allotment.findOne({
        employeeId: employee._id,
        status: { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] },
      }).session(session);

      if (activeAllotment) {
        throw new AppError(
          `Employee ${employee.name} (${employee.employeeId}) already has an active allotment.`,
          409,
          'CONFLICT'
        );
      }

      // 2. Atomic test-and-set reservation on AllocationUnit
      const unit = await AllocationUnit.findOneAndUpdate(
        {
          _id: new Types.ObjectId(data.allocationUnitId),
          isOccupied: false,
        },
        {
          $set: { isOccupied: true },
        },
        {
          session,
          new: true,
        }
      );

      if (!unit) {
        throw new AppError(
          'Selected unit is no longer available or was concurrently reserved by another administrator.',
          409,
          'CONFLICT'
        );
      }

      // Invariant check: Unit category must match Employee category
      if (unit.category !== employee.category) {
        throw new AppError(
          `Category mismatch: Employee is ${employee.category} but unit is ${unit.category}`,
          400,
          'VALIDATION_ERROR'
        );
      }

      // Calculate initial expected checkout from expected check-in
      const expectedCheckIn = new Date(data.expectedCheckInDate);
      const expectedCheckout = addDays(expectedCheckIn, data.plannedStayDuration);

      // 3. Create Allotment record
      const [allotment] = await Allotment.create(
        [
          {
            employeeId: employee._id,
            bootcampId: unit.bootcampId,
            allocationUnitId: unit._id,
            expectedCheckInDate: expectedCheckIn,
            plannedStayDuration: data.plannedStayDuration,
            expectedCheckoutDate: expectedCheckout,
            status: AllotmentStatus.PENDING,
            createdById: new Types.ObjectId(data.createdById),
            notes: data.notes,
          },
        ],
        { session }
      );

      // Link current allotment back to unit
      unit.currentAllotmentId = allotment._id as Types.ObjectId;
      await unit.save({ session });

      await session.commitTransaction();
      return allotment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Manual Check-in Confirmation
   * Enforces the approved rule:
   * Expected Checkout = actualCheckInDate + plannedStayDuration
   */
  public static async confirmCheckIn(
    allotmentId: string,
    actualCheckInDateStr: string,
    adminUserId: string
  ): Promise<IAllotment> {
    const allotment = await Allotment.findById(allotmentId);
    if (!allotment) {
      throw new AppError('Allotment not found', 404, 'NOT_FOUND');
    }

    if (allotment.status !== AllotmentStatus.PENDING) {
      throw new AppError(
        `Cannot confirm check-in for allotment in status: ${allotment.status}`,
        400,
        'INVALID_STATE'
      );
    }

    const actualCheckIn = new Date(actualCheckInDateStr);
    const newExpectedCheckout = addDays(actualCheckIn, allotment.plannedStayDuration);

    allotment.actualCheckInDate = actualCheckIn;
    allotment.expectedCheckoutDate = newExpectedCheckout;
    allotment.status = AllotmentStatus.CHECKED_IN;
    allotment.checkInConfirmedById = new Types.ObjectId(adminUserId);

    await allotment.save();
    return allotment;
  }

  /**
   * Manual Checkout Confirmation
   * Releases the allocation unit atomically and marks allotment as COMPLETED
   */
  public static async confirmCheckOut(
    allotmentId: string,
    actualCheckoutDateStr: string,
    adminUserId: string
  ): Promise<IAllotment> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const allotment = await Allotment.findById(allotmentId).session(session);
      if (!allotment) {
        throw new AppError('Allotment not found', 404, 'NOT_FOUND');
      }

      if (allotment.status !== AllotmentStatus.CHECKED_IN) {
        throw new AppError(
          `Cannot checkout allotment in status: ${allotment.status}. Must be CHECKED_IN.`,
          400,
          'INVALID_STATE'
        );
      }

      allotment.actualCheckoutDate = new Date(actualCheckoutDateStr);
      allotment.status = AllotmentStatus.COMPLETED;
      allotment.checkOutConfirmedById = new Types.ObjectId(adminUserId);
      await allotment.save({ session });

      // Atomically release the unit
      await AllocationUnit.findByIdAndUpdate(
        allotment.allocationUnitId,
        {
          $set: {
            isOccupied: false,
            currentAllotmentId: null,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return allotment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Adjust stay duration and recalculate expected checkout
   */
  public static async updateDuration(
    allotmentId: string,
    newDuration: number
  ): Promise<IAllotment> {
    const allotment = await Allotment.findById(allotmentId);
    if (!allotment) {
      throw new AppError('Allotment not found', 404, 'NOT_FOUND');
    }

    if (allotment.status !== AllotmentStatus.PENDING && allotment.status !== AllotmentStatus.CHECKED_IN) {
      throw new AppError('Cannot modify duration for non-active allotment', 400, 'INVALID_STATE');
    }

    allotment.plannedStayDuration = newDuration;

    // If checked in, recalculate from actualCheckInDate; otherwise from expectedCheckInDate
    const baseDate = allotment.actualCheckInDate || allotment.expectedCheckInDate;
    allotment.expectedCheckoutDate = addDays(baseDate, newDuration);

    await allotment.save();
    return allotment;
  }

  /**
   * Fetch active allotments ONLY (PENDING and CHECKED_IN)
   */
  public static async getActiveAllotments(filters: {
    status?: AllotmentStatus;
    search?: string;
  }): Promise<any[]> {
    const query: any = {
      status: filters.status
        ? filters.status
        : { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] },
    };

    const allotments = await Allotment.find(query)
      .populate('employeeId', 'employeeId name category contactNumber department')
      .populate('bootcampId', 'bootcampCode name category')
      .populate('allocationUnitId', 'unitCode unitType portionIdentifier bedIdentifier')
      .populate('createdById', 'fullName username')
      .sort({ expectedCheckoutDate: 1 })
      .lean();

    if (filters.search) {
      const s = filters.search.toLowerCase();
      return allotments.filter((item: any) => {
        const empName = item.employeeId?.name?.toLowerCase() || '';
        const empId = item.employeeId?.employeeId?.toLowerCase() || '';
        const bcCode = item.bootcampId?.bootcampCode?.toLowerCase() || '';
        const uCode = item.allocationUnitId?.unitCode?.toLowerCase() || '';
        return (
          empName.includes(s) ||
          empId.includes(s) ||
          bcCode.includes(s) ||
          uCode.includes(s)
        );
      });
    }

    return allotments;
  }
}
