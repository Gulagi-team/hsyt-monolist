<?php

declare(strict_types=1);

use App\Application\Settings\SettingsInterface;
use App\Application\Services\GenAIService;
use App\Application\Services\DocumentClassificationService;
use App\Application\Services\ReportParsingService;
use App\Application\Services\MedicalContextExtractionService;
use App\Application\Services\R2StorageService;
use DI\ContainerBuilder;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        LoggerInterface::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);

            $loggerSettings = $settings->get('logger');
            $logger = new Logger($loggerSettings['name']);

            $processor = new UidProcessor();
            $logger->pushProcessor($processor);

            $handler = new StreamHandler($loggerSettings['path'], $loggerSettings['level']);
            $logger->pushHandler($handler);

            return $logger;
        },

        PDO::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);
            $dbSettings = $settings->get('db');
            
            $host = $dbSettings['host'];
            $port = $dbSettings['port'];
            $dbname = $dbSettings['database'];
            $username = $dbSettings['username'];
            $password = $dbSettings['password'];
            
            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
            return new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        },

        GenAIService::class => function (ContainerInterface $c) {
            $apiKey = $_ENV['GENAI_API_KEY'] ?? '';
            if (empty($apiKey)) {
                throw new \RuntimeException('GENAI_API_KEY environment variable is required');
            }
            
            $logger = $c->get(LoggerInterface::class);
            return new GenAIService($apiKey, $logger);
        },

        DocumentClassificationService::class => function (ContainerInterface $c) {
            $apiKey = $_ENV['GENAI_API_KEY'] ?? '';
            if (empty($apiKey)) {
                throw new \RuntimeException('GENAI_API_KEY environment variable is required');
            }
            
            $logger = $c->get(LoggerInterface::class);
            return new DocumentClassificationService($apiKey, $logger);
        },

        ReportParsingService::class => function (ContainerInterface $c) {
            $logger = $c->get(LoggerInterface::class);
            return new ReportParsingService($logger);
        },

        MedicalContextExtractionService::class => function (ContainerInterface $c) {
            $logger = $c->get(LoggerInterface::class);
            return new MedicalContextExtractionService($logger);
        },

        \App\Application\Services\AIContextService::class => function (ContainerInterface $c) {
            $logger = $c->get(LoggerInterface::class);
            $contextExtractionService = $c->get(MedicalContextExtractionService::class);
            return new \App\Application\Services\AIContextService($logger, $contextExtractionService);
        },

        R2StorageService::class => function (ContainerInterface $c) {
            $logger = $c->get(LoggerInterface::class);
            return new R2StorageService($logger);
        },

        \App\Application\Actions\Upload\UploadAction::class => function (ContainerInterface $c) {
            $logger = $c->get(LoggerInterface::class);
            $settings = $c->get(SettingsInterface::class);
            $uploadSettings = $settings->get('upload');
            $uploadPath = $uploadSettings['path'];
            $maxFileSize = $uploadSettings['maxFileSize'];
            $r2Storage = $c->get(R2StorageService::class);
            return new \App\Application\Actions\Upload\UploadAction($logger, $uploadPath, $maxFileSize, $r2Storage);
        },
    ]);
};
