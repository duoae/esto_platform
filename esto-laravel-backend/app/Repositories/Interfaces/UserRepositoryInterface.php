<?php

namespace App\Repositories\Interfaces;

interface UserRepositoryInterface
{
    public function getAllByRoleAndLab(?string $role, ?string $labId);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function getStats();
}
