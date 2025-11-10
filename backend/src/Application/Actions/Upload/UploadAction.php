<?php

declare(strict_types=1);

namespace App\Application\Actions\Upload;

use App\Application\Actions\Action;
use App\Application\Services\R2StorageService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class UploadAction extends Action
{
    private string $uploadPath;
    private int $maxFileSize;
    private R2StorageService $r2Storage;

    public function __construct(
        LoggerInterface $logger, 
        string $uploadPath, 
        int $maxFileSize,
        R2StorageService $r2Storage
    ) {
        parent::__construct($logger);
        $this->uploadPath = $uploadPath;
        $this->maxFileSize = $maxFileSize;
        $this->r2Storage = $r2Storage;
    }

    protected function action(): Response
    {
        $uploadedFiles = $this->request->getUploadedFiles();
        
        if (!isset($uploadedFiles['file'])) {
            throw new HttpBadRequestException($this->request, 'Không có file được tải lên');
        }

        /** @var UploadedFileInterface $uploadedFile */
        $uploadedFile = $uploadedFiles['file'];

        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            throw new HttpBadRequestException($this->request, 'Lỗi khi tải file lên');
        }

        // Validate file size
        if ($uploadedFile->getSize() > $this->maxFileSize) {
            throw new HttpBadRequestException($this->request, 'Kích thước file vượt quá giới hạn cho phép');
        }

        // Validate file type
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        $mimeType = $uploadedFile->getClientMediaType();
        
        if (!in_array($mimeType, $allowedMimeTypes)) {
            throw new HttpBadRequestException($this->request, 'Loại file không được hỗ trợ');
        }

        try {
            // Create temporary file for processing
            $tempFile = tempnam(sys_get_temp_dir(), 'medical_upload_');
            $uploadedFile->moveTo($tempFile);

            // Convert file to base64 for analysis
            $fileContent = file_get_contents($tempFile);
            $base64Data = base64_encode($fileContent);

            // Generate unique key for R2 storage
            $r2Key = $this->r2Storage->generateFileKey(
                $uploadedFile->getClientFilename() ?? 'unknown',
                'medical-uploads'
            );

            // Upload to R2 storage
            $r2Result = $this->r2Storage->uploadFile($tempFile, $r2Key, $mimeType);

            // Clean up temporary file
            unlink($tempFile);

            $this->logger->info('File uploaded successfully', [
                'original_name' => $uploadedFile->getClientFilename(),
                'r2_key' => $r2Key,
                'r2_url' => $r2Result['url'],
                'size' => $uploadedFile->getSize()
            ]);

            return $this->respondWithData([
                'filename' => basename($r2Key),
                'originalName' => $uploadedFile->getClientFilename(),
                'mimeType' => $mimeType,
                'size' => $uploadedFile->getSize(),
                'fileData' => $base64Data,
                'r2Key' => $r2Key,
                'r2Url' => $r2Result['url'],
                'message' => 'File được tải lên thành công và lưu trữ trên R2'
            ]);

        } catch (\Exception $e) {
            $this->logger->error('File upload failed', [
                'error' => $e->getMessage(),
                'filename' => $uploadedFile->getClientFilename()
            ]);

            throw new HttpBadRequestException($this->request, 'Không thể tải file lên. Vui lòng thử lại.');
        }
    }
}
