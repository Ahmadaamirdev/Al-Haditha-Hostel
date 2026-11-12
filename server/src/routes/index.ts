import { Router } from 'express';
import { authenticate, validate } from '../middleware';
import * as validations from '../validations';
import * as controllers from '../controllers';

const router = Router();

// =================== AUTH ROUTES ===================
router.post('/auth/login', validate(validations.loginSchema), controllers.login);

// Protected routes below
router.use(authenticate);

// =================== EMPLOYEE ROUTES ===================
router.post('/employees', validate(validations.createEmployeeSchema), controllers.createEmployee);
router.get('/employees', controllers.getEmployees);
router.get('/employees/:id', controllers.getEmployeeById);

// =================== BOOTCAMP ROUTES ===================
router.post('/bootcamps', validate(validations.createBootcampSchema), controllers.createBootcamp);
router.get('/bootcamps', controllers.getBootcamps);
router.get('/bootcamps/units/available', controllers.getAvailableUnits);
router.get('/bootcamps/units/suggest', controllers.suggestUnit);

// =================== ALLOTMENT ROUTES ===================
router.post('/allotments', validate(validations.createAllotmentSchema), controllers.createAllotment);
router.get('/allotments', controllers.getActiveAllotments);
router.patch('/allotments/:id/check-in', validate(validations.checkInSchema), controllers.confirmCheckIn);
router.patch('/allotments/:id/check-out', validate(validations.checkOutSchema), controllers.confirmCheckOut);
router.patch('/allotments/:id/duration', validate(validations.updateDurationSchema), controllers.updateDuration);

// =================== NOTIFICATION ROUTES ===================
router.get('/notifications', controllers.getNotifications);

export default router;

