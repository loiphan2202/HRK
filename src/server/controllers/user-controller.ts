import { NextResponse } from 'next/server';
import { UserService } from '../services/user-service';
import { userCreateSchema, userUpdateSchema, loginSchema } from '../schemas/user-schema';
import { ErrorHandler } from '../errors/error-handler';
import { UnauthorizedError } from '../errors/base-error';
import jwt from 'jsonwebtoken';
import { saveFileFromForm } from '@/server/utils/upload';

export class UserController {
  private readonly service: UserService;

  constructor() {
    this.service = new UserService();
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
        const imagePath = await saveFileFromForm(form, 'image', 'users', user.id);
        if (imagePath) {
          user = await this.service.update(user.id, { image: imagePath });
        }
      } else {
        const data = await req.json();
        const validated = userCreateSchema.parse(data);
        user = await this.service.create(validated);
      }

      // Generate token after registration
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        success: true,
        data: {
          user: this.excludePassword(user),
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

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      return NextResponse.json({
        success: true,
        data: {
          user: this.excludePassword(user),
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
          return NextResponse.json({ success: true, data: this.excludePassword(updated) });
        }

        return NextResponse.json({ success: true, data: this.excludePassword(user) });
      }

      const data = await req.json();
      const validatedData = userUpdateSchema.parse(data);
      const user = await this.service.update(id, validatedData);

      return NextResponse.json({ success: true, data: this.excludePassword(user) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      const user = await this.service.delete(id);
      return NextResponse.json({ success: true, data: this.excludePassword(user) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const user = await this.service.findById(id);
      return NextResponse.json({ success: true, data: this.excludePassword(user) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}