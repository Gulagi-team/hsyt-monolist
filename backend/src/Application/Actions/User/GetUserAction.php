<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpNotFoundException;

class GetUserAction extends UserAction
{
    protected function action(): Response
    {
        $userId = (int) $this->resolveArg('id');
        $user = $this->userRepository->findUserById($userId);

        if (!$user) {
            throw new HttpNotFoundException($this->request, 'User not found');
        }

        return $this->respondWithData($user);
    }
}
