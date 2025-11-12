<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\User;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;
use Respect\Validation\Validator as v;

class RegisterAction extends UserAction
{
    protected function action(): Response
    {
        $formData = $this->getFormData();
        
        // Validate required fields
        if (!isset($formData['name']) || empty(trim($formData['name']))) {
            throw new HttpBadRequestException($this->request, 'Tên là bắt buộc');
        }
        
        if (!isset($formData['email']) || empty(trim($formData['email']))) {
            throw new HttpBadRequestException($this->request, 'Email là bắt buộc');
        }
        
        if (!isset($formData['password']) || empty(trim($formData['password']))) {
            throw new HttpBadRequestException($this->request, 'Mật khẩu là bắt buộc');
        }

        $name = trim($formData['name']);
        $email = trim($formData['email']);
        $password = trim($formData['password']);

        // Validate email format
        if (!v::email()->validate($email)) {
            throw new HttpBadRequestException($this->request, 'Email không hợp lệ');
        }

        // Validate password strength
        if (strlen($password) < 6) {
            throw new HttpBadRequestException($this->request, 'Mật khẩu phải có ít nhất 6 ký tự');
        }

        // Check if user already exists
        $existingUser = $this->userRepository->findUserByEmail($email);
        if ($existingUser) {
            throw new HttpBadRequestException($this->request, 'Email đã được sử dụng');
        }

        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Generate email verification token
        $emailVerificationToken = bin2hex(random_bytes(32));

        // Create new user
        $user = new User(
            null,
            $name,
            $email,
            $passwordHash,
            30, // Default age
            'O+', // Default blood type
            'Không có', // Default allergies
            'Khỏe mạnh', // Default conditions
            1, // Default points
            false, // Email not verified initially
            $emailVerificationToken
        );

        $createdUser = $this->userRepository->createUser($user);

        // Generate JWT token
        $payload = [
            'iss' => 'medical-profile-api',
            'aud' => 'medical-profile-app',
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60), // 24 hours
            'user_id' => $createdUser->getId(),
            'name' => $createdUser->getName(),
            'email' => $createdUser->getEmail()
        ];

        $jwt = JWT::encode($payload, $_ENV['JWT_SECRET'], $_ENV['JWT_ALGORITHM']);

        // TODO: Send email verification email
        // For now, we'll automatically verify the email
        $createdUser->setEmailVerified(true);
        $createdUser->setEmailVerificationToken(null);
        $this->userRepository->updateUser($createdUser);

        return $this->respondWithData([
            'token' => $jwt,
            'user' => $createdUser,
            'message' => 'Đăng ký thành công'
        ], 201);
    }
}
