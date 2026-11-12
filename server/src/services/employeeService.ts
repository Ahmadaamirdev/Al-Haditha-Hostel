import { Employee, IEmployee, Allotment } from '../models';
import { EmployeeCategory, AllotmentStatus } from '../constants';
import { AppError } from '../utils';

export class EmployeeService {
  public static async createEmployee(data: Partial<IEmployee>): Promise<IEmployee> {
    const existing = await Employee.findOne({ employeeId: data.employeeId?.toUpperCase() });
    if (existing) {
      throw new AppError(`Employee ID ${data.employeeId} already exists`, 409, 'CONFLICT');
    }

    const employee = await Employee.create({
      ...data,
      employeeId: data.employeeId?.toUpperCase(),
    });
    return employee;
  }

  public static async getEmployees(filters: {
    category?: EmployeeCategory;
    hasActiveAllotment?: boolean;
    search?: string;
  }): Promise<any[]> {
    const query: any = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { employeeId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 }).lean();

    // Attach active allotment status to each employee
    const activeAllotments = await Allotment.find({
      status: { $in: [AllotmentStatus.PENDING, AllotmentStatus.CHECKED_IN] },
    }).select('employeeId status allocationUnitId bootcampId');

    const activeMap = new Map<string, any>();
    activeAllotments.forEach((allotment) => {
      activeMap.set(allotment.employeeId.toString(), allotment);
    });

    const enriched = employees.map((emp) => {
      const activeAllotment = activeMap.get(emp._id.toString());
      return {
        ...emp,
        hasActiveAllotment: !!activeAllotment,
        activeAllotment: activeAllotment || null,
      };
    });

    if (filters.hasActiveAllotment !== undefined) {
      return enriched.filter((e) => e.hasActiveAllotment === filters.hasActiveAllotment);
    }

    return enriched;
  }

  public static async getEmployeeById(id: string): Promise<IEmployee> {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404, 'NOT_FOUND');
    }
    return employee;
  }
}

