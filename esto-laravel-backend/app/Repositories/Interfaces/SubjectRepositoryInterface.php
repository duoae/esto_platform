<?php

namespace App\Repositories\Interfaces;

interface SubjectRepositoryInterface
{
    public function getAllFiltered(array $filters = []);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
}
