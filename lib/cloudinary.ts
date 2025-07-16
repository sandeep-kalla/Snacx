// Configuration for next-cloudinary
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvbfanque',
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'meme-preset',
};

export interface UploadResponse {
  secure_url: string;
  public_id: string;
}

// Helper function to get Cloudinary URL
export function getCloudinaryUrl(publicId: string, transformations?: string): string {
  const cloudName = cloudinaryConfig.cloudName;
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  if (transformations) {
    return `${baseUrl}/${transformations}/${publicId}`;
  }

  return `${baseUrl}/${publicId}`;
}

// Helper function to check if Cloudinary is properly configured
export function isCloudinaryConfigured(): boolean {
  return !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
}