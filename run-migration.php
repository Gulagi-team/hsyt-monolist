<?php
require_once 'backend/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/backend');
$dotenv->load();

// Database connection
$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '5432';
$dbname = $_ENV['DB_NAME'] ?? 'hosoyte';
$user = $_ENV['DB_USER'] ?? 'postgres';
$password = $_ENV['DB_PASS'] ?? 'password';

$dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

try {
    echo "🔗 Connecting to database...\n";
    echo "Host: $host:$port\n";
    echo "Database: $dbname\n";
    echo "User: $user\n\n";
    
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ Connected to database successfully!\n\n";
    
    // Check if column already exists
    echo "🔍 Checking if r2_url column exists...\n";
    $checkQuery = "SELECT column_name FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'r2_url'";
    $result = $pdo->query($checkQuery)->fetch();
    
    if ($result) {
        echo "✅ Column r2_url already exists!\n";
    } else {
        echo "➕ Adding r2_url column...\n";
        
        // Add the column
        $addColumnQuery = "ALTER TABLE medical_records ADD COLUMN r2_url TEXT";
        $pdo->exec($addColumnQuery);
        
        // Add comment
        $commentQuery = "COMMENT ON COLUMN medical_records.r2_url IS 'Public URL to access the file from R2 storage'";
        $pdo->exec($commentQuery);
        
        echo "✅ Column r2_url added successfully!\n";
    }
    
    // Verify the column
    echo "\n🔍 Verifying column structure...\n";
    $verifyQuery = "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'r2_url'";
    $columnInfo = $pdo->query($verifyQuery)->fetch();
    
    if ($columnInfo) {
        echo "Column: " . $columnInfo['column_name'] . "\n";
        echo "Type: " . $columnInfo['data_type'] . "\n";
        echo "Nullable: " . $columnInfo['is_nullable'] . "\n";
        echo "✅ Migration completed successfully!\n";
    } else {
        echo "❌ Column verification failed!\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
