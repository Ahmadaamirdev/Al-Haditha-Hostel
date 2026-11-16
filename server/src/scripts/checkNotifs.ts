import { connectDB } from '../config/database';
import { Allotment } from '../models';

async function check() {
  await connectDB();
  const all = await Allotment.find({}).select('status checkoutDate expectedCheckoutDate plannedStayDuration').populate('employeeId', 'name').lean();
  console.log('Total allotments in DB:', all.length);
  const statuses: any = {};
  all.forEach((a: any) => { statuses[a.status] = (statuses[a.status] || 0) + 1; });
  console.log('Statuses:', statuses);

  const now = new Date();
  console.log('Current Date now:', now.toISOString());

  const sample = all.filter((a: any) => {
    const d = new Date(a.checkoutDate || a.expectedCheckoutDate);
    return d <= new Date('2026-11-17T00:00:00Z');
  });
  console.log('Allotments with checkout <= Nov 17:', sample.length);
  console.log('Sample matching:', JSON.stringify(sample.slice(0, 10), null, 2));

  process.exit(0);
}

check().catch(console.error);
