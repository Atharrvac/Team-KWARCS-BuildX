export const API_URL = __DEV__ 
  ? 'http://localhost:5001' 
  : 'https://your-production-api.com';

export const CLOUDINARY_UPLOAD_PRESET = 'recify_uploads';
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
