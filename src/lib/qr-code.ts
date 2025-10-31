import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a secure random token for table check-in
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate QR code image as base64 data URL
 */
export async function generateQrCodeImage(data: string): Promise<string> {
  try {
    const base64 = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    return base64;
  } catch (error) {
    throw new Error('Failed to generate QR code image');
  }
}

