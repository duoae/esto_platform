<?php

namespace App\Services;

use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class UserService
{
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getAllUsers(?string $role = null, ?string $labId = null)
    {
        return $this->userRepository->getAllByRoleAndLab($role, $labId);
    }

    public function getUserStats()
    {
        return $this->userRepository->getStats();
    }

    public function createUser(array $data)
    {
        $data['status'] = $data['status'] ?? 'actif';
        return $this->userRepository->create($data);
    }

    public function updateUser(int $id, array $data)
    {
        return $this->userRepository->update($id, $data);
    }

    public function deleteUser(int $id)
    {
        return $this->userRepository->delete($id);
    }
}
