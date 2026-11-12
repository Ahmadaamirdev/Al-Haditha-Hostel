import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';
import { AppError } from '../utils';
import { config } from '../config/env';

export class AuthService {
  public static async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials or inactive account', 401, 'UNAUTHORIZED');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  public static async seedInitialAdmin(): Promise<void> {
    const count = await User.countDocuments();
    if (count === 0) {
      const passwordHash = await bcrypt.hash('Admin@123456', 10);
      await User.create({
        username: 'admin@alhaditha.com',
        fullName: 'Master Administrator',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      });
      console.log('[AuthService] Default admin account seeded: admin@alhaditha.com / Admin@123456');
    }
  }
}
