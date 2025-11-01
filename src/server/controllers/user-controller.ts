import { NextResponse } from 'next/server';
import { UserServiceTypeORM } from '../services/user-service-typeorm';
import { userCreateSchema, userUpdateSchema, loginSchema } from '../schemas/user-schema';
import { ErrorHandler } from '../errors/error-handler';
import { UnauthorizedError } from '../errors/base-error';
import jwt from 'jsonwebtoken';
import { saveFileFromForm } from '@/server/utils/upload';
import { serializeEntity } from '../utils/typeorm-helpers';

export class UserController {
  private readonly service: UserServiceTypeORM;

  constructor() {
    this.service = new UserServiceTypeORM();
  }

  private excludePassword<T extends { password?: string }>(user: T) {
    // avoid using `any` — treat user as a record and omit password
    const record = { ...(user as unknown as Record<string, unknown>) };
    // remove password if present
    if ('password' in record) delete record['password'];
    return record;
  }

  async register(req: Request) {
    try {
      const contentType = req.headers.get('content-type') || '';
      let user;

      // handle multipart/form-data (file upload)
      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        const data: Record<string, string> = {};
        for (const key of Array.from(form.keys())) {
          const value = form.get(key);
          if (typeof value === 'string') data[key] = value;
        }
        const validated = userCreateSchema.parse(data);
        user = await this.service.create(validated);

        // save file if provided
        const userId = typeof user.id === 'string' ? user.id : user.id.toString();
        const imagePath = await saveFileFromForm(form, 'image', 'users', userId);
        if (imagePath) {
          user = await this.service.update(userId, { image: imagePath });
        }
      } else {
        const data = await req.json();
        const validated = userCreateSchema.parse(data);
        user = await this.service.create(validated);
      }

      // Generate token after registration
      const userId = typeof user.id === 'string' ? user.id : user.id.toString();
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        success: true,
        data: {
          user: this.excludePassword(serializeEntity(user)),
          token,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async login(req: Request) {
    try {
      const data = await req.json();
      const validatedData = loginSchema.parse(data);

      const user = await this.service.findByEmail(validatedData.email);
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const isValidPassword = await this.service.validatePassword(user, validatedData.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const userId = typeof user.id === 'string' ? user.id : user.id.toString();
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        success: true,
        data: {
          user: this.excludePassword(serializeEntity(user)),
          token,
        },
      });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      const contentType = req.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        const data: Record<string, string> = {};
        for (const key of Array.from(form.keys())) {
          const value = form.get(key);
          if (typeof value === 'string') data[key] = value;
        }
        const validatedData = userUpdateSchema.parse(data);
        const user = await this.service.update(id, validatedData);

        const imagePath = await saveFileFromForm(form, 'image', 'users', id);
        if (imagePath) {
          const updated = await this.service.update(id, { image: imagePath });
          return NextResponse.json({ success: true, data: this.excludePassword(serializeEntity(updated)) });
        }

        return NextResponse.json({ success: true, data: this.excludePassword(serializeEntity(user)) });
      }

      const data = await req.json();
      const validatedData = userUpdateSchema.parse(data);
      const user = await this.service.update(id, validatedData);

      return NextResponse.json({ success: true, data: this.excludePassword(serializeEntity(user)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      const user = await this.service.delete(id);
      return NextResponse.json({ success: true, data: this.excludePassword(serializeEntity(user)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const user = await this.service.findById(id);
      return NextResponse.json({ success: true, data: this.excludePassword(serializeEntity(user)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}