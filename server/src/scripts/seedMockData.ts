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
import { EmployeeCategory, AllocationUnitType, AllotmentStatus } from '../constants';
import { AuthService, BootcampService } from '../services';

// Ensure DNS works on Windows/local
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const VIP_NAMES = [
  'Sheikh Mansoor Al-Ketbi',
  'Dr. Tariq Al-Hadhrami',
  'Eng. Khalid Al-Busaidi',
  'Fatima Al-Zahra Al-Balushi',
  'Hassan Al-Mamari',
  'Nasser Al-Rawahi',
  'Dr. Salim Al-Aufi',
  'Eng. Majid Al-Kharusi',
  'Sultan Al-Shabibi',
  'Zayed Al-Hinai',
  'Dr. Rashid Al-Habsi',
  'Omar Al-Farsi',
  'Eng. Abdullah Al-Jabri',
  'Mariam Al-Amri',
  'Saif Al-Wahaibi',
];

const SENIOR_NAMES = [
  'Ahmed Al-Maskari',
  'Bader Al-Riyami',
  'Hamood Al-Harthy',
  'Issa Al-Siyabi',
  'Juma Al-Ghafri',
  'Khalil Al-Kindi',
  'Mahmood Al-Barwani',
  'Qais Al-Zakwani',
  'Saeed Al-Maawali',
  'Talal Al-Hosni',
  'Waleed Al-Kiyumi',
  'Yousuf Al-Bahlani',
  'Zuhair Al-Hajri',
  'Adnan Al-Naabi',
  'Basim Al-Rashdi',
  'Faisal Al-Muqbali',
  'Haitham Al-Shamsi',
  'Ibrahim Al-Bahrani',
  'Jamal Al-Abri',
  'Kamal Al-Nuaimi',
  'Luqman Al-Saadi',
  'Munir Al-Darai',
  'Nabil Al-Kathiri',
  'Rami Al-Mahrouqi',
  'Sami Al-Fazari',
];

const JUNIOR_NAMES = [
  'Ali Al-Ajmi',
  'Bilal Al-Balushi',
  'Dawood Al-Dhahab',
  'Eisa Al-Fahdi',
  'Fahad Al-Ghassani',
  'Ghazi Al-Hadabi',
  'Harith Al-Ismaili',
  'Ilyas Al-Jahwari',
  'Jalil Al-Khabouri',
  'Khalfan Al-Lamki',
  'Marwan Al-Mazroui',
  'Nawaf Al-Nadabi',
  'Osama Al-Qasmi',
  'Pervaiz Al-Raisi',
  'Qasim Al-Salehi',
  'Riyadh Al-Sabahi',
  'Suhail Al-Tobi',
  'Taimur Al-Uraimi',
  'Ubaid Al-Washahi',
  'Yahya Al-Yahmadi',
  'Zubair Al-Zadjali',
  'Amur Al-Batashi',
  'Baqir Al-Lawati',
  'Chaker Al-Gheilani',
  'Dhiyab Al-Marhoobi',
  'Farhan Al-Khusaibi',
  'Ghanim Al-Hikmani',
  'Hilal Al-Amimi',
  'Iqbal Al-Shehhi',
  'Jabir Al-Shukaili',
  'Khamis Al-Harrasi',
  'Lutfi Al-Mujaini',
  'Mudathir Al-Kiyumi',
  'Nidhal Al-Ghaithi',
  'Othman Al-Subhi',
  'Qatada Al-Harthi',
  'Rakan Al-Buraiki',
  'Siraj Al-Sinani',
  'Taha Al-Hashmi',
  'Wajdi Al-Shehi',
];

const VIP_DEPTS = [
  'Executive Management',
  'Senior Exploration Advisory',
  'Strategic Projects Office',
  'Government Affairs',
  'Technical Steering Committee',
];

const SENIOR_DEPTS = [
  'Petroleum Engineering',
  'Drilling Operations',
  'Health & Safety (HSE)',
  'Subsurface Geoscience',
  'Facility Maintenance',
  'Pipeline Infrastructure',
  'Logistics Management',
];

