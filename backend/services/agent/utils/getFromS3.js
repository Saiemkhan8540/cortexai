import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const getFromS3 = async (
    filename,
    expiresIn = 600
) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: filename,
        });

        const url = await getSignedUrl(
            s3,
            command,
            {
                expiresIn,
            }
        );

        console.log("🔗 Signed URL generated:", filename);

        return url;

    } catch (error) {
        console.error("❌ GET S3 URL ERROR:", error);
        throw error;
    }
};