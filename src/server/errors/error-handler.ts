import { NextResponse } from 'next/server';
import { BaseError } from './base-error';
import { ZodError } from 'zod';

export class ErrorHandler {
  static handle(error: unknown) {
    if (error instanceof BaseError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: error.type,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof ZodError) {
      const errorMessage = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'ValidationError',
            message: errorMessage,
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Unhandled error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'InternalServerError',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}