import { ObjectId } from 'mongodb';

/**
 * Convert TypeORM entity with ObjectId fields to JSON-serializable format
 */
export function serializeEntity<T extends Record<string, any>>(entity: T): any {
  const serialized: any = {};
  for (const [key, value] of Object.entries(entity)) {
    if (value instanceof ObjectId) {
      serialized[key] = value.toString();
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item => serializeEntity(item));
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      serialized[key] = serializeEntity(value);
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

/**
 * Convert string ID to ObjectId
 */
export function toObjectId(id: string | ObjectId): ObjectId {
  return id instanceof ObjectId ? id : new ObjectId(id);
}
