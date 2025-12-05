import { CategoryController } from '@/server/controllers/category-controller';
import { requireAdmin } from '@/server/middleware/auth';
import { NextResponse } from 'next/server';

const controller = new CategoryController();

export async function GET() {
  try {
    return await controller.getAll();
  } catch (error) {
    // Ensure we always return JSON, not HTML error page
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        data: [] 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  return controller.create(request);
}

