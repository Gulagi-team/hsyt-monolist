<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '5432';
$dbname = $_ENV['DB_NAME'] ?? 'hosoyte';
$user = $_ENV['DB_USER'] ?? 'postgres';
$password = $_ENV['DB_PASS'] ?? 'password';

$dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";

try {
    echo "🔗 Connecting to database...\n";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "✅ Connected.\n\n";

    $migrationDir = __DIR__ . '/../database';
    $migrationFiles = glob($migrationDir . '/migration_*.sql');

    if (!$migrationFiles) {
        echo "ℹ️ No migration files found in {$migrationDir}.\n";
        exit(0);
    }

    sort($migrationFiles);

    // Ensure schema_migrations tracking table exists
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )');

    foreach ($migrationFiles as $filePath) {
        $fileName = basename($filePath);

        // Skip if already executed
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM schema_migrations WHERE file_name = :file_name');
        $stmt->execute(['file_name' => $fileName]);

        if ($stmt->fetchColumn() > 0) {
            echo "⏭️  Skipping {$fileName} (already applied).\n";
            continue;
        }

        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new RuntimeException("Failed to read migration file: {$fileName}");
        }

        // Skip MySQL-specific migrations that are not compatible with PostgreSQL
        if (preg_match('/\bUSE\s+/i', $sql) || preg_match('/\bMODIFY\s+COLUMN\b/i', $sql)) {
            echo "⚠️  Skipping {$fileName} (detected MySQL-specific syntax).\n";
            continue;
        }

        echo "🚀 Running migration {$fileName}...\n";

        $pdo->beginTransaction();
        try {
            $pdo->exec($sql);
            $insert = $pdo->prepare('INSERT INTO schema_migrations (file_name) VALUES (:file_name)');
            $insert->execute(['file_name' => $fileName]);
            $pdo->commit();
            echo "✅ Migration {$fileName} applied successfully.\n";
        } catch (Throwable $migrationError) {
            $pdo->rollBack();
            throw $migrationError;
        }
    }

    echo "\n🎉 All migrations are up to date.\n";
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Throwable $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
