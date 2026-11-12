import { Allotment } from '../models';
import { AllotmentStatus, NotificationType, NOTIFICATION_THRESHOLDS } from '../constants';

export class NotificationService {
  public static async getNotifications(): Promise<{
    summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number };
    alerts: any[];
  }> {
    // Only checked-in active allotments participate in checkout notifications
    const activeAllotments = await Allotment.find({
      status: AllotmentStatus.CHECKED_IN,
    })
      .populate('employeeId', 'name employeeId category contactNumber')
      .populate('bootcampId', 'bootcampCode name')
      .populate('allocationUnitId', 'unitCode unitType portionIdentifier bedIdentifier')
      .lean();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const alerts: any[] = [];
    let upcomingCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;

    activeAllotments.forEach((allotment: any) => {
      const expCheckout = new Date(allotment.expectedCheckoutDate);
      const expDateOnly = new Date(expCheckout.getFullYear(), expCheckout.getMonth(), expCheckout.getDate());

      const diffTime = expDateOnly.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // OVERDUE
        overdueCount++;
        alerts.push({
          type: NotificationType.OVERDUE,
          allotmentId: allotment._id,
          employee: allotment.employeeId,
          bootcamp: allotment.bootcampId,
          unit: allotment.allocationUnitId,
          expectedCheckoutDate: allotment.expectedCheckoutDate,
          actualCheckInDate: allotment.actualCheckInDate,
          daysOverdue: Math.abs(diffDays),
        });
      } else if (diffDays === 0) {
        // DUE TODAY
        dueTodayCount++;
        alerts.push({
          type: NotificationType.DUE_TODAY,
          allotmentId: allotment._id,
          employee: allotment.employeeId,
          bootcamp: allotment.bootcampId,
          unit: allotment.allocationUnitId,
          expectedCheckoutDate: allotment.expectedCheckoutDate,
          actualCheckInDate: allotment.actualCheckInDate,
          daysRemaining: 0,
        });
      } else if (diffDays <= NOTIFICATION_THRESHOLDS.UPCOMING_DAYS) {
        // UPCOMING
        upcomingCount++;
        alerts.push({
          type: NotificationType.UPCOMING,
          allotmentId: allotment._id,
          employee: allotment.employeeId,
          bootcamp: allotment.bootcampId,
          unit: allotment.allocationUnitId,
          expectedCheckoutDate: allotment.expectedCheckoutDate,
          actualCheckInDate: allotment.actualCheckInDate,
          daysRemaining: diffDays,
        });
      }
    });

    // Sort: OVERDUE first, then DUE TODAY, then UPCOMING
    const priorityOrder = { [NotificationType.OVERDUE]: 1, [NotificationType.DUE_TODAY]: 2, [NotificationType.UPCOMING]: 3 };
    alerts.sort((a, b) => priorityOrder[a.type as NotificationType] - priorityOrder[b.type as NotificationType]);

    return {
      summary: {
        upcomingCount,
        dueTodayCount,
        overdueCount,
      },
      alerts,
    };
  }
}
