import mongoose from 'mongoose';
import { Bootcamp, AllocationUnit, IBootcamp, IAllocationUnit } from '../models';
import { EmployeeCategory, AllocationUnitType } from '../constants';
import { AppError } from '../utils';

async function supportsTransactions(): Promise<boolean> {
  return true; // Atlas replica set always supports transactions
}

function buildUnitPayloads(code: string, category: EmployeeCategory): { payload: any[]; totalCapacity: number } {
  const unitPayloads: any[] = [];
  let totalCapacity = 1;

  if (category === EmployeeCategory.VIP) {
    totalCapacity = 1;
    unitPayloads.push({
      unitCode: code,
      category: EmployeeCategory.VIP,
      unitType: AllocationUnitType.WHOLE,
      portionIdentifier: null,
      bedIdentifier: null,
      isOccupied: false,
    });
  } else if (category === EmployeeCategory.SENIOR) {
    totalCapacity = 2;
    ['Portion A', 'Portion B'].forEach((portion) => {
      const pCode = portion === 'Portion A' ? 'PA' : 'PB';
      unitPayloads.push({
        unitCode: `${code}-${pCode}`,
        category: EmployeeCategory.SENIOR,
        unitType: AllocationUnitType.PORTION,
        portionIdentifier: portion,
        bedIdentifier: null,
        isOccupied: false,
      });
    });
  } else if (category === EmployeeCategory.JUNIOR) {
    totalCapacity = 6;
    ['Portion A', 'Portion B'].forEach((portion) => {
      const pCode = portion === 'Portion A' ? 'PA' : 'PB';
      ['Bed 1', 'Bed 2', 'Bed 3'].forEach((bed) => {
        const bCode = bed.replace(' ', '');
        unitPayloads.push({
          unitCode: `${code}-${pCode}-${bCode}`,
          category: EmployeeCategory.JUNIOR,
          unitType: AllocationUnitType.BED,
          portionIdentifier: portion,
          bedIdentifier: bed,
          isOccupied: false,
        });
      });
    });
  }

  return { payload: unitPayloads, totalCapacity };
}

export class BootcampService {
  public static async createBootcamp(data: {
    bootcampCode: string;
    name: string;
    category: EmployeeCategory;
    locationBlock?: string;
  }): Promise<{ bootcamp: IBootcamp; units: IAllocationUnit[] }> {
    const code = data.bootcampCode.toUpperCase().trim();

    const existing = await Bootcamp.findOne({ bootcampCode: code });
    if (existing) {
      throw new AppError(`Bootcamp code ${code} already exists`, 409, 'CONFLICT');
    }

    const { payload: unitPayloads, totalCapacity } = buildUnitPayloads(code, data.category);
    const useTransactions = await supportsTransactions();

    if (useTransactions) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const [bootcamp] = await Bootcamp.create(
          [{ bootcampCode: code, name: data.name, category: data.category, locationBlock: data.locationBlock, totalCapacity, isActive: true }],
          { session }
        );
        const mappedUnits = unitPayloads.map((u) => ({ ...u, bootcampId: bootcamp._id }));
        const units = await AllocationUnit.insertMany(mappedUnits, { session });
        await session.commitTransaction();
        return { bootcamp, units: units as unknown as IAllocationUnit[] };
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      const bootcamp = await Bootcamp.create({
        bootcampCode: code,
        name: data.name,
        category: data.category,
        locationBlock: data.locationBlock,
        totalCapacity,
        isActive: true,
      });
      const mappedUnits = unitPayloads.map((u) => ({ ...u, bootcampId: bootcamp._id }));
      const units = await AllocationUnit.insertMany(mappedUnits);
      return { bootcamp, units: units as unknown as IAllocationUnit[] };
    }
  }

  public static async getBootcamps(filters: {
    category?: EmployeeCategory;
    isActive?: boolean;
  }): Promise<any[]> {
    const query: any = {};
    if (filters.category) query.category = filters.category;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const bootcamps = await Bootcamp.find(query).sort({ bootcampCode: 1 }).lean();

    const bootcampIds = bootcamps.map((b) => b._id);
    const units = await AllocationUnit.find({ bootcampId: { $in: bootcampIds } })
      .select('bootcampId unitCode category unitType portionIdentifier bedIdentifier isOccupied')
      .lean();

    const unitsByBootcamp = new Map<string, any[]>();
    units.forEach((u) => {
      const bId = u.bootcampId.toString();
      if (!unitsByBootcamp.has(bId)) unitsByBootcamp.set(bId, []);
      unitsByBootcamp.get(bId)!.push(u);
    });

    return bootcamps.map((b) => {
      const bUnits = unitsByBootcamp.get(b._id.toString()) || [];
      const occupiedCount = bUnits.filter((u) => u.isOccupied).length;
      return {
        ...b,
        units: bUnits,
        totalCapacity: b.totalCapacity,
        occupiedCount,
        availableCount: b.totalCapacity - occupiedCount,
      };
    });
  }

  public static async getAvailableUnits(
    category: EmployeeCategory,
    bootcampId?: string
  ): Promise<any[]> {
    const query: any = { category, isOccupied: false };
    if (bootcampId) query.bootcampId = bootcampId;

    return AllocationUnit.find(query)
      .populate('bootcampId', 'bootcampCode name locationBlock category')
      .sort({ unitCode: 1 })
      .lean();
  }

  public static async suggestUnitForEmployee(category: EmployeeCategory): Promise<any> {
    const [unit, totalAvailableInCategory] = await Promise.all([
      AllocationUnit.findOne({ category, isOccupied: false })
        .populate('bootcampId', 'bootcampCode name')
        .lean(),
      AllocationUnit.countDocuments({ category, isOccupied: false }),
    ]);

    if (!unit) {
      throw new AppError(`No available units found for category ${category}`, 404, 'NOT_FOUND');
    }

    return {
      suggestedUnit: unit,
      totalAvailableInCategory,
      reason: `System suggested optimal available slot in ${(unit.bootcampId as any)?.name || 'Bootcamp'}`,
    };
  }
}
