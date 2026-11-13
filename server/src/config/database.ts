import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const connectWithOptions = async () => {
    return await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10, // Optimal pool size for serverless lambdas to avoid exhaustion
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
  };

  try {
    const conn = await connectWithOptions();
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    // If SRV or DNS resolution failed on local/Windows environment, retry with fallback DNS servers
    if (error?.message?.includes('querySrv') || error?.code === 'ECONNREFUSED') {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await connectWithOptions();
        isConnected = true;
        console.log(`[Database] MongoDB Connected (via fallback DNS): ${conn.connection.host}`);
        return;
      } catch (retryErr: any) {
        error = retryErr;
      }
    }

    console.error('[Database] Connection Error:', error?.message || error);
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};
