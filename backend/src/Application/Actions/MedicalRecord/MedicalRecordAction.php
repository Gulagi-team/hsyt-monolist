<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use App\Application\Actions\Action;
use App\Domain\MedicalRecord\MedicalRecordRepository;
use App\Domain\User\UserRepository;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpUnauthorizedException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

abstract class MedicalRecordAction extends Action
{
    protected MedicalRecordRepository $medicalRecordRepository;
    protected UserRepository $userRepository;

    public function __construct(LoggerInterface $logger, MedicalRecordRepository $medicalRecordRepository, UserRepository $userRepository)
    {
        parent::__construct($logger);
        $this->medicalRecordRepository = $medicalRecordRepository;
        $this->userRepository = $userRepository;
    }

    protected function getCurrentUser()
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        
        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            throw new HttpUnauthorizedException($this->request, 'Token xác thực là bắt buộc');
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], $_ENV['JWT_ALGORITHM']));
            $userId = $decoded->user_id;

            $user = $this->userRepository->findUserById($userId);
            if (!$user) {
                throw new HttpUnauthorizedException($this->request, 'Người dùng không tồn tại');
            }

            return $user;

        } catch (\Exception $e) {
            throw new HttpUnauthorizedException($this->request, 'Token không hợp lệ');
        }
    }

    protected function getUserIdFromToken(): int
    {
        $user = $this->getCurrentUser();
        return $user->getId();
    }
}
