import dotenv from 'dotenv';
import path from 'path';

// Works in both CommonJS (tsx) and compiled JS
const envPath = path.resolve(process.cwd(), 'server', '.env');
dotenv.config({ path: envPath });

// Fallback: also try loading from the cwd directly
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alhaditha_hostel',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key_alhaditha_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  upcomingDaysThreshold: parseInt(process.env.UPCOMING_CHECKOUT_DAYS_THRESHOLD || '2', 10),
};
