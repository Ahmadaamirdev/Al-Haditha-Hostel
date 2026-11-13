import dns from 'dns';
import app from '../index';
import http from 'http';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details?: any;
}

const results: TestResult[] = [];

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`[Verification] Testing against internal test server at ${baseUrl}\n`);

  let token = '';

  const request = async (path: string, options: RequestInit = {}): Promise<{ status: number; ok: boolean; data: any }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const data: any = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  };

  try {
    // 1. Health check
    const health = await request('/api/v1/health');
    results.push({
      name: 'GET /api/v1/health',
      status: health.status === 200 && health.data?.status === 'success' ? 'PASS' : 'FAIL',
      details: health.data,
    });

    // 2. Auth Login
    const login = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin@alhaditha.com',
        password: 'Admin@123456',
      }),
    });
    token = login.data?.data?.token || '';
    results.push({
      name: 'POST /api/v1/auth/login',
      status: login.status === 200 && !!token ? 'PASS' : 'FAIL',
      details: { user: login.data?.data?.user?.username, hasToken: !!token },
    });

    // 3. Employees List
    const employees = await request('/api/v1/employees');
    const empList = employees.data?.data || [];
    results.push({
      name: 'GET /api/v1/employees',
      status: employees.status === 200 && empList.length >= 80 ? 'PASS' : 'FAIL',
      details: { totalEmployees: empList.length },
    });

    // 4. Single Employee Lookup
    const firstEmp = empList[0];
    const empDetail = await request(`/api/v1/employees/${firstEmp?._id}`);
    results.push({
      name: 'GET /api/v1/employees/:id',
      status: empDetail.status === 200 && empDetail.data?.data?.employeeId === firstEmp?.employeeId ? 'PASS' : 'FAIL',
      details: { employeeId: empDetail.data?.data?.employeeId, name: empDetail.data?.data?.name },
    });

    // 5. Bootcamps List
    const bootcamps = await request('/api/v1/bootcamps');
    const bcList = bootcamps.data?.data || [];
    results.push({
      name: 'GET /api/v1/bootcamps',
      status: bootcamps.status === 200 && bcList.length > 0 ? 'PASS' : 'FAIL',
      details: { totalBootcamps: bcList.length },
    });

    // 6. Available Units
    const availableUnits = await request('/api/v1/bootcamps/units/available?category=JUNIOR');
    results.push({
      name: 'GET /api/v1/bootcamps/units/available',
      status: availableUnits.status === 200 && Array.isArray(availableUnits.data?.data) ? 'PASS' : 'FAIL',
      details: { availableJuniorUnits: availableUnits.data?.data?.length },
    });

    // 7. Unit Suggestion (VIP, Senior, Junior)
    const suggestVip = await request('/api/v1/bootcamps/units/suggest?category=VIP');
    const suggestJunior = await request('/api/v1/bootcamps/units/suggest?category=JUNIOR');
    const juniorUnitCode = suggestJunior.data?.data?.suggestedUnit?.unitCode;
    results.push({
      name: 'GET /api/v1/bootcamps/units/suggest',
      status: suggestJunior.status === 200 && !!juniorUnitCode ? 'PASS' : 'FAIL',
      details: {
        vipSuggestion: suggestVip.data?.data?.suggestedUnit?.unitCode || 'None (all VIP units occupied)',
        juniorSuggestion: juniorUnitCode,
      },
    });

    // 8. Active Allotments (Registry)
    const activeAllotments = await request('/api/v1/allotments');
    const activeList = activeAllotments.data?.data || [];
    results.push({
      name: 'GET /api/v1/allotments (Active Registry)',
      status: activeAllotments.status === 200 && activeList.length > 0 ? 'PASS' : 'FAIL',
      details: { activeCount: activeList.length },
    });

    // 9. Records (Complete Visit History)
    const records = await request('/api/v1/allotments/records');
    const recordList = records.data?.data || [];
    results.push({
      name: 'GET /api/v1/allotments/records (Visit Archive)',
      status: records.status === 200 && recordList.length >= 80 ? 'PASS' : 'FAIL',
      details: { totalRecords: recordList.length },
    });

    // 10. Records Search Filter
    const searchRecords = await request('/api/v1/allotments/records?search=VIP');
    results.push({
      name: 'GET /api/v1/allotments/records?search=VIP',
      status: searchRecords.status === 200 && searchRecords.data?.data?.length > 0 ? 'PASS' : 'FAIL',
      details: { searchMatches: searchRecords.data?.data?.length },
    });

    // 11. Update Stay Duration
    const testAllotment = activeList[0];
    const updateDur = await request(`/api/v1/allotments/${testAllotment._id}/duration`, {
      method: 'PATCH',
      body: JSON.stringify({ plannedStayDuration: testAllotment.plannedStayDuration + 3 }),
    });
    results.push({
      name: 'PATCH /api/v1/allotments/:id/duration',
      status: updateDur.status === 200 && updateDur.data?.data?.plannedStayDuration === testAllotment.plannedStayDuration + 3 ? 'PASS' : 'FAIL',
      details: { newDuration: updateDur.data?.data?.plannedStayDuration },
    });

    // 12. Check-out functionality
    const checkOutRes = await request(`/api/v1/allotments/${testAllotment._id}/check-out`, {
      method: 'PATCH',
      body: JSON.stringify({ actualCheckoutDate: new Date().toISOString() }),
    });
    results.push({
      name: 'PATCH /api/v1/allotments/:id/check-out',
      status: checkOutRes.status === 200 && checkOutRes.data?.data?.status === 'COMPLETED' ? 'PASS' : 'FAIL',
      details: {
        checkedOutStatus: checkOutRes.data?.data?.status,
        unitFreed: checkOutRes.data?.data?.allocationUnitId?.isOccupied === false,
      },
    });

    // 13. Notifications
    const notifications = await request('/api/v1/notifications');
    const alerts = notifications.data?.data?.alerts || [];
    results.push({
      name: 'GET /api/v1/notifications',
      status: notifications.status === 200 && Array.isArray(alerts) ? 'PASS' : 'FAIL',
      details: {
        totalAlerts: alerts.length,
        summary: notifications.data?.data?.summary,
      },
    });

  } finally {
    server.close();
  }

  console.log('====== ROUTE & FUNCTIONALITY VERIFICATION RESULTS ======');
  let allPassed = true;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.name}`);
    if (r.details) {
      console.log(`   Details:`, JSON.stringify(r.details));
    }
    if (r.status === 'FAIL') allPassed = false;
  }
  console.log('========================================================\n');
  if (allPassed) {
    console.log('🎉 ALL 13 TEST SUITES PASSED FLAWLESSLY!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('[Verification Error]:', err);
  process.exit(1);
});
