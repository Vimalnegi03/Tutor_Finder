import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv  from 'dotenv';
dotenv.config()
// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        return null;
    }

    try {
        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', // Automatically detect the file type
        });

        // Log success and return the response
        console.log("File successfully uploaded:", response.url);
        return response;

    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        return null;

    } finally {
        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);
    }
};

export default uploadOnCloudinary;
