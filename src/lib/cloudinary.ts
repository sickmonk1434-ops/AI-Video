import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function uploadToCloudinary(
    fileBuffer: ArrayBuffer | Buffer,
    folder: string = "video-ai-assets",
    resourceType: "image" | "video" | "auto" = "auto"
): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = Buffer.from(fileBuffer as any);

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                if (!result?.secure_url) {
                    return reject(new Error("Cloudinary did not return a secure URL"));
                }
                resolve(result.secure_url);
            }
        );

        uploadStream.end(buffer);
    });
}
