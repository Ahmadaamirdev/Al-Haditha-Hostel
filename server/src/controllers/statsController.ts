import { Request, Response, NextFunction } from 'express';
import { Employee, Bootcamp, Allotment } from '../models';
import { AllotmentStatus } from '../constants';
import { sendSuccess } from '../utils';

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      employeeCategoryCounts,
      bootcampStats,
      activeStayCount,
    ] = await Promise.all([
      Employee.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Bootcamp.aggregate([
        {
          $lookup: {
            from: 'allocationunits',
            localField: '_id',
            foreignField: 'bootcampId',
            as: 'units',
            pipeline: [{ $project: { isOccupied: 1, category: 1 } }],
          },
        },
        {
          $group: {
            _id: '$category',
            totalCapacity: { $sum: '$totalCapacity' },
            bootcampCount: { $sum: 1 },
            occupiedCount: {
              $sum: {
                $size: {
                  $filter: { input: '$units', as: 'u', cond: { $eq: ['$$u.isOccupied', true] } },
                },
              },
            },
          },
        },
      ]),
      Allotment.countDocuments({ status: { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] } }),
    ]);

    const empMap: Record<string, number> = {};
    employeeCategoryCounts.forEach((e: any) => { empMap[e._id] = e.count; });

    const bcMap: Record<string, { capacity: number; occupied: number; count: number }> = {};
    bootcampStats.forEach((b: any) => {
      bcMap[b._id] = { capacity: b.totalCapacity, occupied: b.occupiedCount, count: b.bootcampCount };
    });

    const totalCapacity = Object.values(bcMap).reduce((s, v) => s + v.capacity, 0);
    const totalOccupied = Object.values(bcMap).reduce((s, v) => s + v.occupied, 0);

    sendSuccess(res, {
      employees: {
        total: Object.values(empMap).reduce((s, v) => s + v, 0),
        VIP: empMap['VIP'] || 0,
        SENIOR: empMap['SENIOR'] || 0,
        JUNIOR: empMap['JUNIOR'] || 0,
      },
      bootcamps: {
        total: Object.values(bcMap).reduce((s, v) => s + v.count, 0),
        totalCapacity,
        occupiedUnits: totalOccupied,
        availableUnits: totalCapacity - totalOccupied,
        byCategory: bcMap,
      },
      activeStays: activeStayCount,
    }, undefined, 200, 30);
  } catch (err) {
    next(err);
  }
};

