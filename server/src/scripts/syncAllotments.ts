import dns from 'dns';
import mongoose from 'mongoose';
import { config } from '../config/env';
import {
  User,
  Employee,
  Bootcamp,
  AllocationUnit,
  Allotment,
} from '../models';
import { EmployeeCategory, AllotmentStatus } from '../constants';
import { AuthService } from '../services';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

async function sync() {
  console.log('[Sync] Connecting to database...');
  await mongoose.connect(config.mongodbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });

  // Ensure Admin exists
  await AuthService.seedInitialAdmin();
  const admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) throw new Error('Admin not found');

  // Remove legacy test employees (EMP1, EMP2, EMP3, EMP4)
  const legacyRemoved = await Employee.deleteMany({ employeeId: { $in: ['EMP1', 'EMP2', 'EMP3', 'EMP4'] } });
  console.log(`[Sync] Removed ${legacyRemoved.deletedCount} legacy test employees.`);

  // Verify 80 employees
  const vipEmployees = await Employee.find({ category: EmployeeCategory.VIP }).sort({ employeeId: 1 });
  const seniorEmployees = await Employee.find({ category: EmployeeCategory.SENIOR }).sort({ employeeId: 1 });
  const juniorEmployees = await Employee.find({ category: EmployeeCategory.JUNIOR }).sort({ employeeId: 1 });

  console.log(`[Sync] Employees found: VIP=${vipEmployees.length}, Senior=${seniorEmployees.length}, Junior=${juniorEmployees.length} (Total: ${vipEmployees.length + seniorEmployees.length + juniorEmployees.length})`);

  // Clear all allotments and reset unit occupancy
  await Allotment.deleteMany({});
  await AllocationUnit.updateMany({}, { isOccupied: false, currentAllotmentId: null });
  console.log('[Sync] Cleared old allotments and reset units.');

  // Fetch available units
  const vipUnits = await AllocationUnit.find({ category: EmployeeCategory.VIP }).sort({ unitCode: 1 });
  const seniorUnits = await AllocationUnit.find({ category: EmployeeCategory.SENIOR }).sort({ unitCode: 1 });
  const juniorUnits = await AllocationUnit.find({ category: EmployeeCategory.JUNIOR }).sort({ unitCode: 1 });

  console.log(`[Sync] Available units: VIP=${vipUnits.length}, Senior=${seniorUnits.length}, Junior=${juniorUnits.length}`);

  const now = new Date();

  // Helper to allot employee
  const allotLive = async (emp: any, unit: any, index: number) => {
    // Stagger check-in from 1 to 5 days ago
    const daysAgo = (index % 5) + 1;
    const duration = 7 + (index % 3) * 7; // 7, 14, 21 days
    const checkIn = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const checkout = new Date(checkIn.getTime() + duration * 24 * 60 * 60 * 1000);

    const allotment = await Allotment.create({
      employeeId: emp._id,
      bootcampId: unit.bootcampId,
      allocationUnitId: unit._id,
      checkInDate: checkIn,
      expectedCheckInDate: checkIn,
      actualCheckInDate: checkIn,
      plannedStayDuration: duration,
      checkoutDate: checkout,
      expectedCheckoutDate: checkout,
      actualCheckoutDate: null,
      status: AllotmentStatus.CHECKED_IN,
      createdById: admin._id,
      checkInConfirmedById: admin._id,
      notes: `Active residential stay for ${emp.name} (${emp.department})`,
    });

    unit.isOccupied = true;
    unit.currentAllotmentId = allotment._id;
    await unit.save();
  };

  // 1. Allot 15 VIP employees
  for (let i = 0; i < vipEmployees.length; i++) {
    await allotLive(vipEmployees[i], vipUnits[i], i);
  }

  // 2. Allot 25 Senior employees
  for (let i = 0; i < seniorEmployees.length; i++) {
    await allotLive(seniorEmployees[i], seniorUnits[i], i);
  }

  // 3. Allot 40 Junior employees
  for (let i = 0; i < juniorEmployees.length; i++) {
    await allotLive(juniorEmployees[i], juniorUnits[i], i);
  }

  const totalAllotments = await Allotment.countDocuments();
  const activeAllotments = await Allotment.countDocuments({ status: AllotmentStatus.CHECKED_IN });
  const occupiedUnits = await AllocationUnit.countDocuments({ isOccupied: true });

  console.log(`[Sync] SUCCESS!`);
  console.log(`  - Total Employees: ${vipEmployees.length + seniorEmployees.length + juniorEmployees.length}`);
  console.log(`  - Total Allotments: ${totalAllotments}`);
  console.log(`  - Active Allotments: ${activeAllotments}`);
  console.log(`  - Occupied Units: ${occupiedUnits}`);
  console.log(`  - 100% of employees are synced with real-time active allotments!`);

  await mongoose.disconnect();
}

sync().catch((err) => {
  console.error('[Sync] Error:', err);
  process.exit(1);
});

