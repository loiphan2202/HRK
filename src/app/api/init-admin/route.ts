import { NextResponse } from 'next/server';
import { UserService } from '@/server/services/user-service';

export async function POST() {
  try {
    const userService = new UserService();
    
    // Check if admin already exists
    const existingAdmin = await userService.findByEmail('admin1@gmail.com');
    if (existingAdmin) {
      return NextResponse.json({ 
        success: true, 
        message: 'Admin account already exists',
        exists: true
      });
    }

    // Create admin account
    const admin = await userService.create({
      email: 'admin1@gmail.com',
      password: '123456',
      name: 'Admin',
      role: 'ADMIN',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin account created successfully',
      data: { id: admin.id, email: admin.email }
    });
  } catch (error: unknown) {
    console.error('Failed to init admin:', error);
    const message = error instanceof Error ? error.message : 'Failed to create admin account';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userService = new UserService();
    const existingAdmin = await userService.findByEmail('admin1@gmail.com');
    
    return NextResponse.json({ 
      success: true, 
      exists: !!existingAdmin
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check admin';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

