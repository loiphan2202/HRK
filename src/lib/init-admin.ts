import { UserService } from '@/server/services/user-service';

export async function ensureAdminExists() {
  try {
    const userService = new UserService();
    
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
    console.error('Failed to create admin account:', error);
    throw error;
  }
}

