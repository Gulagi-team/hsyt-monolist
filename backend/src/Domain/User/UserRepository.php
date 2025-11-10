<?php

declare(strict_types=1);

namespace App\Domain\User;

interface UserRepository
{
    public function findUserByName(string $name): ?User;
    
    public function findUserByEmail(string $email): ?User;
    
    public function findUserById(int $id): ?User;
    
    public function findUserByEmailVerificationToken(string $token): ?User;
    
    public function findUserByResetPasswordToken(string $token): ?User;
    
    public function createUser(User $user): User;
    
    public function updateUser(User $user): User;
    
    public function deleteUser(int $id): bool;
}
