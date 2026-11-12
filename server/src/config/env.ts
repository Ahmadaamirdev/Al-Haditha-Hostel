import dotenv from 'dotenv';
import path from 'path';

// Try loading from server/.env if local
const envPath = path.resolve(process.cwd(), 'server', '.env');
dotenv.config({ path: envPath });

// Fallback: also try loading from current working directory
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri:
    process.env.MONGODB_URI ||
    'mongodb+srv://blackpanther4518299_db_user:lAvollig7IwQUBn3@cluster0.vskeury.mongodb.net/alhaditha_hostel?retryWrites=true&w=majority',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key_alhaditha_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  upcomingDaysThreshold: parseInt(process.env.UPCOMING_CHECKOUT_DAYS_THRESHOLD || '2', 10),
};
