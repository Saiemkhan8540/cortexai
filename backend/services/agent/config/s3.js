import { S3Client } from "@aws-sdk/client-s3";

console.log("AWS ENV CHECK:", {
  region: process.env.AWS_REGION,
  accessKey: process.env.AWS_ACCESS_KEY_ID
    ? "LOADED"
    : "MISSING",
  secretKey: process.env.AWS_SECRET_ACCESS_KEY
    ? "LOADED"
    : "MISSING",
  bucket: process.env.AWS_BUCKET_NAME
    ? "LOADED"
    : "MISSING",
});

export const s3 = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});