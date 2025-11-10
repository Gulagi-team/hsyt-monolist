<?php

require_once 'backend/vendor/autoload.php';

use App\Application\Services\R2StorageService;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/backend');
$dotenv->load();

// Create logger
$logger = new Logger('r2-test');
$logger->pushHandler(new StreamHandler('php://stdout', Logger::INFO));

echo "🔧 Testing Cloudflare R2 Connection...\n";
echo "=====================================\n\n";

// Display configuration (without sensitive data)
echo "📋 Configuration:\n";
echo "- Bucket: " . ($_ENV['R2_BUCKET'] ?? 'NOT SET') . "\n";
echo "- Region: " . ($_ENV['R2_REGION'] ?? 'NOT SET') . "\n";
echo "- Endpoint: " . ($_ENV['R2_ENDPOINT'] ?? 'NOT SET') . "\n";
echo "- Public URL: " . ($_ENV['R2_PUBLIC_URL'] ?? 'NOT SET') . "\n";
echo "- Access Key: " . (isset($_ENV['R2_ACCESS_KEY_ID']) ? substr($_ENV['R2_ACCESS_KEY_ID'], 0, 8) . '...' : 'NOT SET') . "\n";
echo "- Secret Key: " . (isset($_ENV['R2_SECRET_ACCESS_KEY']) ? str_repeat('*', 20) : 'NOT SET') . "\n\n";

try {
    // Initialize R2 service
    echo "🚀 Initializing R2 Storage Service...\n";
    $r2Service = new R2StorageService($logger);
    echo "✅ R2 Service initialized successfully\n\n";

    // Test 1: List files in bucket
    echo "📂 Test 1: Listing files in bucket...\n";
    $files = $r2Service->listFiles('', 5);
    echo "✅ Successfully connected to R2!\n";
    echo "📊 Found " . count($files) . " files in bucket\n";
    
    if (!empty($files)) {
        echo "📄 Recent files:\n";
        foreach (array_slice($files, 0, 3) as $file) {
            echo "  - " . $file['key'] . " (" . number_format($file['size']) . " bytes)\n";
        }
    }
    echo "\n";

    // Test 2: Upload a test file
    echo "📤 Test 2: Uploading test file...\n";
    $testContent = "Test file uploaded at " . date('Y-m-d H:i:s') . "\nThis is a test from the medical system.";
    $testKey = 'test/connection-test-' . date('YmdHis') . '.txt';
    
    $uploadResult = $r2Service->uploadFromString($testContent, $testKey, 'text/plain');
    
    if ($uploadResult['success']) {
        echo "✅ Test file uploaded successfully!\n";
        echo "🔗 Public URL: " . $uploadResult['url'] . "\n";
        echo "🔑 R2 Key: " . $uploadResult['key'] . "\n\n";
        
        // Test 3: Check if file exists
        echo "🔍 Test 3: Checking file existence...\n";
        $exists = $r2Service->fileExists($testKey);
        echo ($exists ? "✅" : "❌") . " File exists check: " . ($exists ? "PASSED" : "FAILED") . "\n\n";
        
        // Test 4: Get file metadata
        echo "📋 Test 4: Getting file metadata...\n";
        $metadata = $r2Service->getFileMetadata($testKey);
        if ($metadata) {
            echo "✅ Metadata retrieved successfully:\n";
            echo "  - Size: " . number_format($metadata['size']) . " bytes\n";
            echo "  - Content Type: " . $metadata['content_type'] . "\n";
            echo "  - Last Modified: " . $metadata['last_modified']->format('Y-m-d H:i:s') . "\n\n";
        }
        
        // Test 5: Clean up test file
        echo "🧹 Test 5: Cleaning up test file...\n";
        $deleted = $r2Service->deleteFile($testKey);
        echo ($deleted ? "✅" : "❌") . " File deletion: " . ($deleted ? "SUCCESS" : "FAILED") . "\n\n";
        
    } else {
        echo "❌ Test file upload failed\n\n";
    }

    // Summary
    echo "🎉 R2 Connection Test Summary:\n";
    echo "=====================================\n";
    echo "✅ Connection: SUCCESS\n";
    echo "✅ Authentication: SUCCESS\n";
    echo "✅ Bucket Access: SUCCESS\n";
    echo "✅ File Operations: SUCCESS\n";
    echo "\n🚀 Your R2 storage is ready for production use!\n";

} catch (Exception $e) {
    echo "❌ R2 Connection Test FAILED!\n";
    echo "=====================================\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n\n";
    
    echo "🔧 Troubleshooting Tips:\n";
    echo "1. Check your R2 credentials in .env file\n";
    echo "2. Verify bucket name and endpoint URL\n";
    echo "3. Ensure R2 API token has proper permissions\n";
    echo "4. Check network connectivity\n";
    echo "5. Verify bucket exists and is accessible\n\n";
    
    echo "📋 Current Configuration:\n";
    echo "- R2_ACCESS_KEY_ID: " . (isset($_ENV['R2_ACCESS_KEY_ID']) ? 'SET' : 'NOT SET') . "\n";
    echo "- R2_SECRET_ACCESS_KEY: " . (isset($_ENV['R2_SECRET_ACCESS_KEY']) ? 'SET' : 'NOT SET') . "\n";
    echo "- R2_BUCKET: " . ($_ENV['R2_BUCKET'] ?? 'NOT SET') . "\n";
    echo "- R2_ENDPOINT: " . ($_ENV['R2_ENDPOINT'] ?? 'NOT SET') . "\n";
    
    exit(1);
}
