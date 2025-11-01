import { UserServiceTypeORM } from '@/server/services/user-service-typeorm';

export async function ensureAdminExists() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set, skipping admin initialization');
    return null;
  }

  try {
    const userService = new UserServiceTypeORM();
    
    // Check if admin already exists
    const existingAdmin = await userService.findByEmail('admin1@gmail.com');
    if (existingAdmin) {
      console.log('Admin account already exists');
      return existingAdmin;
    }

    // Create admin account
    const admin = await userService.create({
      email: 'admin1@gmail.com',
      password: '123456',
      name: 'Admin',
      role: 'ADMIN',
    });

    console.log('Admin account created successfully:', admin.email);
    return admin;
  } catch (error) {
    // Don't throw error, just log it - app should still work without admin
    console.error('Failed to create admin account:', error);
    return null;
  }
}

