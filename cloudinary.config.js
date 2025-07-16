// Cloudinary configuration for next-cloudinary
const config = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvbfanque',
  apiKey: process.env.CLOUDINARY_API_KEY || '829218272114533',
  apiSecret: process.env.CLOUDINARY_API_SECRET || 'sLGirD0KG_SmrvKhWer6z3jYPnc',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'meme-preset',
  secure: true,
  folder: 'memes',
  transformation: {
    quality: 'auto',
    fetch_format: 'auto'
  }
};

// For Next.js environment
if (typeof window === 'undefined') {
  // Server-side configuration
  module.exports = config;
} else {
  // Client-side configuration (only public values)
  window.cloudinaryConfig = {
    cloudName: config.cloudName,
    uploadPreset: config.uploadPreset,
    secure: config.secure,
    folder: config.folder
  };
}

module.exports = config;
