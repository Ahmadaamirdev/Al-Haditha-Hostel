import mongoose, { Types } from 'mongoose';
import { Allotment, AllocationUnit, Employee, IAllotment } from '../models';
import { AllotmentStatus } from '../constants';
import { AppError, addDays } from '../utils';

/**
 * Helper: determine if the connected MongoDB supports transactions
 * (requires a replica set - Atlas always does; local standalone does not)
 */
async function supportsTransactions(): Promise<boolean> {
  try {
    const admin = mongoose.connection.db?.admin();
    if (!admin) return false;
    const { replicaSet } = await admin.serverStatus() as any;
    return !!replicaSet;
  } catch {
    return false;
  }
}

export class AllotmentService {
  /**
   * Atomic allotment creation with concurrency locking.
   * Uses MongoDB transactions when available (Atlas / replica set).
   * Falls back to application-level guards for local standalone dev.
   */
  public static async createAllotment(data: {
    employeeId: string;
    allocationUnitId: string;
    checkInDate?: string;
    expectedCheckInDate?: string;
    plannedStayDuration: number;
    createdById: string;
    notes?: string;
  }): Promise<IAllotment> {
    const useTransactions = await supportsTransactions();

    if (useTransactions) {
      return AllotmentService._createWithTransaction(data);
    }
    return AllotmentService._createWithoutTransaction(data);
  }

  private static async _createWithTransaction(data: {
    employeeId: string;
    allocationUnitId: string;
    checkInDate?: string;
    expectedCheckInDate?: string;
    plannedStayDuration: number;
    createdById: string;
    notes?: string;
  }): Promise<IAllotment> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const employee = await Employee.findById(data.employeeId).session(session);
      if (!employee) throw new AppError('Employee not found', 404, 'NOT_FOUND');

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

      const unit = await AllocationUnit.findOneAndUpdate(
        { _id: new Types.ObjectId(data.allocationUnitId), isOccupied: false },
        { $set: { isOccupied: true } },
        { session, new: true }
      );

      if (!unit) {
        throw new AppError(
          'Selected unit is no longer available or was concurrently reserved by another administrator.',
          409,
          'CONFLICT'
        );
      }

      if (unit.category !== employee.category) {
        throw new AppError(
          `Category mismatch: Employee is ${employee.category} but unit is ${unit.category}`,
          400,
          'VALIDATION_ERROR'
        );
      }

      const checkIn = new Date(data.checkInDate || data.expectedCheckInDate || new Date().toISOString());
      const checkout = addDays(checkIn, data.plannedStayDuration);

      const [allotment] = await Allotment.create(
        [{
          employeeId: employee._id,
          bootcampId: unit.bootcampId,
          allocationUnitId: unit._id,
          checkInDate: checkIn,
          expectedCheckInDate: checkIn,
          actualCheckInDate: checkIn,
          plannedStayDuration: data.plannedStayDuration,
          checkoutDate: checkout,
          expectedCheckoutDate: checkout,
          status: AllotmentStatus.CHECKED_IN,
          createdById: new Types.ObjectId(data.createdById),
          notes: data.notes,
        }],
        { session }
      );

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

  private static async _createWithoutTransaction(data: {
    employeeId: string;
    allocationUnitId: string;
    checkInDate?: string;
    expectedCheckInDate?: string;
    plannedStayDuration: number;
    createdById: string;
    notes?: string;
  }): Promise<IAllotment> {
    const employee = await Employee.findById(data.employeeId);
    if (!employee) throw new AppError('Employee not found', 404, 'NOT_FOUND');

    const activeAllotment = await Allotment.findOne({
      employeeId: employee._id,
      status: { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] },
    });

    if (activeAllotment) {
      throw new AppError(
        `Employee ${employee.name} (${employee.employeeId}) already has an active allotment.`,
        409,
        'CONFLICT'
      );
    }

    // Atomic test-and-set on unit (single-document atomic operation works without replica set)
    const unit = await AllocationUnit.findOneAndUpdate(
      { _id: new Types.ObjectId(data.allocationUnitId), isOccupied: false },
      { $set: { isOccupied: true } },
      { new: true }
    );

    if (!unit) {
      throw new AppError(
        'Selected unit is no longer available or was concurrently reserved.',
        409,
        'CONFLICT'
      );
    }

