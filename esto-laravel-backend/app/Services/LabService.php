<?php

namespace App\Services;

use App\Repositories\Interfaces\LabRepositoryInterface;

class LabService
{
    protected $labRepository;

    public function __construct(LabRepositoryInterface $labRepository)
    {
        $this->labRepository = $labRepository;
    }

    public function getAllLabs()
    {
        return $this->labRepository->getAll();
    }

    public function getLabById(int $id)
    {
        return $this->labRepository->getById($id);
    }

    public function createLab(array $data)
    {
        return $this->labRepository->create($data);
    }

    public function updateLab(int $id, array $data)
    {
        return $this->labRepository->update($id, $data);
    }

    public function deleteLab(int $id)
    {
        return $this->labRepository->delete($id);
    }
}
