import { S3Client } from "@aws-sdk/client-s3";

const awsAccessKey = process.env.AWS_ACCESS_KEY_ID!;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const awsRegion = process.env.AWS_REGION!;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretAccessKey,
  },
  region: awsRegion,
});

export default s3;