const JUNIOR_DEPTS = [
  'Field Operations',
  'Rig Support Services',
  'Electrical Maintenance',
  'Instrumentation & Control',
  'Mechanical Support',
  'Well Testing',
  'Camp Services & Safety',
  'Transport & Dispatch',
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(config.mongodbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('[Seed] Connected.');

  // Ensure Admin User exists
  await AuthService.seedInitialAdmin();
  const admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) {
    throw new Error('Admin user could not be found or created');
  }
  console.log(`[Seed] Using Admin ID: ${admin._id} (${admin.username})`);

  // Ensure sufficient Bootcamps for VIP (15 units needed)
  console.log('[Seed] Ensuring Bootcamps...');
  for (let i = 1; i <= 15; i++) {
    const code = `BC-VIP-${String(i).padStart(2, '0')}`;
    const exists = await Bootcamp.findOne({ bootcampCode: code });
    if (!exists) {
      await BootcampService.createBootcamp({
        bootcampCode: code,
        name: `VIP Executive Villa ${i}`,
        category: EmployeeCategory.VIP,
        locationBlock: `Block V${Math.ceil(i / 5)}`,
      });
      console.log(`  + Created VIP Bootcamp ${code}`);
    }
  }

  // Ensure sufficient Bootcamps for Senior (25 portions needed -> 13 bootcamps = 26 portions)
  for (let i = 1; i <= 14; i++) {
    const code = `BC-SR-${String(i).padStart(2, '0')}`;
    const exists = await Bootcamp.findOne({ bootcampCode: code });
    if (!exists) {
      await BootcampService.createBootcamp({
        bootcampCode: code,
        name: `Senior Residence Block ${String.fromCharCode(64 + i)}`,
        category: EmployeeCategory.SENIOR,
        locationBlock: `Block S${Math.ceil(i / 5)}`,
      });
      console.log(`  + Created Senior Bootcamp ${code}`);
    }
  }

  // Ensure sufficient Bootcamps for Junior (40 beds needed -> 8 bootcamps = 48 beds)
  for (let i = 1; i <= 8; i++) {
    const code = `BC-JR-${String(i).padStart(2, '0')}`;
    const exists = await Bootcamp.findOne({ bootcampCode: code });
    if (!exists) {
      await BootcampService.createBootcamp({
        bootcampCode: code,
        name: `Junior Accommodation Facility ${i}`,
        category: EmployeeCategory.JUNIOR,
        locationBlock: `Block J${Math.ceil(i / 4)}`,
      });
      console.log(`  + Created Junior Bootcamp ${code}`);
    }
  }

  console.log('[Seed] Creating / Updating 80 Mock Employees...');
  const allEmployees: any[] = [];

  // 1. VIP Employees (15)
  for (let i = 0; i < VIP_NAMES.length; i++) {
    const empId = `EMP-VIP-${String(i + 1).padStart(3, '0')}`;
    const name = VIP_NAMES[i];
    const dept = VIP_DEPTS[i % VIP_DEPTS.length];
    const emp = await Employee.findOneAndUpdate(
      { employeeId: empId },
      {
        employeeId: empId,
        name,
        category: EmployeeCategory.VIP,
        department: dept,
        contactNumber: `+968 912${String(1000 + i).padStart(4, '0')}`,
      },
      { upsert: true, new: true }
    );
    allEmployees.push(emp);
  }

  // 2. Senior Employees (25)
  for (let i = 0; i < SENIOR_NAMES.length; i++) {
    const empId = `EMP-SR-${String(i + 1).padStart(3, '0')}`;
    const name = SENIOR_NAMES[i];
    const dept = SENIOR_DEPTS[i % SENIOR_DEPTS.length];
    const emp = await Employee.findOneAndUpdate(
      { employeeId: empId },
      {
        employeeId: empId,
        name,
        category: EmployeeCategory.SENIOR,
        department: dept,
        contactNumber: `+968 923${String(2000 + i).padStart(4, '0')}`,
      },
      { upsert: true, new: true }
    );
    allEmployees.push(emp);
  }

  // 3. Junior Employees (40)
  for (let i = 0; i < JUNIOR_NAMES.length; i++) {
    const empId = `EMP-JR-${String(i + 1).padStart(3, '0')}`;
    const name = JUNIOR_NAMES[i];
    const dept = JUNIOR_DEPTS[i % JUNIOR_DEPTS.length];
    const emp = await Employee.findOneAndUpdate(
      { employeeId: empId },
      {
        employeeId: empId,
        name,
        category: EmployeeCategory.JUNIOR,
        department: dept,
        contactNumber: `+968 934${String(3000 + i).padStart(4, '0')}`,
      },
      { upsert: true, new: true }
    );
    allEmployees.push(emp);
  }

  console.log(`[Seed] Total employees registered: ${allEmployees.length} (15 VIP, 25 Senior, 40 Junior).`);

  // Clear existing allotments for clean state or keep?
  // Let's reset all allotments to make the 80 allotments clean, cohesive, and perfectly mapped
  console.log('[Seed] Refreshing Allotments and Unit occupancy...');
  await Allotment.deleteMany({});
  await AllocationUnit.updateMany({}, { isOccupied: false, currentAllotmentId: null });

  // Get available units sorted by category and unitCode
  const vipUnits = await AllocationUnit.find({ category: EmployeeCategory.VIP }).sort({ unitCode: 1 });
  const seniorUnits = await AllocationUnit.find({ category: EmployeeCategory.SENIOR }).sort({ unitCode: 1 });
  const juniorUnits = await AllocationUnit.find({ category: EmployeeCategory.JUNIOR }).sort({ unitCode: 1 });

  console.log(`[Seed] Available Units: VIP=${vipUnits.length}, Senior=${seniorUnits.length}, Junior=${juniorUnits.length}`);

  let activeCount = 0;
  let completedCount = 0;

  // Function to allot an employee
  const allotEmployee = async (emp: any, unit: any, isHistorical: boolean, index: number) => {
    const now = new Date();
    let checkIn: Date;
    let checkout: Date;
    let actualCheckout: Date | null = null;
    let status: AllotmentStatus;
    const duration = 7 + (index % 4) * 7; // 7, 14, 21, or 28 days

    if (isHistorical) {
      // Checked in 30-50 days ago, checked out 10-25 days ago
      const daysAgo = 30 + (index % 20);
      checkIn = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      actualCheckout = new Date(checkIn.getTime() + duration * 24 * 60 * 60 * 1000);
      checkout = actualCheckout;
      status = AllotmentStatus.COMPLETED;
      completedCount++;
    } else {
      // Active stay: checked in 1 to 6 days ago, checkout in future
      const daysAgo = (index % 6) + 1;
      checkIn = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      checkout = new Date(checkIn.getTime() + duration * 24 * 60 * 60 * 1000);
      status = AllotmentStatus.CHECKED_IN;
      activeCount++;
    }

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
      actualCheckoutDate: actualCheckout,
      status,
      createdById: admin._id,
      checkInConfirmedById: admin._id,
      checkOutConfirmedById: isHistorical ? admin._id : null,
      notes: isHistorical
        ? `Completed routine assignment in ${emp.department}`
        : `Active deployment for ongoing field operations in ${emp.department}`,
    });

    if (!isHistorical) {
      unit.isOccupied = true;
      unit.currentAllotmentId = allotment._id;
      await unit.save();
    }
  };

  // 1. Allot 15 VIPs (10 Active, 5 Completed)
  for (let i = 0; i < 15; i++) {
    const emp = allEmployees.find((e) => e.employeeId === `EMP-VIP-${String(i + 1).padStart(3, '0')}`);
    const unit = vipUnits[i % vipUnits.length];
    const isHistorical = i >= 10; // 5 historical
    await allotEmployee(emp, unit, isHistorical, i);
  }

  // 2. Allot 25 Seniors (18 Active, 7 Completed)
  for (let i = 0; i < 25; i++) {
    const emp = allEmployees.find((e) => e.employeeId === `EMP-SR-${String(i + 1).padStart(3, '0')}`);
    const unit = seniorUnits[i % seniorUnits.length];
    const isHistorical = i >= 18; // 7 historical
    await allotEmployee(emp, unit, isHistorical, i);
  }

  // 3. Allot 40 Juniors (28 Active, 12 Completed)
  for (let i = 0; i < 40; i++) {
    const emp = allEmployees.find((e) => e.employeeId === `EMP-JR-${String(i + 1).padStart(3, '0')}`);
    const unit = juniorUnits[i % juniorUnits.length];
    const isHistorical = i >= 28; // 12 historical
    await allotEmployee(emp, unit, isHistorical, i);
  }

  console.log(`[Seed] Successfully created 80 Allotments:`);
  console.log(`  - Active Stays (Registry Tab): ${activeCount}`);
  console.log(`  - Completed Stays (Records Archive Tab): ${completedCount}`);
  console.log(`  - Total Historical & Active Records: ${activeCount + completedCount}`);

  await mongoose.disconnect();
  console.log('[Seed] Finished.');
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});

