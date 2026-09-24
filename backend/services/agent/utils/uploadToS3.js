import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const uploadToS3 = async (
    filename,
    buffer,
    contentType
) => {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        });

        await s3.send(command);

        console.log("✅ Uploaded to S3:", filename);

        return filename;

    } catch (error) {
        console.error("❌ S3 UPLOAD ERROR:", error);
        throw error;
    }
};