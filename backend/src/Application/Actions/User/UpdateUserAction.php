<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;

class UpdateUserAction extends UserAction
{
    protected function action(): Response
    {
        $userId = (int) $this->resolveArg('id');
        $formData = $this->getFormData();

        $existingUser = $this->userRepository->findUserById($userId);
        if (!$existingUser) {
            throw new HttpNotFoundException($this->request, 'User not found');
        }

        // Validate required fields
        $requiredFields = ['name', 'age', 'bloodType', 'allergies', 'currentConditions'];
        foreach ($requiredFields as $field) {
            if (!isset($formData[$field])) {
                throw new HttpBadRequestException($this->request, "Field '{$field}' is required");
            }
        }

        $updatedUser = new User(
            $userId,
            $formData['name'],
            $existingUser->getEmail(),
            $existingUser->getPasswordHash(),
            (int) $formData['age'],
            $formData['bloodType'],
            $formData['allergies'],
            $formData['currentConditions'],
            $existingUser->getPoints(),
            $existingUser->isEmailVerified(),
            $existingUser->getEmailVerificationToken(),
            $existingUser->getResetPasswordToken(),
            $existingUser->getResetPasswordExpires(),
            $existingUser->getCreatedAt(),
            date('Y-m-d H:i:s')
        );

        $user = $this->userRepository->updateUser($updatedUser);

        return $this->respondWithData($user);
    }
}
