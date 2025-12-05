import { ObjectId } from 'mongodb';

/**
 * Convert TypeORM entity with ObjectId fields to JSON-serializable format
 */
export function serializeEntity<T>(entity: T): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};
  const entityObj = entity as Record<string, unknown>;
  for (const [key, value] of Object.entries(entityObj)) {
    if (value instanceof ObjectId) {
      serialized[key] = value.toString();
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? serializeEntity(item)
          : item
      );
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
