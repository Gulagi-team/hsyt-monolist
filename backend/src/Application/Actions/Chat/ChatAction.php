<?php

declare(strict_types=1);

namespace App\Application\Actions\Chat;

use App\Application\Actions\Action;
use App\Domain\Chat\ChatHistoryRepository;
use App\Domain\User\User;
use App\Domain\User\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpUnauthorizedException;

abstract class ChatAction extends Action
{
    protected ChatHistoryRepository $chatHistoryRepository;
    protected UserRepository $userRepository;

    public function __construct(
        LoggerInterface $logger,
        ChatHistoryRepository $chatHistoryRepository,
        UserRepository $userRepository
    ) {
        parent::__construct($logger);
        $this->chatHistoryRepository = $chatHistoryRepository;
        $this->userRepository = $userRepository;
    }

    protected function getCurrentUser(): User
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            throw new HttpUnauthorizedException($this->request, 'Token không hợp lệ');
        }

        $token = substr($authHeader, 7);

        try {
            $jwtSecret = $_ENV['JWT_SECRET'] ?? '';
            $jwtAlgorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';

            $decoded = JWT::decode($token, new Key($jwtSecret, $jwtAlgorithm));
            $userId = $decoded->user_id;

            $user = $this->userRepository->findUserById($userId);
            if (!$user) {
                throw new HttpUnauthorizedException($this->request, 'Người dùng không tồn tại');
            }

            return $user;
        } catch (\Exception $e) {
            throw new HttpUnauthorizedException($this->request, 'Token không hợp lệ: ' . $e->getMessage());
        }
    }
}
