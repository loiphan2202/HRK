import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type DestDir = 'users' | 'products';

const VALID_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]);

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

export async function uploadToCloudinary(
  file: Blob,
  dest: DestDir,
  prefix?: string
): Promise<string> {
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

  // Detect file type from content
  const detectedMimeType = detectFileType(fileBuffer);
  console.log('Detected MIME type:', detectedMimeType);

  if (!detectedMimeType || !isValidImageType(detectedMimeType)) {
    console.error('Invalid file type. Detected:', detectedMimeType);
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }

  // Generate safe filename
  const timestamp = Date.now();
  const safePrefix = prefix ? prefix.replaceAll(/[^a-zA-Z0-9-_]/g, '') : 'file';
  const publicId = `${dest}/${safePrefix}_${timestamp}`;

  try {
    // Convert buffer to base64 data URI for Cloudinary
    const base64Data = fileBuffer.toString('base64');
    const dataUri = `data:${detectedMimeType};base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: dest,
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export async function uploadFromForm(
  formData: FormData,
  fieldName: string,
  dest: DestDir,
  prefix?: string
): Promise<string | null> {
  const entry = formData.get(fieldName);
  if (!entry) return null;
  // entry may be File or string
  if (typeof entry === 'string') return null;
  return await uploadToCloudinary(entry as Blob, dest, prefix);
}

