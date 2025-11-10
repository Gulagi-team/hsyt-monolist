<?php

declare(strict_types=1);

use App\Application\Settings\Settings;
use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Monolog\Logger;

return function (ContainerBuilder $containerBuilder) {
    // Global Settings Object
    $containerBuilder->addDefinitions([
        SettingsInterface::class => function () {
            return new Settings([
                'displayErrorDetails' => $_ENV['APP_DEBUG'] === 'true',
                'logError'            => true,
                'logErrorDetails'     => true,
                'logger' => [
                    'name' => 'medical-profile-api',
                    'path' => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/../logs/app.log',
                    'level' => Logger::DEBUG,
                ],
                'db' => [
                    'host' => $_ENV['DB_HOST'],
                    'port' => $_ENV['DB_PORT'] ?? '5432',
                    'database' => $_ENV['DB_NAME'],
                    'username' => $_ENV['DB_USER'],
                    'password' => $_ENV['DB_PASS'],
                    'driver' => 'pgsql',
                ],
                'jwt' => [
                    'secret' => $_ENV['JWT_SECRET'],
                    'algorithm' => $_ENV['JWT_ALGORITHM'],
                ],
                'cors' => [
                    'origin' => $_ENV['CORS_ORIGIN'],
                ],
                'upload' => [
                    'path' => $_ENV['UPLOAD_PATH'] ?? 'uploads/',
                    'maxFileSize' => (int)($_ENV['MAX_FILE_SIZE'] ?? 10485760), // 10MB default
                ],
            ]);
        }
    ]);
};
