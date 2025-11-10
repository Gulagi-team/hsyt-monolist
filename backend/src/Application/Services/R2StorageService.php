<?php

declare(strict_types=1);

namespace App\Application\Services;

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Psr\Log\LoggerInterface;

class R2StorageService
{
    private S3Client $s3Client;
    private string $bucket;
    private string $publicUrl;
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
        
        // Initialize R2 client with S3-compatible API
        $this->s3Client = new S3Client([
            'version' => 'latest',
            'region' => $_ENV['R2_REGION'] ?? 'auto',
            'endpoint' => $_ENV['R2_ENDPOINT'],
            'use_path_style_endpoint' => false, // Set to false for R2
            'credentials' => [
                'key' => $_ENV['R2_ACCESS_KEY_ID'],
                'secret' => $_ENV['R2_SECRET_ACCESS_KEY'],
            ],
            'http' => [
                'verify' => true, // Enable SSL verification
            ]
        ]);

        $this->bucket = $_ENV['R2_BUCKET'];
        $this->publicUrl = $_ENV['R2_PUBLIC_URL'];
    }

    /**
     * Upload file to R2 storage
     */
    public function uploadFile(string $filePath, string $key, string $contentType = 'application/octet-stream'): array
    {
        try {
            $this->logger->info('Uploading file to R2', [
                'key' => $key,
                'bucket' => $this->bucket,
                'content_type' => $contentType
            ]);

            $result = $this->s3Client->putObject([
                'Bucket' => $this->bucket,
                'Key' => $key,
                'SourceFile' => $filePath,
                'ContentType' => $contentType,
                'ACL' => 'public-read', // Make file publicly accessible
                'Metadata' => [
                    'uploaded_at' => date('Y-m-d H:i:s'),
                    'original_name' => basename($filePath)
                ]
            ]);

            $publicUrl = $this->getPublicUrl($key);

            $this->logger->info('File uploaded successfully to R2', [
                'key' => $key,
                'public_url' => $publicUrl,
                'etag' => $result['ETag']
            ]);

            return [
                'success' => true,
                'key' => $key,
                'url' => $publicUrl,
                'etag' => $result['ETag'],
                'bucket' => $this->bucket
            ];

        } catch (AwsException $e) {
            $this->logger->error('Failed to upload file to R2', [
                'key' => $key,
                'error' => $e->getMessage(),
                'aws_error_code' => $e->getAwsErrorCode()
            ]);

            throw new \Exception('Failed to upload file to R2: ' . $e->getMessage());
        }
    }

    /**
     * Upload file from string content
     */
    public function uploadFromString(string $content, string $key, string $contentType = 'application/octet-stream'): array
    {
        try {
            $this->logger->info('Uploading content to R2', [
                'key' => $key,
                'bucket' => $this->bucket,
                'content_type' => $contentType,
                'content_length' => strlen($content)
            ]);

            $result = $this->s3Client->putObject([
                'Bucket' => $this->bucket,
                'Key' => $key,
                'Body' => $content,
                'ContentType' => $contentType,
                'ACL' => 'public-read',
                'Metadata' => [
                    'uploaded_at' => date('Y-m-d H:i:s'),
                    'content_length' => (string)strlen($content)
                ]
            ]);

            $publicUrl = $this->getPublicUrl($key);

            $this->logger->info('Content uploaded successfully to R2', [
                'key' => $key,
                'public_url' => $publicUrl,
                'etag' => $result['ETag']
            ]);

            return [
                'success' => true,
                'key' => $key,
                'url' => $publicUrl,
                'etag' => $result['ETag'],
                'bucket' => $this->bucket
            ];

        } catch (AwsException $e) {
            $this->logger->error('Failed to upload content to R2', [
                'key' => $key,
                'error' => $e->getMessage(),
                'aws_error_code' => $e->getAwsErrorCode()
            ]);

            throw new \Exception('Failed to upload content to R2: ' . $e->getMessage());
        }
    }

    /**
     * Delete file from R2 storage
     */
    public function deleteFile(string $key): bool
    {
        try {
            $this->logger->info('Deleting file from R2', [
                'key' => $key,
                'bucket' => $this->bucket
            ]);

            $this->s3Client->deleteObject([
                'Bucket' => $this->bucket,
                'Key' => $key
            ]);

            $this->logger->info('File deleted successfully from R2', ['key' => $key]);
            return true;

        } catch (AwsException $e) {
            $this->logger->error('Failed to delete file from R2', [
                'key' => $key,
                'error' => $e->getMessage(),
                'aws_error_code' => $e->getAwsErrorCode()
            ]);

            return false;
        }
    }

    /**
     * Check if file exists in R2 storage
     */
    public function fileExists(string $key): bool
    {
        try {
            $this->s3Client->headObject([
                'Bucket' => $this->bucket,
                'Key' => $key
            ]);
            return true;
        } catch (AwsException $e) {
            return false;
        }
    }

    /**
     * Get public URL for a file
     */
    public function getPublicUrl(string $key): string
    {
        return rtrim($this->publicUrl, '/') . '/' . ltrim($key, '/');
    }

    /**
     * Generate unique file key with timestamp and random string
     */
    public function generateFileKey(string $originalName, string $prefix = 'medical'): string
    {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $timestamp = date('Y/m/d');
        $randomString = bin2hex(random_bytes(8));
        
        return "{$prefix}/{$timestamp}/{$randomString}.{$extension}";
    }

    /**
     * Get file metadata
     */
    public function getFileMetadata(string $key): ?array
    {
        try {
            $result = $this->s3Client->headObject([
                'Bucket' => $this->bucket,
                'Key' => $key
            ]);

            return [
                'key' => $key,
                'size' => $result['ContentLength'],
                'content_type' => $result['ContentType'],
                'last_modified' => $result['LastModified'],
                'etag' => $result['ETag'],
                'metadata' => $result['Metadata'] ?? []
            ];

        } catch (AwsException $e) {
            $this->logger->error('Failed to get file metadata from R2', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * List files in bucket with prefix
     */
    public function listFiles(string $prefix = '', int $maxKeys = 100): array
    {
        try {
            $params = [
                'Bucket' => $this->bucket,
                'MaxKeys' => $maxKeys
            ];

            if (!empty($prefix)) {
                $params['Prefix'] = $prefix;
            }

            $result = $this->s3Client->listObjectsV2($params);
            
            $files = [];
            if (isset($result['Contents'])) {
                foreach ($result['Contents'] as $object) {
                    $files[] = [
                        'key' => $object['Key'],
                        'size' => $object['Size'],
                        'last_modified' => $object['LastModified'],
                        'etag' => $object['ETag'],
                        'url' => $this->getPublicUrl($object['Key'])
                    ];
                }
            }

            return $files;

        } catch (AwsException $e) {
            $this->logger->error('Failed to list files from R2', [
                'prefix' => $prefix,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
}
