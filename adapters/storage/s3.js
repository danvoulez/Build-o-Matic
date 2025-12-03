import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
export class S3StorageAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'storage:s3';
        this.client = null;
    }
    async init() {
        this.client = new S3Client({
            region: this.cfg.region,
            credentials: {
                accessKeyId: this.cfg.accessKeyId,
                secretAccessKey: this.cfg.secretAccessKey,
            },
        });
    }
    async close() {
        this.client = null;
    }
    async put(bucket, key, body, contentType) {
        if (!this.client)
            throw new Error('S3 adapter not initialized');
        await this.client.send(new PutObjectCommand({
            Bucket: bucket || this.cfg.bucketDefault,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
        const url = await getSignedUrl(this.client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
        return { url };
    }
    async get(bucket, key) {
        if (!this.client)
            throw new Error('S3 adapter not initialized');
        const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const chunks = [];
        for await (const chunk of res.Body)
            chunks.push(chunk);
        return Buffer.concat(chunks);
    }
    async remove(bucket, key) {
        if (!this.client)
            throw new Error('S3 adapter not initialized');
        await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
}
