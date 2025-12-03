import type { StorageAdapter } from '../index';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type S3Config = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketDefault?: string;
};

export class S3StorageAdapter implements StorageAdapter {
  id = 'storage:s3';
  private client: S3Client | null = null;
  constructor(private cfg: S3Config) {}

  async init(): Promise<void> {
    this.client = new S3Client({
      region: this.cfg.region,
      credentials: {
        accessKeyId: this.cfg.accessKeyId,
        secretAccessKey: this.cfg.secretAccessKey,
      },
    });
  }

  async close(): Promise<void> {
    this.client = null;
  }

  async put(bucket: string, key: string, body: Buffer | string, contentType?: string): Promise<{ url: string }> {
    if (!this.client) throw new Error('S3 adapter not initialized');
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket || this.cfg.bucketDefault!,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    const url = await getSignedUrl(this.client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
    return { url };
  }

  async get(bucket: string, key: string): Promise<Buffer> {
    if (!this.client) throw new Error('S3 adapter not initialized');
    const res: any = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of res.Body) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  }

  async remove(bucket: string, key: string): Promise<void> {
    if (!this.client) throw new Error('S3 adapter not initialized');
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}