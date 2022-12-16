const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default async function handler(req, res) {
  const { image, options = {} } = JSON.parse(req.body);

  try {
    const results = await cloudinary.uploader.upload(image, {
      ...options,
      folder: 'my-image-background',
      upload_preset: 'require-moderation'
    });
    return res.status(200).json(results);
  } catch(e) {
    console.log('Failed to upload to Cloudinary', e);
    return res.status(500).json({
      message: 'Failed to upload image',
    });
  }
}