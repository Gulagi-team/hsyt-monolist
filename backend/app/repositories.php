<?php

declare(strict_types=1);

use App\Domain\User\UserRepository;
use App\Domain\MedicalRecord\MedicalRecordRepository;
use App\Domain\Chat\ChatHistoryRepository;
use App\Infrastructure\Persistence\User\DatabaseUserRepository;
use App\Infrastructure\Persistence\MedicalRecord\DatabaseMedicalRecordRepository;
use App\Infrastructure\Persistence\Chat\DatabaseChatHistoryRepository;
use App\Application\Actions\MedicalRecord\CreatePublicShareAction;
use App\Application\Actions\MedicalRecord\ListPublicSharesAction;
use App\Application\Actions\MedicalRecord\ViewPublicRecordAction;
use App\Application\Actions\MedicalRecord\DisablePublicShareAction;
use App\Application\Services\GenAIService;
use DI\ContainerBuilder;
use Psr\Container\ContainerInterface;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        UserRepository::class => function (ContainerInterface $c) {
            return new DatabaseUserRepository($c->get(PDO::class));
        },
        
        MedicalRecordRepository::class => function (ContainerInterface $c) {
            return new DatabaseMedicalRecordRepository($c->get(PDO::class));
        },

        ChatHistoryRepository::class => function (ContainerInterface $c) {
            return new DatabaseChatHistoryRepository($c->get(PDO::class));
        },

        UploadAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $settings = $c->get(\App\Application\Settings\SettingsInterface::class);
            $r2Storage = $c->get(\App\Application\Services\R2StorageService::class);
            
            $uploadPath = $settings->get('upload')['path'] ?? 'uploads/';
            $maxFileSize = $settings->get('upload')['maxFileSize'] ?? 10485760; // 10MB default
            
            // Ensure upload directory exists (for temporary files)
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            
            return new UploadAction($logger, $uploadPath, $maxFileSize, $r2Storage);
        },

        AnalyzeAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $genAIService = $c->get(GenAIService::class);
            $classificationService = $c->get(\App\Application\Services\DocumentClassificationService::class);
            $reportParsingService = $c->get(\App\Application\Services\ReportParsingService::class);
            $contextExtractionService = $c->get(\App\Application\Services\MedicalContextExtractionService::class);
            $medicalRecordRepository = $c->get(MedicalRecordRepository::class);
            $userRepository = $c->get(UserRepository::class);
            
            return new AnalyzeAction($logger, $genAIService, $classificationService, $reportParsingService, $contextExtractionService, $medicalRecordRepository, $userRepository);
        },

        \App\Application\Actions\Chat\MedicalChatAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $genAIService = $c->get(GenAIService::class);
            $aiContextService = $c->get(\App\Application\Services\AIContextService::class);
            $userRepository = $c->get(UserRepository::class);
            $chatHistoryRepository = $c->get(ChatHistoryRepository::class);
            $pdo = $c->get(PDO::class);
            
            return new \App\Application\Actions\Chat\MedicalChatAction(
                $logger,
                $genAIService,
                $aiContextService,
                $userRepository,
                $chatHistoryRepository,
                $pdo
            );
        },

        \App\Application\Actions\Chat\CreateChatSessionAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $chatHistoryRepository = $c->get(ChatHistoryRepository::class);
            $userRepository = $c->get(UserRepository::class);

            return new \App\Application\Actions\Chat\CreateChatSessionAction(
                $logger,
                $chatHistoryRepository,
                $userRepository
            );
        },

        // MedicalRecord Actions
        CreatePublicShareAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $medicalRecordRepository = $c->get(MedicalRecordRepository::class);
            $userRepository = $c->get(UserRepository::class);
            
            return new CreatePublicShareAction($logger, $medicalRecordRepository, $userRepository);
        },

        ListPublicSharesAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $medicalRecordRepository = $c->get(MedicalRecordRepository::class);
            $userRepository = $c->get(UserRepository::class);
            
            return new ListPublicSharesAction($logger, $medicalRecordRepository, $userRepository);
        },

        ViewPublicRecordAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $medicalRecordRepository = $c->get(MedicalRecordRepository::class);
            $userRepository = $c->get(UserRepository::class);
            
            return new ViewPublicRecordAction($logger, $medicalRecordRepository, $userRepository);
        },

        DisablePublicShareAction::class => function (ContainerInterface $c) {
            $logger = $c->get(\Psr\Log\LoggerInterface::class);
            $medicalRecordRepository = $c->get(MedicalRecordRepository::class);
            $userRepository = $c->get(UserRepository::class);
            
            return new DisablePublicShareAction($logger, $medicalRecordRepository, $userRepository);
        },
    ]);
};
