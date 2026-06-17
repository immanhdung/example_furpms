import { v2 as cloudinary } from 'cloudinary';

export const initCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export const uploadToCloudinary = async (
  filePath: string,
  folder = 'furpms',
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
  });
  return { url: result.secure_url, publicId: result.public_id };
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export { cloudinary };
