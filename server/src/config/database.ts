import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env';

// Configure reliable DNS servers (Google & Cloudflare) for SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error('[Database] Connection Error:', error?.message || error);
    process.exit(1);
  }
};
