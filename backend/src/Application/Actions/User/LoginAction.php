<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;

class LoginAction extends UserAction
{
    protected function action(): Response
    {
        $formData = $this->getFormData();
        
        if (!isset($formData['email']) || empty(trim($formData['email']))) {
            throw new HttpBadRequestException($this->request, 'Email là bắt buộc');
        }
        
        if (!isset($formData['password']) || empty(trim($formData['password']))) {
            throw new HttpBadRequestException($this->request, 'Mật khẩu là bắt buộc');
        }

        $email = trim($formData['email']);
        $password = trim($formData['password']);
        
        // Find user by email
        $user = $this->userRepository->findUserByEmail($email);
        
        if (!$user) {
            throw new HttpUnauthorizedException($this->request, 'Email hoặc mật khẩu không đúng');
        }
        
        // Verify password
        if (!password_verify($password, $user->getPasswordHash())) {
            throw new HttpUnauthorizedException($this->request, 'Email hoặc mật khẩu không đúng');
        }
        
        // Check if email is verified
        if (!$user->isEmailVerified()) {
            throw new HttpUnauthorizedException($this->request, 'Vui lòng xác thực email trước khi đăng nhập');
        }

        // Generate JWT token
        $payload = [
            'iss' => 'medical-profile-api',
            'aud' => 'medical-profile-app',
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60), // 24 hours
            'user_id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail()
        ];

        $jwt = JWT::encode($payload, $_ENV['JWT_SECRET'], $_ENV['JWT_ALGORITHM']);

        return $this->respondWithData([
            'token' => $jwt,
            'user' => $user,
            'message' => 'Đăng nhập thành công'
        ]);
    }
}
