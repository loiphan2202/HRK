import { NextResponse } from 'next/server';
import { migrateProductsWithoutCategory } from '@/lib/migrate-products';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await migrateProductsWithoutCategory();
    return NextResponse.json({ 
      success: true, 
      message: 'Products migrated successfully' 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to migrate products';
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

