<?php
namespace App\Repositories;
use App\Models\SujetThese;
use App\Repositories\Interfaces\SubjectRepositoryInterface;

class SubjectRepository implements SubjectRepositoryInterface
{
    public function getAll() { return SujetThese::with(['laboratoire', 'enseignant'])->get(); }
    public function getById(int $id) { return SujetThese::with(['laboratoire', 'enseignant'])->findOrFail($id); }
    public function getAllFiltered(array $filters = []) {
        $query = SujetThese::with(['laboratoire', 'enseignant']);
        
        if (isset($filters['lab']) && $filters['lab']) {
            $query->where('laboratoire_id', $filters['lab']);
        }
        
        if (isset($filters['enseignant_id']) && $filters['enseignant_id']) {
            $query->where('enseignant_id', $filters['enseignant_id']);
        }

        return $query->get(); 
    }
    public function create(array $data) { return SujetThese::create($data); }
    public function update(int $id, array $data) {
        $subject = $this->getById($id);
        $subject->update($data);
        return $subject;
    }
    public function delete(int $id) { return $this->getById($id)->delete(); }
}
