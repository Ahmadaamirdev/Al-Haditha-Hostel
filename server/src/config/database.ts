import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env';

// Configure reliable DNS servers (Google & Cloudflare) for SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted in some serverless runtimes
}

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error('[Database] Connection Error:', error?.message || error);
    // Don't exit process in serverless environment
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};
