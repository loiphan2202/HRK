import fs from 'fs';
import path from 'path';

type DestDir = 'users' | 'products';

const VALID_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]);

// Magic numbers for different image formats (currently unused, reserved for future validation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAGIC_NUMBERS = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46]
};

function getExtensionFromMimeType(mimeType: string): string | null {
  switch (mimeType) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/gif': return 'gif';
    case 'image/webp': return 'webp';
    default: return null;
  }
}

function isValidImageType(mimeType: string): boolean {
  return VALID_MIME_TYPES.has(mimeType);
}

function detectFileType(buffer: Buffer): string | null {
  if (buffer.length < 8) return null;

  // Check JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // Check PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // Check GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  // Check WebP (RIFF header)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    // Check for WEBP string at offset 8
    if (buffer.length >= 12 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && 
        buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }

  return null;
}

export async function saveFile(file: Blob, dest: DestDir, prefix?: string) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Get file content as buffer for type detection
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileBuffer.length > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  // First check the provided MIME type
  console.log('File type:', file.type);
  
  // Detect file type from content
  const detectedMimeType = detectFileType(fileBuffer);
  console.log('Detected MIME type:', detectedMimeType);

  if (!detectedMimeType || !isValidImageType(detectedMimeType)) {
    console.error('Invalid file type. Detected:', detectedMimeType);
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }

  // Get extension from detected MIME type
  const ext = '.' + getExtensionFromMimeType(detectedMimeType);
  if (!ext) {
    throw new Error('Could not determine file extension');
  }

  // Create upload directory if it doesn't exist
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads', dest);
  await fs.promises.mkdir(uploadsRoot, { recursive: true });

  // Generate safe filename
  const timestamp = Date.now();
  const safePrefix = prefix ? prefix.replaceAll(/[^a-zA-Z0-9-_]/g, '') : 'file';
  const filename = `${safePrefix}_${timestamp}${ext}`;
  const fullPath = path.join(uploadsRoot, filename);

  await fs.promises.writeFile(fullPath, fileBuffer);

  // return public relative path
  return `/uploads/${dest}/${filename}`;
}

export async function saveFileFromForm(formData: FormData, fieldName: string, dest: DestDir, prefix?: string) {
  const entry = formData.get(fieldName);
  if (!entry) return null;
  // entry may be File or string
  if (typeof entry === 'string') return null;
  return await saveFile(entry as Blob, dest, prefix);
}
