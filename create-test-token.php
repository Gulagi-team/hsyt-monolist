<?php
require_once 'backend/vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/backend');
$dotenv->load();

// JWT configuration
$jwtSecret = $_ENV['JWT_SECRET'] ?? 'your-secret-key-here';
$jwtAlgorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';

// Create payload for user ID 1
$payload = [
    'user_id' => 1,
    'email' => 'test@example.com',
    'iat' => time(),
    'exp' => time() + (24 * 60 * 60) // 24 hours
];

// Generate token
$token = JWT::encode($payload, $jwtSecret, $jwtAlgorithm);

echo "Generated JWT Token:\n";
echo $token . "\n\n";

// Verify token works
try {
    $decoded = JWT::decode($token, new Key($jwtSecret, $jwtAlgorithm));
    echo "Token verification successful!\n";
    echo "User ID: " . $decoded->user_id . "\n";
    echo "Email: " . $decoded->email . "\n";
    echo "Expires: " . date('Y-m-d H:i:s', $decoded->exp) . "\n";
} catch (Exception $e) {
    echo "Token verification failed: " . $e->getMessage() . "\n";
}
?>
