<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\User;

use App\Domain\User\User;
use App\Domain\User\UserRepository;
use PDO;

class DatabaseUserRepository implements UserRepository
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function findUserByName(string $name): ?User
    {
        $query = 'SELECT * FROM users WHERE name = :name';
        $statement = $this->connection->prepare($query);
        $statement->execute(['name' => $name]);
        
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->createUserFromRow($row);
    }

    public function findUserByEmail(string $email): ?User
    {
        $query = 'SELECT * FROM users WHERE email = :email';
        $statement = $this->connection->prepare($query);
        $statement->execute(['email' => $email]);
        
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->createUserFromRow($row);
    }

    public function findUserByEmailVerificationToken(string $token): ?User
    {
        $query = 'SELECT * FROM users WHERE email_verification_token = :token';
        $statement = $this->connection->prepare($query);
        $statement->execute(['token' => $token]);
        
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->createUserFromRow($row);
    }

    public function findUserByResetPasswordToken(string $token): ?User
    {
        $query = 'SELECT * FROM users WHERE reset_password_token = :token AND reset_password_expires > NOW()';
        $statement = $this->connection->prepare($query);
        $statement->execute(['token' => $token]);
        
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->createUserFromRow($row);
    }

    public function findUserById(int $id): ?User
    {
        $query = 'SELECT * FROM users WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id]);
        
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->createUserFromRow($row);
    }

    public function createUser(User $user): User
    {
        $query = 'INSERT INTO users (name, email, password_hash, age, blood_type, allergies, current_conditions, points,
                  email_verified, email_verification_token, reset_password_token, reset_password_expires,
                  created_at, updated_at)
                  VALUES (:name, :email, :password_hash, :age, :blood_type, :allergies, :current_conditions, :points,
                  :email_verified, :email_verification_token, :reset_password_token, :reset_password_expires,
                  :created_at, :updated_at)';
        
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'password_hash' => $user->getPasswordHash(),
            'age' => $user->getAge(),
            'blood_type' => $user->getBloodType(),
            'allergies' => $user->getAllergies(),
            'current_conditions' => $user->getCurrentConditions(),
            'points' => $user->getPoints(),
            'email_verified' => $user->isEmailVerified() ? 1 : 0,
            'email_verification_token' => $user->getEmailVerificationToken(),
            'reset_password_token' => $user->getResetPasswordToken(),
            'reset_password_expires' => $user->getResetPasswordExpires(),
            'created_at' => $user->getCreatedAt(),
            'updated_at' => $user->getUpdatedAt(),
        ]);

        $userId = (int) $this->connection->lastInsertId();
        
        return new User(
            $userId,
            $user->getName(),
            $user->getEmail(),
            $user->getPasswordHash(),
            $user->getAge(),
            $user->getBloodType(),
            $user->getAllergies(),
            $user->getCurrentConditions(),
            $user->getPoints(),
            $user->isEmailVerified(),
            $user->getEmailVerificationToken(),
            $user->getResetPasswordToken(),
            $user->getResetPasswordExpires(),
            $user->getCreatedAt(),
            $user->getUpdatedAt()
        );
    }

    public function updateUser(User $user): User
    {
        $query = 'UPDATE users SET name = :name, email = :email, password_hash = :password_hash,
                  age = :age, blood_type = :blood_type, allergies = :allergies,
                  current_conditions = :current_conditions, points = :points, email_verified = :email_verified,
                  email_verification_token = :email_verification_token,
                  reset_password_token = :reset_password_token,
                  reset_password_expires = :reset_password_expires,
                  updated_at = :updated_at WHERE id = :id';
        
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'password_hash' => $user->getPasswordHash(),
            'age' => $user->getAge(),
            'blood_type' => $user->getBloodType(),
            'allergies' => $user->getAllergies(),
            'current_conditions' => $user->getCurrentConditions(),
            'points' => $user->getPoints(),
            'email_verified' => $user->isEmailVerified() ? 1 : 0,
            'email_verification_token' => $user->getEmailVerificationToken(),
            'reset_password_token' => $user->getResetPasswordToken(),
            'reset_password_expires' => $user->getResetPasswordExpires(),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $user;
    }

    public function deleteUser(int $id): bool
    {
        $query = 'DELETE FROM users WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id]);
        
        return $statement->rowCount() > 0;
    }

    private function createUserFromRow(array $row): User
    {
        return new User(
            (int) $row['id'],
            $row['name'],
            $row['email'],
            $row['password_hash'],
            (int) $row['age'],
            $row['blood_type'],
            $row['allergies'] ?? null,
            $row['current_conditions'] ?? null,
            isset($row['points']) ? (int) $row['points'] : 0,
            (bool) $row['email_verified'],
            $row['email_verification_token'],
            $row['reset_password_token'],
            $row['reset_password_expires'],
            $row['created_at'],
            $row['updated_at']
        );
    }
}