    if (unit.category !== employee.category) {
      // Roll back the unit lock since we won't be creating the allotment
      await AllocationUnit.findByIdAndUpdate(unit._id, { $set: { isOccupied: false } });
      throw new AppError(
        `Category mismatch: Employee is ${employee.category} but unit is ${unit.category}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    const checkIn = new Date(data.checkInDate || data.expectedCheckInDate || new Date().toISOString());
    const checkout = addDays(checkIn, data.plannedStayDuration);

    let allotment: IAllotment;
    try {
      allotment = await Allotment.create({
        employeeId: employee._id,
        bootcampId: unit.bootcampId,
        allocationUnitId: unit._id,
        checkInDate: checkIn,
        expectedCheckInDate: checkIn,
        actualCheckInDate: checkIn,
        plannedStayDuration: data.plannedStayDuration,
        checkoutDate: checkout,
        expectedCheckoutDate: checkout,
        status: AllotmentStatus.CHECKED_IN,
        createdById: new Types.ObjectId(data.createdById),
        notes: data.notes,
      });
    } catch (err) {
      // Roll back unit lock on allotment creation failure
      await AllocationUnit.findByIdAndUpdate(unit._id, { $set: { isOccupied: false } });
      throw err;
    }

    unit.currentAllotmentId = allotment._id as Types.ObjectId;
    await unit.save();

    return allotment;
  }

  /**
   * Manual Check-in Confirmation.
   * Recalculates expectedCheckoutDate from actualCheckInDate (approved business rule).
   */
  public static async confirmCheckIn(
    allotmentId: string,
    actualCheckInDateStr: string,
    adminUserId: string
  ): Promise<IAllotment> {
    const allotment = await Allotment.findById(allotmentId);
    if (!allotment) throw new AppError('Allotment not found', 404, 'NOT_FOUND');

    if (allotment.status !== AllotmentStatus.PENDING) {
      throw new AppError(
        `Cannot confirm check-in for allotment in status: ${allotment.status}`,
        400,
        'INVALID_STATE'
      );
    }

    const actualCheckIn = new Date(actualCheckInDateStr);
    const newCheckout = addDays(actualCheckIn, allotment.plannedStayDuration);

    allotment.checkInDate = actualCheckIn;
    allotment.actualCheckInDate = actualCheckIn;
    allotment.checkoutDate = newCheckout;
    allotment.expectedCheckoutDate = newCheckout;
    allotment.status = AllotmentStatus.CHECKED_IN;
    allotment.checkInConfirmedById = new Types.ObjectId(adminUserId);

    await allotment.save();
    return allotment;
  }

  /**
   * Manual Checkout Confirmation.
   * Atomically releases the allocation unit and marks allotment as COMPLETED.
   */
  public static async confirmCheckOut(
    allotmentId: string,
    actualCheckoutDateStr: string,
    adminUserId: string
  ): Promise<IAllotment> {
    const allotment = await Allotment.findById(allotmentId);
    if (!allotment) throw new AppError('Allotment not found', 404, 'NOT_FOUND');

    if (allotment.status !== AllotmentStatus.CHECKED_IN) {
      throw new AppError(
        `Cannot checkout allotment in status: ${allotment.status}. Must be CHECKED_IN.`,
        400,
        'INVALID_STATE'
      );
    }

    const useTransactions = await supportsTransactions();

    if (useTransactions) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        allotment.actualCheckoutDate = new Date(actualCheckoutDateStr);
        allotment.status = AllotmentStatus.COMPLETED;
        allotment.checkOutConfirmedById = new Types.ObjectId(adminUserId);
        await allotment.save({ session });

        await AllocationUnit.findByIdAndUpdate(
          allotment.allocationUnitId,
          { $set: { isOccupied: false, currentAllotmentId: null } },
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
    } else {
      allotment.actualCheckoutDate = new Date(actualCheckoutDateStr);
      allotment.status = AllotmentStatus.COMPLETED;
      allotment.checkOutConfirmedById = new Types.ObjectId(adminUserId);
      await allotment.save();

      await AllocationUnit.findByIdAndUpdate(
        allotment.allocationUnitId,
        { $set: { isOccupied: false, currentAllotmentId: null } }
      );

      return allotment;
    }
  }

  /**
   * Adjust stay duration and recalculate expected checkout.
   * Uses actualCheckInDate as base if checked in (approved business rule).
   */
  public static async updateDuration(
    allotmentId: string,
    newDuration: number
  ): Promise<IAllotment> {
    const allotment = await Allotment.findById(allotmentId);
    if (!allotment) throw new AppError('Allotment not found', 404, 'NOT_FOUND');

    if (
      allotment.status !== AllotmentStatus.PENDING &&
      allotment.status !== AllotmentStatus.CHECKED_IN
    ) {
      throw new AppError('Cannot modify duration for non-active allotment', 400, 'INVALID_STATE');
    }

    allotment.plannedStayDuration = newDuration;
    const baseDate = allotment.checkInDate || allotment.actualCheckInDate || allotment.expectedCheckInDate;
    const newCheckout = addDays(baseDate, newDuration);
    allotment.checkoutDate = newCheckout;
    allotment.expectedCheckoutDate = newCheckout;

    await allotment.save();
    return allotment;
  }

  /**
   * Fetch active allotments ONLY (PENDING and CHECKED_IN).
   * Completed allotments are preserved in DB but never returned here.
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
        return empName.includes(s) || empId.includes(s) || bcCode.includes(s) || uCode.includes(s);
      });
    }

    return allotments;
  }
}
