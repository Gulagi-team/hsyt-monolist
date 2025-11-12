<?php

declare(strict_types=1);

use App\Application\Actions\User\LoginAction;
use App\Application\Actions\User\RegisterAction;
use App\Application\Actions\User\GetUserAction;
use App\Application\Actions\User\UpdateUserAction;
use App\Application\Actions\MedicalRecord\ListRecordsAction;
use App\Application\Actions\MedicalRecord\CreateRecordAction;
use App\Application\Actions\MedicalRecord\GetRecordAction;
use App\Application\Actions\MedicalRecord\DeleteRecordAction;
use App\Application\Actions\MedicalRecord\CreatePublicShareAction;
use App\Application\Actions\MedicalRecord\ListPublicSharesAction;
use App\Application\Actions\MedicalRecord\ViewPublicRecordAction;
use App\Application\Actions\MedicalRecord\DisablePublicShareAction;
use App\Application\Actions\Analysis\AnalyzeAction;
use App\Application\Actions\Upload\UploadAction;
use App\Application\Actions\Chat\MedicalChatAction;
use App\Application\Actions\Chat\ListChatSessionsAction;
use App\Application\Actions\Chat\GetChatSessionMessagesAction;
use App\Application\Actions\Chat\CreateChatSessionAction;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        // CORS Pre-Flight OPTIONS Request Handler
        return $response;
    });

    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write(json_encode([
            'message' => 'Medical Profile API',
            'version' => '1.0.0',
            'status' => 'running'
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    $app->group('/api', function (Group $group) {
        // Authentication routes
        $group->post('/login', LoginAction::class);
        $group->post('/register', RegisterAction::class);

        // User routes
        $group->get('/users/{id}', GetUserAction::class);
        $group->put('/users/{id}', UpdateUserAction::class);

        // Medical records routes
        $group->get('/users/{userId}/records', ListRecordsAction::class);
        $group->post('/records', CreateRecordAction::class);
        $group->get('/records/{id}', GetRecordAction::class);
        $group->delete('/records/{id}', DeleteRecordAction::class);

        // Public sharing routes (require authentication)
        $group->post('/medical-records/{recordId}/share', CreatePublicShareAction::class);
        $group->get('/users/{userId}/shares', ListPublicSharesAction::class);
        $group->delete('/shares/{shareId}', DisablePublicShareAction::class);

        // File upload route
        $group->post('/upload', UploadAction::class);
        
        // Analysis route
        $group->post('/analyze', AnalyzeAction::class);
        
        // Medical chat route
        $group->post('/chat/medical', MedicalChatAction::class);
        $group->post('/chat/sessions', CreateChatSessionAction::class);
        $group->get('/chat/sessions', ListChatSessionsAction::class);
        $group->get('/chat/sessions/{sessionId}/messages', GetChatSessionMessagesAction::class);
    });

    // Public routes (no authentication required)
    $app->post('/api/public/share/{shareToken}', ViewPublicRecordAction::class);
};
