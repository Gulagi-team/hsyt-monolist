<?php

declare(strict_types=1);

use App\Application\Settings\SettingsInterface;
use Slim\App;
use Tuupola\Middleware\CorsMiddleware;

return function (App $app) {
    $container = $app->getContainer();
    $settings = $container->get(SettingsInterface::class);
    
    // CORS Middleware
    $corsSettings = $settings->get('cors');
    
    // Allow multiple origins for development
    $allowedOrigins = [
        $corsSettings['origin'],
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ];
    
    // Add dynamic origins for browser preview (ports 50000-65535)
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        if (preg_match('/^http:\/\/(localhost|127\.0\.0\.1):\d+$/', $origin)) {
            $allowedOrigins[] = $origin;
        }
    }
    
    $app->add(new CorsMiddleware([
        "origin" => $allowedOrigins,
        "methods" => ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "headers.allow" => ["Authorization", "Content-Type", "X-Requested-With"],
        "headers.expose" => [],
        "credentials" => true,
        "cache" => 0,
    ]));

    // Parse json, form data and xml
    $app->addBodyParsingMiddleware();
};
