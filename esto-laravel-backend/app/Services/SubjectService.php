<?php

namespace App\Services;

use App\Repositories\Interfaces\SubjectRepositoryInterface;

class SubjectService
{
    protected $subjectRepository;

    public function __construct(SubjectRepositoryInterface $subjectRepository)
    {
        $this->subjectRepository = $subjectRepository;
    }

    public function getAllSubjects(array $filters = [])
    {
        return $this->subjectRepository->getAllFiltered($filters);
    }

    public function createSubject(array $data)
    {
        return $this->subjectRepository->create($data);
    }

    public function updateSubject(int $id, array $data)
    {
        return $this->subjectRepository->update($id, $data);
    }

    public function deleteSubject(int $id)
    {
        return $this->subjectRepository->delete($id);
    }
}
