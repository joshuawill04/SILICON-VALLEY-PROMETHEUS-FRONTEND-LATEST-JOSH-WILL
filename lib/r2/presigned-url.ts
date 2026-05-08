import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "./client";

const EXPIRE_IN_SECONDS = 3600; // 1 hour

export async function getPresignedPutUrl(bucket: string, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: EXPIRE_IN_SECONDS });
  return url;
}

export async function getPresignedGetUrl(bucket: string, key: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: EXPIRE_IN_SECONDS });
  return url;
}
