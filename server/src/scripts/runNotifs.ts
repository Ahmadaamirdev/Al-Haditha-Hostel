import { connectDB } from '../config/database';
import { NotificationService } from '../services/notificationService';

async function testNotifs() {
  await connectDB();
  const res = await NotificationService.getNotifications();
  console.log('Result summary:', res.summary);
  console.log('Alerts count:', res.alerts.length);
  if (res.alerts.length > 0) {
    console.log('First 3 alerts:', JSON.stringify(res.alerts.slice(0, 3), null, 2));
  }
  process.exit(0);
}

testNotifs().catch(console.error);
